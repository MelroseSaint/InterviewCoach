/**
 * AuraAudit | Real-time Interview Coach Logic
 */

class AuraAudit {
    constructor() {
        this.config = JSON.parse(localStorage.getItem('aura_config')) || null;
        this.history = JSON.parse(localStorage.getItem('aura_history')) || [];
        this.isListening = false;
        this.recognition = null;
        this.lastTranscription = "";

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
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Listening...', 'listening');
                this.dom.micToggle.classList.add('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Stop Listening
                `;
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        this.processInput(event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateStatus('System Ready', 'ready');
                this.dom.micToggle.classList.remove('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    Start Listening
                `;
            };

            this.recognition.onerror = (event) => {
                console.error("Speech Recognition Error", event.error);
                this.showNotification("Microphone error: " + event.error, "danger");
            };
        } else {
            this.dom.micToggle.disabled = true;
            this.dom.micToggle.textContent = "Speech API Not Supported";
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
            this.dom.output.textContent = "Session cleared. I'm ready for the next question.";
            this.dom.keyThemes.textContent = "No active session";
            this.showNotification("Session cleared", "success");
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
        localStorage.setItem('aura_config', JSON.stringify(config));
        this.dom.wizard.classList.add('hidden');
        this.setThemeInfo();
        this.showNotification("Profile updated successfully", "success");
    }

    setThemeInfo() {
        if (!this.config) return;
        const tones = {
            tech: "Dynamic, Problem-Solving, Growth-Minded",
            corporate: "Professional, Strategic, Value-Oriented",
            creative: "Innovative, Collaborative, Expressive",
            government: "Structured, Policy-Aware, Community-Focused"
        };
        this.dom.toneIndicator.textContent = tones[this.config.industry] || "Balanced";
    }

    processInput(text) {
        if (!text.trim()) return;
        this.updateStatus('Thinking...', 'thinking');

        // Strategy: Wait a brief moment to simulate processing
        setTimeout(() => {
            const response = this.generateResponse(text);
            this.displayResponse(response);
            this.addToHistory(text, response);
            this.updateStatus('System Ready', 'ready');
        }, 600);
    }

    generateResponse(input) {
        const text = input.toLowerCase();
        let coach = {
            script: "",
            themes: "",
            grounding: ""
        };

        const role = this.config?.role || "professional";
        const industry = this.config?.industry || "tech";

        // Behavioral Detection
        if (text.includes("time you") || text.includes("example of") || text.includes("describe a")) {
            coach.script = `Use the STAR method. Start with: "A specific instance that comes to mind is when I was at [Company]..."`;
            coach.themes = "Behavioral, Soft Skills, Leadership";
            coach.grounding = "Breathe. Describe the Situation clearly before moving to your Action.";
        }
        // Strength/Weakness
        else if (text.includes("strength") || text.includes("weakness")) {
            coach.script = `For strength: "My core strength is my ability to bridge [X] and [Y]..." For weakness: "I've been working on [Skill] recently by [Action]..."`;
            coach.themes = "Self-Awareness, Growth";
            coach.grounding = "Keep it positive. Frame weaknesses as 'current areas of focus'.";
        }
        // Conflict
        else if (text.includes("conflict") || text.includes("disagree") || text.includes("difficult")) {
            coach.script = `"I handle disagreements by first ensuring I fully understand the other perspective through active listening..."`;
            coach.themes = "Conflict Resolution, Maturity";
            coach.grounding = "Stay objective. Don't blame others. Focus on the professional resolution.";
        }
        // Why us?
        else if (text.includes("why do you") || text.includes("why this") || text.includes("interest you")) {
            coach.script = `"I've followed [Company] because of your work in [Industry Field]. My experience in ${role} aligns perfectly with your mission to..."`;
            coach.themes = "Alignment, Research, Value Prop";
            coach.grounding = "Show enthusiasm. Connect your past to their future.";
        }
        // General Contextual Response
        else {
            coach.script = `"That's a great question. Looking at my background as a ${role}, I would approach that by focusing on..."`;
            coach.themes = "Expertise, Quick Thinking";
            coach.grounding = "Use: 'That's an interesting perspective' if you need 2 seconds to think.";
        }

        // Adjust for Industry Tone
        if (industry === 'corporate') {
            coach.script = coach.script.replace(/BRIDGE/g, 'OPTIMIZE').replace(/WORK/g, 'LEVERAGE');
        } else if (industry === 'startup') {
            coach.script = coach.script.replace(/STRUCTURED/g, 'AGILE').replace(/PROCESS/g, 'VELOCITY');
        }

        return coach;
    }

    displayResponse(response) {
        this.dom.output.textContent = response.script;
        this.dom.keyThemes.textContent = response.themes;
        this.dom.groundingText.textContent = response.grounding;
    }

    addToHistory(input, response) {
        const item = {
            id: Date.now(),
            input: input.substring(0, 50) + (input.length > 50 ? "..." : ""),
            script: response.script,
            timestamp: new Date().toLocaleTimeString()
        };
        this.history.unshift(item);
        if (this.history.length > 20) this.history.pop();
        localStorage.setItem('aura_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.dom.historyList.innerHTML = `<div class="history-item" style="text-align: center; color: var(--text-muted);">No recent responses</div>`;
            return;
        }

        this.dom.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="app.loadHistoryItem(${item.id})">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <strong style="font-size: 0.75rem; color: var(--primary);">Question</strong>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${item.timestamp}</span>
                </div>
                <div style="font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.input}
                </div>
            </div>
        `).join('');
    }

    loadHistoryItem(id) {
        const item = this.history.find(h => h.id === id);
        if (item) {
            this.dom.output.textContent = item.script;
            this.showNotification("Past response loaded", "success");
        }
    }

    updateStatus(text, type) {
        const typeClass = `status-${type}`;
        this.dom.statusText.innerHTML = `<span class="status-indicator ${typeClass}"></span>${text}`;
    }

    showNotification(message, type = "success") {
        const id = 'notif-' + Date.now();
        const colors = {
            success: 'var(--success)',
            danger: 'var(--danger)',
            info: 'var(--primary)'
        };

        const notif = document.createElement('div');
        notif.id = id;
        notif.className = 'response-card';
        notif.style.cssText = `
            margin-bottom: 1rem;
            animation: fadeIn 0.3s ease-out;
            background: ${colors[type]};
            color: white;
            padding: 0.75rem 1rem;
            min-height: auto;
            border: none;
        `;
        notif.textContent = message;

        document.getElementById('notifications').appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transform = 'translateX(20px)';
            notif.style.transition = 'all 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
}

// Global instance for onclick handlers
window.app = new AuraAudit();