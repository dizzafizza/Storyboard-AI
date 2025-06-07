# 🎬 Storyboard AI

A powerful, privacy-first AI-powered storyboard generator built with React and TypeScript. Create professional storyboards with intelligent AI assistance, image generation, and advanced timeline features.

![Storyboard AI Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=Storyboard+AI+Demo)

## ✨ Features

### 🎨 **AI-Powered Creation**
- **Smart Storyboard Generation**: Create complete storyboards from simple story ideas
- **DALL-E 3 Integration**: Generate high-quality images for each panel
- **Intelligent Scene Analysis**: AI understands cinematography and suggests optimal shots
- **Video Prompt Generation**: Create prompts for AI video generation tools

### 🎬 **Professional Tools**
- **Advanced Timeline Editor**: Full-featured timeline with video integration
- **Cinematic Shot Types**: Close-up, wide shot, over-the-shoulder, and more
- **Camera Angles**: High-angle, low-angle, bird's eye view, etc.
- **Director's Notes**: Add creative vision and style guidance

### 🔒 **Privacy-First Design**
- **100% Client-Side**: All data stored locally in your browser
- **No Tracking**: Zero analytics, cookies, or data collection
- **Your API Keys**: Direct integration with OpenAI (your keys, your control)
- **Offline Capable**: Works without internet after initial load

### 🚀 **Modern Interface**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Theme System**: 6 beautiful themes (Light, Dark, Purple, Ocean Blue, Forest Green, Sunset Orange)
- **Drag & Drop**: Intuitive panel reordering
- **Real-time Preview**: See changes instantly
- **Modern Styling**: Clean dropdowns, smooth animations, and polished UI
- **Export Options**: JSON, timeline data, and more

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/storyboard-ai/storyboard-ai.git
cd storyboard-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start creating!

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage Guide

### 1. **Getting Started**
1. Open the application in your browser
2. Click "New Project" to create your first storyboard
3. Add your OpenAI API key in the AI Assistant (optional)

### 2. **Creating Storyboards**
- **Manual Creation**: Click "Add Panel" to create panels one by one
- **AI Generation**: Use the AI Assistant to generate complete storyboards
- **Templates**: Start with professional templates (coming soon)

### 3. **AI Features**
To use AI features, you'll need an OpenAI API key:
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click the AI Assistant button
3. Enter your API key when prompted
4. Start generating content!

### 4. **Image Generation**
- Click the magic wand (🪄) icon on any panel
- AI will generate a cinematic image based on your panel description
- Images are automatically saved to your project

### 5. **Timeline Editor**
- Switch to Timeline view to see your storyboard in sequence
- Play/pause to preview your story
- Adjust playback speed and volume
- Export timeline data for external tools

### 6. **Theme Customization**
- Click the "Themes" button in the header
- Choose from 6 professionally designed themes:
  - **Light**: Classic & Clean
  - **Dark**: Easy on the Eyes
  - **Purple**: Creative & Artistic
  - **Ocean Blue**: Professional & Calm
  - **Forest Green**: Natural & Fresh
  - **Sunset Orange**: Warm & Energetic
- Theme preferences are saved automatically

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:

```env
# Optional: Default OpenAI API key (not recommended for production)
VITE_OPENAI_API_KEY=your_api_key_here

# Optional: Custom API endpoints
VITE_API_BASE_URL=https://api.openai.com/v1
```

### Customization
The app is highly customizable through:
- **Tailwind CSS**: Modify `tailwind.config.js` for styling
- **Types**: Extend types in `src/types/index.ts`
- **Storage**: Customize data storage in `src/utils/storage.ts`

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **AI Integration**: OpenAI API (GPT-4 + DALL-E 3)
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

### Project Structure
```
src/
├── components/          # React components
│   ├── StoryboardPanel.tsx
│   ├── TimelineView.tsx
│   ├── AIAssistant.tsx
│   └── ...
├── context/            # React Context providers
├── services/           # API services and utilities
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx            # Main application component
```

### Key Components
- **StoryboardContext**: Global state management
- **AIService**: OpenAI API integration
- **Storage**: Local data persistence
- **TimelineView**: Advanced video timeline editor

## 🔒 Privacy & Security

### Data Handling
- **Local Storage Only**: All project data stays in your browser
- **No Server**: No backend servers or databases
- **API Keys**: Stored locally, never transmitted to our servers
- **No Analytics**: Zero tracking or data collection

### Security Features
- **Content Security Policy**: Strict CSP headers
- **XSS Protection**: Built-in cross-site scripting protection
- **HTTPS Only**: Secure connections required
- **API Key Encryption**: Local storage encryption for sensitive data

### GDPR Compliance
- No personal data collection
- No cookies or tracking
- User controls all data
- Right to deletion (clear browser data)

## 🚀 Deployment

### GitHub Pages (Recommended)
```bash
# Build and deploy to GitHub Pages
npm run deploy
```

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy the dist/ folder to your hosting provider
```

### Docker Deployment
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Write tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 and DALL-E 3 APIs
- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icons
- **All Contributors** who help make this project better

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/storyboard-ai/storyboard-ai/wiki)
- **Issues**: [GitHub Issues](https://github.com/storyboard-ai/storyboard-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/storyboard-ai/storyboard-ai/discussions)

## 🗺️ Roadmap

### Version 2.0 (Coming Soon)
- [ ] Video generation integration
- [ ] Collaborative editing
- [ ] Advanced export formats
- [ ] Mobile app
- [ ] Plugin system

### Version 1.1 (Current)
- [x] DALL-E 3 image generation
- [x] Enhanced timeline editor
- [x] Privacy-first architecture
- [x] Advanced AI assistant
- [x] Export capabilities

---

**Made with ❤️ by the open source community**

*Storyboard AI is committed to privacy, security, and creative freedom. Your stories, your data, your control.* 