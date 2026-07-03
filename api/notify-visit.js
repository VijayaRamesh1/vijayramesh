const MAX_FIELD_LENGTH = 500;

function truncate(value, max = MAX_FIELD_LENGTH) {
    if (value === null || value === undefined) return '';
    return String(value).slice(0, max);
}

function getHeader(req, name) {
    const value = req.headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

function getClientIp(req) {
    const forwardedFor = getHeader(req, 'x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    return getHeader(req, 'x-real-ip') || 'unknown';
}

function detectBrowser(userAgent) {
    if (/edg/i.test(userAgent)) return 'Edge';
    if (/opr|opera/i.test(userAgent)) return 'Opera';
    if (/chrome|crios/i.test(userAgent)) return 'Chrome';
    if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    return 'Unknown';
}

function detectOs(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/android/i.test(userAgent)) return 'Android';
    if (/mac os|macintosh/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
}

function detectDevice(userAgent) {
    if (/bot|crawler|spider|preview|slurp/i.test(userAgent)) return 'Bot or crawler';
    if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
    if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
}

function escapeHtml(value) {
    return truncate(value, 2000)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function makeRows(rows) {
    return rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
            `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">${escapeHtml(label)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;">${escapeHtml(value)}</td>
            </tr>`
        ))
        .join('');
}

function buildEmail(payload, intelligence) {
    const rows = [
        ['Page', payload.url],
        ['Path', payload.path],
        ['Title', payload.title],
        ['Referrer', payload.referrer || 'Direct / unavailable'],
        ['UTM source', payload.utmSource],
        ['UTM medium', payload.utmMedium],
        ['UTM campaign', payload.utmCampaign],
        ['Visitor time', payload.visitorTime],
        ['Visitor timezone', payload.timezone],
        ['Language', payload.language],
        ['Screen', payload.screen],
        ['Viewport', payload.viewport],
        ['IP', intelligence.ip],
        ['Location', intelligence.location],
        ['Device', intelligence.device],
        ['Browser', intelligence.browser],
        ['OS', intelligence.os],
        ['User agent', intelligence.userAgent]
    ];

    const text = rows
        .filter(([, value]) => value)
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n');

    const html = `
        <div style="font-family:Inter,Arial,sans-serif;background:#f9fafb;padding:24px;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <div style="background:#111827;color:#00ff41;padding:18px 22px;">
                    <h1 style="font-size:18px;margin:0;">New visit on vijayramesh.vercel.app</h1>
                    <p style="font-size:13px;margin:6px 0 0;color:#d1d5db;">Visitor intelligence captured from the browser and Vercel request headers.</p>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    ${makeRows(rows)}
                </table>
            </div>
        </div>
    `;

    return { text, html };
}

function parseBody(req) {
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }

    return typeof req.body === 'object' && req.body ? req.body : {};
}

async function sendVisitEmail(payload, intelligence) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.VISITOR_NOTIFY_TO;
    const from = process.env.VISITOR_NOTIFY_FROM || 'Vijay Portfolio <onboarding@resend.dev>';

    if (!apiKey || !to) {
        return { skipped: true, reason: 'Missing RESEND_API_KEY or VISITOR_NOTIFY_TO' };
    }

    const { text, html } = buildEmail(payload, intelligence);
    const subjectPath = payload.path || '/';
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to,
            subject: `New portfolio visit: ${subjectPath}`,
            text,
            html
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend failed: ${response.status} ${errorText}`);
    }

    return { skipped: false };
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false });
    }

    if (process.env.VISITOR_NOTIFY_ENABLED === 'false') {
        return res.status(204).end();
    }

    try {
        const body = parseBody(req);
        const userAgent = truncate(getHeader(req, 'user-agent'), 1000);
        const city = getHeader(req, 'x-vercel-ip-city');
        const region = getHeader(req, 'x-vercel-ip-country-region');
        const country = getHeader(req, 'x-vercel-ip-country');
        const location = [city, region, country].filter(Boolean).join(', ');

        const payload = {
            url: truncate(body.url),
            path: truncate(body.path),
            title: truncate(body.title),
            referrer: truncate(body.referrer),
            utmSource: truncate(body.utmSource),
            utmMedium: truncate(body.utmMedium),
            utmCampaign: truncate(body.utmCampaign),
            visitorTime: truncate(body.visitorTime),
            timezone: truncate(body.timezone),
            language: truncate(body.language),
            screen: truncate(body.screen),
            viewport: truncate(body.viewport)
        };

        const intelligence = {
            ip: truncate(getClientIp(req), 100),
            location: truncate(location || 'Unavailable'),
            userAgent,
            browser: detectBrowser(userAgent),
            os: detectOs(userAgent),
            device: detectDevice(userAgent)
        };

        await sendVisitEmail(payload, intelligence);
        return res.status(204).end();
    } catch (error) {
        console.error('Visitor notification failed', error);
        return res.status(204).end();
    }
};
