(function () {
    const VISIT_KEY = 'vijay-portfolio-visit-notified';
    const VISIT_WINDOW_MS = 30 * 60 * 1000;
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    if (isLocal || !window.fetch) return;

    try {
        const previous = Number(sessionStorage.getItem(VISIT_KEY) || '0');
        if (Date.now() - previous < VISIT_WINDOW_MS) return;
        sessionStorage.setItem(VISIT_KEY, String(Date.now()));
    } catch (error) {
        // If sessionStorage is unavailable, still send the notification.
    }

    const params = new URLSearchParams(window.location.search);
    const payload = {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        visitorTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        language: navigator.language || '',
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/notify-visit', blob);
        return;
    }

    fetch('/api/notify-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
    }).catch(function () {});
})();
