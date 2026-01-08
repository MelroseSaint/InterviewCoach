/**
 * Steady | Professional Interview Instrument
 */

class Steady {
    constructor() {
        this.config = JSON.parse(localStorage.getItem('steady_config')) || null;
        this.history = JSON.parse(localStorage.getItem('steady_history')) || [];
        this.isListening = false;
        this.recognition = null;

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupSpeech();
        this.checkFirstRun();
        this.renderHistory();
        this.setupEventListeners();
    }

    setupDOM() {
        this.dom = {
            wizard: document.getElementById('setup-wizard'),
            setupForm: document.getElementById('setup-form'),
            output: document.getElementById('coaching-output'),
            historyList: document.getElementById('session-history'),
            micToggle: document.getElementById('mic-toggle'),
            statusText: document.getElementById('status-text'),
            keyThemes: document.getElementById('key-themes'),
            toneIndicator: document.getElementById('tone-indicator'),
            groundingText: document.getElementById('grounding-text'),
            manualInput: document.getElementById('manual-input'),
            editProfileBtn: document.getElementById('edit-profile-btn'),
            clearSessionBtn: document.getElementById('clear-session')
        };
    }

    setupSpeech() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Monitoring...', 'listening');
                this.dom.micToggle.classList.add('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    End Monitoring
                `;
            };

            this.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        this.processInput(event.results[i][0].transcript);
                    }
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (!this.dom.statusText.textContent.includes('Error')) {
                    this.updateStatus('System Ready', 'ready');
                }
                this.dom.micToggle.classList.remove('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    Start Monitoring
                `;
            };

