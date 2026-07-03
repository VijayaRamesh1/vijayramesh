(function () {
    const RATE_LIMIT_MAX = 8;
    const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
    const STORAGE_KEY = 'vijaybot-question-log-v1';

    const suggestedQuestions = [
        'Give me the quick intro',
        'What role is he looking for?',
        'What AI products has he built?',
        'Why should a startup talk to him?'
    ];

    const answers = [
        {
            patterns: ['quick intro', 'intro', 'summary', 'overview', 'who is', 'about vijay', 'tell me about vijay'],
            text: 'Vijay is an AI Product Manager with 15+ years across financial services, telecom, and enterprise consulting, plus recent hands-on work in agentic AI, RAG, and LLM product delivery. He is strongest at turning fuzzy AI ideas into practical products.'
        },
        {
            patterns: ['looking for', 'open to', 'role looking', 'what role', 'opportunity', 'hire', 'hiring', 'startup', 'job search', 'next role'],
            text: 'He is looking for AI Product Manager, Technical Product Manager, or AI Product Lead roles where he can own discovery through delivery. He is especially interested in startups building with LLMs, RAG, agentic workflows, data platforms, or applied ML.'
        },
        {
            patterns: ['what does vijay do', 'what do you do', 'current work', 'role', 'work', 'job', 'profession'],
            text: 'Vijay turns AI and data ideas into shippable products. He writes PRDs, validates prototypes, defines evaluation criteria, aligns engineering and stakeholders, and helps move AI work from POC to production.'
        },
        {
            patterns: ['experience', 'years', 'background', 'expertise', 'ai products', 'worked on', 'built', 'projects'],
            text: 'His AI work includes RAG systems, ReAct-style troubleshooting agents, multi-agent research workflows, ML anomaly detection, NLP-powered compliance automation, propensity scoring, and data observability agents.'
        },
        {
            patterns: ['why startup', 'why hire', 'why should', 'strength', 'good fit', 'value', 'bring to team'],
            text: 'A startup should talk to Vijay if it needs someone who can work across ambiguity: validate the customer problem, prototype with AI tools, define the product path, and explain technical tradeoffs clearly to both engineers and executives.'
        },
        {
            patterns: ['skills', 'stack', 'tools', 'technical', 'python', 'llm', 'langchain', 'analytics'],
            text: 'His toolkit includes AI product strategy, PRDs for ML systems, RAG architecture, agent workflows, prompt and eval frameworks, Python and JavaScript/TypeScript working fluency, Azure, AWS Bedrock, Snowflake, Databricks, and product analytics.'
        },
        {
            patterns: ['ai pm', 'product manager', 'pm', 'machine learning pm'],
            text: 'An AI PM sits between user needs, business goals, and ML reality. Vijay’s edge is that he can go beyond slides: he can use AI coding tools to prototype, pressure-test ideas, and then hand engineering a clearer path to build.'
        },
        {
            patterns: ['agent', 'agentic', 'rag', 'react', 'multi agent', 'prototype', 'poc'],
            text: 'He has built or specified RAG and agentic workflows, including ReAct-style troubleshooting agents, researcher/evaluator loops, and LangGraph-style multi-agent pipelines with tracing and evaluation in mind from the start.'
        },
        {
            patterns: ['industries', 'domain', 'financial', 'finance', 'banking', 'telecom', 'consulting', 'enterprise'],
            text: 'His domain experience spans telecom, banking, payments, financial data products, compliance/RegTech, and enterprise consulting. That helps him connect AI capabilities to real operational workflows.'
        },
        {
            patterns: ['current', 't-mobile', 'hcl', 'tata', 'tcs', 'recent'],
            text: 'Recently, Vijay has led data and AI product work across telecom and enterprise platforms, including cloud modernization, data observability, AIOps requirements, Bedrock-based agent concepts, and stakeholder alignment with senior leaders.'
        },
        {
            patterns: ['education', 'mba', 'school', 'certification', 'certifications'],
            text: 'He has an MBA in Management Information Systems from IIT Bombay and a Bachelor of Engineering from Bangalore University, plus continuous learning in generative AI, AWS, API design, Agile product management, and NLP.'
        },
        {
            patterns: ['contact', 'reach', 'email', 'linkedin', 'twitter', 'x', 'medium', 'message'],
            text: 'You can reach Vijay on LinkedIn at linkedin.com/in/vijayakrishnar or on X at @VjK1124637. He also writes on Medium at @veejaykris.29.'
        },
        {
            patterns: ['compensation', 'salary', 'pay', 'money'],
            text: 'Compensation is not the first filter for him. He cares more about the problem, the team, the pace, and whether there is meaningful ownership.'
        },
        {
            patterns: ['remote', 'location', 'where', 'relocate'],
            text: 'Vijay is based in the Greater Toronto Area and is open to remote-friendly opportunities. The bigger fit question is the product problem, team speed, and ownership model.'
        },
        {
            patterns: ['writing', 'blog', 'articles', 'medium', 'posts'],
            text: 'He writes about AI product management and curates AI/ML developments through his newsletter. The voice is practical: what is useful, what is hype, and what it takes to ship.'
        },
        {
            patterns: ['fun', 'personality', 'outside work', 'beyond work'],
            text: 'Outside the serious product work, Vijay follows AI research, experiments with new tools, writes, and clearly enjoys giving his portfolio a little terminal-style personality.'
        }
    ];

    function getQuestionLog() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
            return saved.filter((timestamp) => timestamp > cutoff);
        } catch (error) {
            return [];
        }
    }

    function saveQuestionLog(log) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    }

    function getLimitState() {
        const log = getQuestionLog();
        const remaining = Math.max(0, RATE_LIMIT_MAX - log.length);
        const resetAt = log.length ? log[0] + RATE_LIMIT_WINDOW_MS : Date.now();
        return { log, remaining, resetAt };
    }

    function recordQuestion() {
        const state = getLimitState();
        state.log.push(Date.now());
        saveQuestionLog(state.log);
    }

    function normalize(text) {
        return text.toLowerCase().replace(/[^a-z0-9\s@.]/g, ' ');
    }

    function answerQuestion(question) {
        const normalized = normalize(question);
        let best = null;
        let bestScore = 0;

        answers.forEach((entry) => {
            const score = entry.patterns.reduce((count, pattern) => {
                if (!normalized.includes(pattern)) return count;
                return count + (pattern.includes(' ') ? 3 : 1);
            }, 0);

            if (score > bestScore) {
                best = entry;
                bestScore = score;
            }
        });

        if (best) {
            return best.text;
        }

        return 'I may not have a perfect canned answer for that yet. Useful short version: Vijay is an AI Product Manager focused on agentic AI, RAG, LLM products, and data-heavy workflows. Try asking about his experience, target roles, startup fit, prototypes, skills, industries, or contact info.';
    }

    function ensureWidgetShell() {
        let toggle = document.getElementById('chatToggle');
        let panel = document.getElementById('chatPanel');

        if (!toggle) {
            toggle = document.createElement('button');
            toggle.id = 'chatToggle';
            toggle.className = 'chat-widget-toggle';
            toggle.type = 'button';
            toggle.textContent = '>_';
            document.body.appendChild(toggle);
        }

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'chatPanel';
            panel.className = 'chat-widget-panel';
            document.body.appendChild(panel);
        }

        toggle.setAttribute('aria-label', 'Open chat with VijayBot');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.removeAttribute('onclick');

        panel.innerHTML = [
            '<div class="cw-titlebar">',
            '<div class="cw-dot cw-dot-r"></div>',
            '<div class="cw-dot cw-dot-y"></div>',
            '<div class="cw-dot cw-dot-g"></div>',
            '<span class="cw-title">vijaybot@portfolio</span>',
            '<button class="cw-close" type="button" aria-label="Close chat">x</button>',
            '</div>',
            '<div class="cw-body" id="cwBody"></div>',
            '<div class="cw-suggestions" id="cwSuggestions"></div>',
            '<div class="cw-limit" id="cwLimit"></div>',
            '<form class="cw-form" id="cwForm">',
            '<input class="cw-input" id="cwInput" type="text" maxlength="160" autocomplete="off" placeholder="Ask about Vijay..." aria-label="Ask VijayBot a question">',
            '<button class="cw-send" type="submit" aria-label="Send question">></button>',
            '</form>'
        ].join('');

        return { toggle, panel };
    }

    function addMessage(body, text, type) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cw-message';
        const bubble = document.createElement('div');
        bubble.className = type === 'user' ? 'cw-user' : 'cw-bot';
        bubble.textContent = text;
        wrapper.appendChild(bubble);
        body.appendChild(wrapper);
        body.scrollTop = body.scrollHeight;
    }

    function formatResetTime(resetAt) {
        const minutes = Math.max(1, Math.ceil((resetAt - Date.now()) / 60000));
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }

    function updateLimitUi(limit, input, send, suggestions) {
        const state = getLimitState();
        limit.textContent = `${state.remaining}/${RATE_LIMIT_MAX} questions left this hour`;

        const limited = state.remaining <= 0;
        input.disabled = limited;
        send.disabled = limited;
        suggestions.querySelectorAll('button').forEach((button) => {
            button.disabled = limited;
        });

        if (limited) {
            limit.textContent = `Rate limit reached. Try again in about ${formatResetTime(state.resetAt)}.`;
        }
    }

    function initWidget() {
        const { toggle, panel } = ensureWidgetShell();
        const body = panel.querySelector('#cwBody');
        const form = panel.querySelector('#cwForm');
        const input = panel.querySelector('#cwInput');
        const send = panel.querySelector('.cw-send');
        const close = panel.querySelector('.cw-close');
        const suggestions = panel.querySelector('#cwSuggestions');
        const limit = panel.querySelector('#cwLimit');

        suggestedQuestions.forEach((question) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cw-suggestion';
            button.textContent = question;
            button.addEventListener('click', () => submitQuestion(question));
            suggestions.appendChild(button);
        });

        function openPanel() {
            panel.classList.add('open');
            toggle.setAttribute('aria-label', 'Close chat with VijayBot');

            if (!panel.dataset.greeted) {
                panel.dataset.greeted = 'true';
                addMessage(body, 'Hi, I am VijayBot. Ask me quick questions about Vijay: his AI product work, target roles, agentic AI/RAG experience, startup fit, industries, skills, writing, or how to reach him.', 'bot');
            }

            updateLimitUi(limit, input, send, suggestions);
            input.focus();
        }

        function closePanel() {
            panel.classList.remove('open');
            toggle.setAttribute('aria-label', 'Open chat with VijayBot');
        }

        function submitQuestion(rawQuestion) {
            const question = rawQuestion.trim();
            if (!question) return;

            const state = getLimitState();
            if (state.remaining <= 0) {
                addMessage(body, `Rate limit reached. Try again in about ${formatResetTime(state.resetAt)}.`, 'bot');
                updateLimitUi(limit, input, send, suggestions);
                return;
            }

            recordQuestion();
            addMessage(body, question, 'user');
            input.value = '';
            updateLimitUi(limit, input, send, suggestions);

            window.setTimeout(() => {
                addMessage(body, answerQuestion(question), 'bot');
            }, 180);
        }

        toggle.addEventListener('click', () => {
            if (panel.classList.contains('open')) {
                closePanel();
            } else {
                openPanel();
            }
        });

        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle.click();
            }
        });

        close.addEventListener('click', closePanel);

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submitQuestion(input.value);
        });

        window.toggleChatWidget = function () {
            toggle.click();
        };

        updateLimitUi(limit, input, send, suggestions);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
