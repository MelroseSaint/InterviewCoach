/**
 * Steady | Professional Interview Instrument
 */

class Steady {
    constructor() {
        try {
            this.config = JSON.parse(localStorage.getItem('steady_config')) || null;
            this.history = JSON.parse(localStorage.getItem('steady_history')) || [];
            this.chatHistory = JSON.parse(localStorage.getItem('steady_chat_history')) || [];
            this.isListening = false;
            this.recognition = null;
            this.mode = localStorage.getItem('steady_mode') || 'interview';
            this.voiceEnabled = JSON.parse(localStorage.getItem('steady_voice')) || false;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            this.config = null;
            this.history = [];
            this.chatHistory = [];
            this.mode = 'interview';
            this.voiceEnabled = false;
        }

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupSpeech();
        this.checkFirstRun();
        this.renderHistory();
        this.updateModeDisplay();
        this.updateVoiceDisplay();
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
            clearSessionBtn: document.getElementById('clear-session'),
            manualSubmit: document.getElementById('manual-submit'),
            modeToggle: document.getElementById('mode-toggle'),
            voiceToggle: document.getElementById('voice-toggle')
        };
    }

    setupSpeech() {
        this.isListening = false;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                this.processInput(transcript);
            };
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleMicError(event);
            };
        } else {
            console.warn('Speech recognition not supported');
            this.handleMicError({ name: 'NotSupportedError' });
        }
    }

    handleMicError(error) {
        let message = "Speech Recognition Unavailable. Use manual input.";
        let detailedMessage = "";

        if (error.name === 'NotSupportedError' || error.error === 'not-allowed') {
            message = "Speech recognition not supported or permission denied.";
            detailedMessage = "Try using Chrome or enable microphone permissions.";
        } else if (error.error === 'no-speech') {
            message = "No speech detected.";
            detailedMessage = "Try speaking louder or closer to the microphone.";
        } else if (error.error === 'network') {
            message = "Network error.";
            detailedMessage = "Check your internet connection.";
        } else {
            detailedMessage = error.error || error.message || "Unknown error";
        }

        this.dom.micToggle.disabled = true;
        this.dom.micToggle.textContent = message;
        this.showNotification(`${message} ${detailedMessage}`);
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
                this.isListening = false;
                this.updateStatus('System Ready', 'ready');
                this.dom.micToggle.classList.remove('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    Start Monitoring
                `;
            } else {
                this.recognition.start();
                this.isListening = true;
                this.updateStatus('Monitoring...', 'listening');
                this.dom.micToggle.classList.add('active');
                this.dom.micToggle.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    End Monitoring
                `;
            }
        });

        this.dom.editProfileBtn.addEventListener('click', () => {
            this.dom.wizard.classList.remove('hidden');
        });

        this.dom.clearSessionBtn.addEventListener('click', () => {
            this.dom.output.textContent = "State reset. All active buffers cleared.";
            this.dom.keyThemes.textContent = "N/A";
            this.chatHistory = [];
            localStorage.removeItem('steady_chat_history');
            this.showNotification("Operational state reset");
        });

        this.dom.manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processInput(this.dom.manualInput.value);
                this.dom.manualInput.value = "";
                this.dom.manualInput.style.height = 'auto';
            }
        });

        // Auto-resize textarea
        this.dom.manualInput.addEventListener('input', () => {
            this.dom.manualInput.style.height = 'auto';
            this.dom.manualInput.style.height = this.dom.manualInput.scrollHeight + 'px';
        });

        this.dom.manualSubmit.addEventListener('click', () => {
            this.processInput(this.dom.manualInput.value);
            this.dom.manualInput.value = "";
            this.dom.manualInput.style.height = 'auto';
        });

        this.dom.modeToggle.addEventListener('click', () => {
            this.mode = this.mode === 'interview' ? 'chat' : 'interview';
            localStorage.setItem('steady_mode', this.mode);
            this.updateModeDisplay();
            this.showNotification(`Switched to ${this.mode} mode`);
        });

        this.dom.voiceToggle.addEventListener('click', () => {
            this.voiceEnabled = !this.voiceEnabled;
            localStorage.setItem('steady_voice', this.voiceEnabled);
            this.updateVoiceDisplay();
            this.showNotification(`Voice responses ${this.voiceEnabled ? 'enabled' : 'disabled'}`);
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

    async processInput(text) {
        if (!text.trim()) return;
        this.updateStatus('Processing...', 'thinking');

        if (this.mode === 'chat') {
            this.chatHistory.push(`User: ${text}`);
        }

        try {
            const response = await this.generateResponse(text);
            this.displayResponse(response);
            if (this.mode === 'chat') {
                this.chatHistory.push(`Assistant: ${response}`);
                localStorage.setItem('steady_chat_history', JSON.stringify(this.chatHistory));
            } else {
                this.addToHistory(text, response);
            }
            this.updateStatus('System Ready', 'ready');
        } catch (error) {
            console.error('Error processing input:', error);
            this.displayResponse("Error generating response. Please try again.");
            this.updateStatus('System Ready', 'ready');
        }
    }

    async generateResponse(input) {
        let prompt;
        if (this.mode === 'interview') {
            const role = this.config?.role || "professional";
            const industry = this.config?.industry || "corporate";
            const experience = this.config?.experience || "mid";
            prompt = `You are a real-time interview coach. Provide a concise answer (3-5 sentences, under 75 words) to this interview question: "${input}". The candidate is applying for ${role} in ${industry}, with ${experience} level experience. Answer professionally and directly. Keep it short and natural.`;
        } else {
            // Chat mode: include conversation history
            const context = this.chatHistory.slice(-10).join('\n'); // Last 10 messages
            prompt = `You are a helpful AI assistant. Continue this conversation naturally. Previous messages:\n${context}\nUser: ${input}\nAssistant:`;
        }

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: prompt,
                    config: this.config
                })
            });
            const data = await response.json();
            return data.response || "Error generating response.";
        } catch (error) {
            console.error('API call failed:', error);
            return "Error generating response. Please try again.";
        }
    }

    displayResponse(response) {
        this.dom.output.textContent = response;
        this.dom.keyThemes.textContent = this.mode === 'interview' ? "Answer Ready" : "Chat Response";
        this.dom.groundingText.textContent = this.mode === 'interview' ? "Read this aloud as your response." : "Continue the conversation.";

        if (this.voiceEnabled && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    addToHistory(input, response) {
        const item = {
            id: Date.now(),
            input: input.substring(0, 40) + (input.length > 40 ? "..." : ""),
            script: response,
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

    updateModeDisplay() {
        const icon = this.mode === 'interview' ? 
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>' : 
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>';
        this.dom.modeToggle.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>`;
        this.dom.modeToggle.classList.toggle('active', this.mode === 'chat');
    }

    updateVoiceDisplay() {
        this.dom.voiceToggle.classList.toggle('active', this.voiceEnabled);
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
globalThis.steady = new Steady();