            this.recognition.onerror = (event) => {
                console.error("Audio Interface Error", event.error);

                let message = "Audio Interface Error";
                if (event.error === 'network') {
                    message = "Speech service unreachable. Chrome requires an active internet connection for real-time transcription. Please use manual input.";
                    this.updateStatus('Network Error', 'error');
                } else if (event.error === 'not-allowed') {
                    message = "Microphone access denied. Please verify browser permissions and reload.";
                    this.updateStatus('Permission Denied', 'error');
                } else if (event.error === 'no-speech') {
                    return; // Ignore silence
                }

                this.showNotification(message);

                // Transition to manual intervention model
                if (['network', 'not-allowed', 'service-not-allowed'].includes(event.error)) {
                    this.recognition.stop();
                    setTimeout(() => {
                        this.dom.manualInput.placeholder = "Type here (Microphone currently unavailable)";
                        this.dom.manualInput.focus();
                    }, 500);
                }
            };
        } else {
            this.dom.micToggle.disabled = true;
            this.dom.micToggle.textContent = "Interface Not Supported";
        }
    }

    checkFirstRun() {
        if (!this.config) {
            this.dom.wizard.classList.remove('hidden');
        } else {
            this.setThemeInfo();
        }
    }

    setupEventListeners() {
        this.dom.setupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const config = {
                role: document.getElementById('role').value,
                industry: document.getElementById('industry').value,
                experience: document.getElementById('experience').value
            };
            this.saveConfig(config);
        });

        this.dom.micToggle.addEventListener('click', () => {
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        });

        this.dom.editProfileBtn.addEventListener('click', () => {
            this.dom.wizard.classList.remove('hidden');
        });

        this.dom.clearSessionBtn.addEventListener('click', () => {
            this.dom.output.textContent = "State reset. All active buffers cleared.";
            this.dom.keyThemes.textContent = "N/A";
            this.showNotification("Operational state reset");
        });

        this.dom.manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processInput(this.dom.manualInput.value);
                this.dom.manualInput.value = "";
            }
        });
    }

    saveConfig(config) {
        this.config = config;
        localStorage.setItem('steady_config', JSON.stringify(config));
        this.dom.wizard.classList.add('hidden');
        this.setThemeInfo();
        this.showNotification("Profile initialized");
    }

    setThemeInfo() {
        if (!this.config) return;
        const tones = {
            tech: "Dynamic, Problem-Solving",
            corporate: "Strategic, Value-Oriented",
            creative: "Innovative, Expressive",
            government: "Structured, Policy-Aware"
        };
        this.dom.toneIndicator.textContent = tones[this.config.industry] || "Professional";
    }

    processInput(text) {
        if (!text.trim()) return;
        this.updateStatus('Processing...', 'thinking');

        setTimeout(() => {
            const response = this.generateResponse(text);
            this.displayResponse(response);
            this.addToHistory(text, response);
            this.updateStatus('System Ready', 'ready');
        }, 400);
    }

    generateResponse(input) {
        const text = input.toLowerCase();
        let assistant = {
            script: "",
            themes: "",
            grounding: ""
        };

        const role = this.config?.role || "professional";
        const industry = this.config?.industry || "corporate";

        if (text.includes("time you") || text.includes("example of") || text.includes("describe a")) {
            assistant.script = `Utilize the STAR framework. Phrase: "A specific scenario that demonstrates this is when I was at [Organization]..."`;
            assistant.themes = "Behavioral Analysis, Leadership";
            assistant.grounding = "Describe the Situation concisely. Focus on your specific Action.";
        }
        else if (text.includes("strength") || text.includes("weakness")) {
            assistant.script = `"My core capability lies in [X], which I've utilized to achieve [Y]..." For areas of growth: "I am currently refining my skillset in [Skill] by [Action]..."`;
            assistant.themes = "Professional Self-Awareness";
            assistant.grounding = "Ensure weaknesses are framed as active development areas.";
        }
        else if (text.includes("conflict") || text.includes("disagree") || text.includes("difficult")) {
            assistant.script = `"I approach differing perspectives by first ensuring full alignment on objectives through active comprehension..."`;
            assistant.themes = "Professional Maturity";
            assistant.grounding = "Remain objective. Focus on solution-oriented outcomes.";
        }
        else if (text.includes("why do you") || text.includes("why this") || text.includes("interest you")) {
            assistant.script = `"I am interested in this position because [Organization]'s focus on [Industry] aligns with my experience as a ${role}..."`;
            assistant.themes = "Organizational Alignment";
            assistant.grounding = "Connect historical experience to future value contribution.";
        }
        else {
            assistant.script = `"That is an important consideration. In my capacity as a ${role}, I would address that by..."`;
            assistant.themes = "Domain Expertise";
            assistant.grounding = "Use: 'Let's examine that from a different angle' if you require a pause.";
        }

        // Professional tone refinement for Corporate
        if (industry === 'corporate') {
            assistant.script = assistant.script.replace(/EXCITED/g, 'STRATEGICALLY ALIGNED').replace(/LOVE/g, 'VALUED');
        }

        return assistant;
    }

    displayResponse(response) {
        this.dom.output.textContent = response.script;
        this.dom.keyThemes.textContent = response.themes;
        this.dom.groundingText.textContent = response.grounding;
    }

    addToHistory(input, response) {
        const item = {
            id: Date.now(),
            input: input.substring(0, 40) + (input.length > 40 ? "..." : ""),
            script: response.script,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.history.unshift(item);
        if (this.history.length > 15) this.history.pop();
        localStorage.setItem('steady_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.dom.historyList.innerHTML = `<div class="history-item" style="text-align: center; color: var(--text-secondary); font-size: 0.875rem;">No logged events</div>`;
            return;
        }

        this.dom.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="window.steady.loadHistoryItem(${item.id})">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <strong style="font-size: 0.65rem; color: var(--accent-primary); text-transform: uppercase;">Event</strong>
                    <span style="font-size: 0.65rem; color: var(--text-secondary);">${item.timestamp}</span>
                </div>
                <div style="font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">
                    ${item.input}
                </div>
            </div>
        `).join('');
    }

    loadHistoryItem(id) {
        const item = this.history.find(h => h.id === id);
        if (item) {
            this.dom.output.textContent = item.script;
            this.showNotification("Event data recalled");
        }
    }

    updateStatus(text, type) {
        const typeClass = `status-${type}`;
        this.dom.statusText.innerHTML = `<span class="status-indicator ${typeClass}"></span>${text}`;
    }

    showNotification(message) {
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;

        document.getElementById('notifications').appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 2500);
    }
}

// Initialize
window.steady = new Steady();