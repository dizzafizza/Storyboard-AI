# Contributing to Storyboard AI

Thank you for your interest in contributing to Storyboard AI! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/storyboard-ai.git
   cd storyboard-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 How to Contribute

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/storyboard-ai/storyboard-ai/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Screenshots if applicable

### 💡 Suggesting Features

1. Check [Discussions](https://github.com/storyboard-ai/storyboard-ai/discussions) for existing feature requests
2. Create a new discussion with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### 🔧 Code Contributions

#### Types of Contributions Welcome
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- UI/UX improvements
- Test coverage
- Accessibility improvements

#### Development Guidelines

1. **Code Style**
   - Use TypeScript for all new code
   - Follow existing code patterns
   - Use meaningful variable and function names
   - Add JSDoc comments for public APIs

2. **Component Guidelines**
   ```typescript
   // Good: Functional component with TypeScript
   interface MyComponentProps {
     title: string
     onAction: () => void
   }

   export default function MyComponent({ title, onAction }: MyComponentProps) {
     // Component logic
   }
   ```

3. **State Management**
   - Use React Context for global state
   - Keep component state local when possible
   - Use useReducer for complex state logic

4. **Styling**
   - Use Tailwind CSS classes
   - Follow mobile-first responsive design
   - Maintain consistent spacing and colors

5. **Privacy & Security**
   - Never add tracking or analytics
   - Keep all data processing client-side
   - Secure API key handling

#### Pull Request Process

1. **Before Starting**
   - Check if someone is already working on the issue
   - Comment on the issue to claim it
   - Discuss approach for large changes

2. **Making Changes**
   ```bash
   # Create feature branch
   git checkout -b feature/amazing-feature
   
   # Make your changes
   # Test thoroughly
   
   # Commit with clear messages
   git commit -m "feat: add amazing feature"
   ```

3. **Testing**
   ```bash
   # Run type checking
   npm run build
   
   # Test in browser
   npm run dev
   
   # Test production build
   npm run preview
   ```

4. **Submitting PR**
   - Push to your fork
   - Create pull request with:
     - Clear title and description
     - Link to related issue
     - Screenshots for UI changes
     - Testing instructions

5. **PR Review**
   - Address feedback promptly
   - Keep discussions constructive
   - Update documentation if needed

## 🏗️ Project Architecture

### Key Directories
```
src/
├── components/     # React components
├── context/        # Global state management
├── services/       # API integrations
├── types/          # TypeScript definitions
├── utils/          # Helper functions
└── App.tsx        # Main app component
```

### Important Files
- `src/context/StoryboardContext.tsx` - Global state
- `src/services/ai.ts` - OpenAI integration
- `src/utils/storage.ts` - Local storage utilities
- `src/types/index.ts` - Type definitions

### State Management
```typescript
// Global state structure
interface StoryboardState {
  currentProject: StoryboardProject | null
  panels: StoryboardPanel[]
  isLoading: boolean
}

// Actions
type StoryboardAction = 
  | { type: 'SET_PROJECT'; payload: StoryboardProject }
  | { type: 'ADD_PANEL'; payload: StoryboardPanel }
  | { type: 'UPDATE_PANEL'; payload: { id: string; updates: Partial<StoryboardPanel> } }
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create new project
- [ ] Add/edit/delete panels
- [ ] Drag and drop reordering
- [ ] AI assistant functionality
- [ ] Image generation
- [ ] Timeline playback
- [ ] Export functionality
- [ ] Mobile responsiveness

### Browser Testing
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Generates a storyboard panel image using DALL-E 3
 * @param panel - The storyboard panel to generate an image for
 * @param options - Image generation options
 * @returns Promise resolving to image URL or null if failed
 */
export async function generatePanelImage(
  panel: StoryboardPanel,
  options: ImageGenerationOptions = {}
): Promise<string | null>
```

### README Updates
- Update feature lists for new functionality
- Add usage examples for new features
- Update screenshots when UI changes

## 🔒 Security Guidelines

### API Key Handling
```typescript
// ✅ Good: Store locally, never transmit
localStorage.setItem('openai_key', apiKey)

// ❌ Bad: Never log or transmit API keys
console.log('API Key:', apiKey) // Don't do this
```

### Data Privacy
- All user data must stay client-side
- No tracking or analytics
- No external data transmission
- Clear data handling in documentation

## 🎨 Design Guidelines

### UI Principles
- **Clean & Minimal**: Avoid clutter
- **Intuitive**: Self-explanatory interfaces
- **Responsive**: Mobile-first design
- **Accessible**: WCAG 2.1 AA compliance

### Color Palette
```css
/* Primary colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* Neutral colors */
--gray-50: #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Component Patterns
```typescript
// Consistent button styling
<button className="btn-primary">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</button>

// Loading states
{isLoading ? (
  <Loader className="w-4 h-4 animate-spin" />
) : (
  <ActionIcon className="w-4 h-4" />
)}
```

## 🚀 Release Process

### Version Numbering
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features
- **Patch** (1.1.1): Bug fixes

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Test all features
- [ ] Update documentation
- [ ] Create GitHub release
- [ ] Deploy to GitHub Pages

## 💬 Communication

### Where to Ask Questions
- **General Questions**: [GitHub Discussions](https://github.com/storyboard-ai/storyboard-ai/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/storyboard-ai/storyboard-ai/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/storyboard-ai/storyboard-ai/discussions)

### Response Times
- We aim to respond to issues within 48 hours
- Pull requests are reviewed within 1 week
- Complex features may take longer to review

## 🏆 Recognition

Contributors are recognized in:
- README.md acknowledgments
- GitHub contributors page
- Release notes for significant contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Storyboard AI! Together, we're building the future of creative storytelling tools. 🎬✨ 