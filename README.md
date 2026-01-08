# Interview Coach

A futuristic, AI-powered interview preparation tool that provides real-time coaching through voice and text interactions. Features a cyberpunk-inspired UI with interactive elements, speech recognition, and conversational AI assistance.

## Features

### 🎙️ Voice Interaction
- Real-time speech recognition using Web Speech API
- Voice responses with adjustable speech synthesis
- Continuous conversation mode for natural dialogue

### 🤖 AI-Powered Responses
- Google Gemini AI integration for intelligent answers
- Context-aware responses based on user role and industry
- Interview-specific coaching with STAR framework guidance
- General chat mode for broader assistance

### 🎨 Futuristic UI
- Cyberpunk color scheme with neon accents
- Interactive hover effects and glow animations
- Responsive design with glassmorphism elements
- PWA capabilities for offline use

### 🔒 Security
- Server-side API key storage
- Secure communication between client and backend
- Local data persistence with error handling

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MelroseSaint/InterviewCoach.git
cd InterviewCoach
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:
```
API_KEY=your_google_gemini_api_key_here
```

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### First Time Setup
1. Configure your profile (role, industry, experience level)
2. Grant microphone permissions when prompted
3. Choose between Interview mode or Chat mode

### Interview Mode
- Speak your interview questions or type them manually
- Receive concise, professional answers tailored to your profile
- Use voice responses for practice sessions

### Chat Mode
- Engage in natural conversations with the AI
- Get general advice and assistance
- Conversation history is maintained across sessions

### Controls
- **Start Monitoring**: Begin voice recognition
- **Mode Toggle**: Switch between Interview and Chat modes
- **Voice Toggle**: Enable/disable spoken responses
- **Manual Input**: Type questions when voice isn't available

## Architecture

### Frontend
- Vanilla JavaScript with modern ES6+ features
- CSS with custom properties for theming
- Progressive Web App with service worker
- Web Speech API for voice input/output

### Backend
- Node.js Express server
- RESTful API for AI interactions
- Secure API key management
- CORS enabled for local development

### AI Integration
- Google Gemini 1.5 Flash model
- Contextual prompt engineering
- Rate limiting and error handling

## Browser Support

- Chrome/Edge: Full support (recommended)
- Firefox: Limited speech recognition
- Safari: Basic support with iOS compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Privacy

- All conversations are processed locally or through secure APIs
- No personal data is stored permanently
- Microphone data is used only for speech recognition
- API keys are stored securely server-side