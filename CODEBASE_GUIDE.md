# 🗺️ Storyboard AI Codebase Guide

## Overview

This guide provides a comprehensive roadmap for navigating and understanding the Storyboard AI codebase. It's designed to help developers quickly orient themselves within this large-scale React TypeScript application and understand how different parts of the system work together.

## 🎯 Quick Navigation

### For New Developers
1. Start with [README.md](./README.md) - Project overview and setup
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
3. Read [CONTEXT_MANAGEMENT.md](./CONTEXT_MANAGEMENT.md) - Context strategies
4. Study [CONPORT_INTEGRATION.md](./CONPORT_INTEGRATION.md) - AI-powered context system
5. Explore [DEVELOPMENT_PATTERNS.md](./DEVELOPMENT_PATTERNS.md) - Code patterns

### For Feature Development
1. **UI Components**: `src/components/` - Reusable UI building blocks
2. **Business Logic**: `src/context/` and `src/services/` - Application logic
3. **Type Definitions**: `src/types/` - TypeScript interfaces and types
4. **Utilities**: `src/utils/` - Helper functions and utilities

### For Bug Fixes
1. **Error Tracking**: Check browser console and dev tools
2. **State Debugging**: Use React DevTools for context inspection
3. **Network Issues**: Monitor network tab for API failures
4. **Performance**: Use React Profiler for performance analysis

## 📁 Codebase Structure Deep Dive

### Root Level Files
```
├── README.md              # Project overview and quick start
├── ARCHITECTURE.md        # System architecture documentation
├── CONTEXT_MANAGEMENT.md  # Context management strategies
├── DEVELOPMENT_PATTERNS.md # Code patterns and best practices
├── CODEBASE_GUIDE.md      # This file - navigation guide
├── CONTRIBUTING.md        # Contribution guidelines
├── DEPLOYMENT.md          # Deployment instructions
├── SECURITY.md           # Security guidelines
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Build tool configuration
├── tailwind.config.js    # Styling configuration
└── index.html            # Entry HTML file
```

### Source Code Organization

#### 📦 `src/` - Main Application Code

```
src/
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
├── index.css            # Global styles
├── components/          # Reusable UI components
├── context/             # React Context providers
├── services/            # Business logic and API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

#### 🧩 `src/components/` - UI Components

The components directory is organized by feature and complexity:

```
components/
├── ui/                 # Base UI components (buttons, inputs, modals)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts       # Barrel exports
├── layout/            # Layout and navigation components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── storyboard/        # Storyboard-specific components
│   ├── StoryboardGrid.tsx
│   ├── StoryboardPanel.tsx
│   ├── PanelEditor.tsx
│   └── index.ts
├── timeline/          # Timeline view components
│   ├── TimelineView.tsx
│   ├── TimelineControls.tsx
│   ├── TimelineTrack.tsx
│   └── index.ts
├── ai/               # AI assistant components
│   ├── AIAssistant.tsx
│   ├── PromptInput.tsx
│   ├── GenerationStatus.tsx
│   └── index.ts
└── theme/           # Theme and styling components
    ├── ThemeSelector.tsx
    ├── ColorPicker.tsx
    └── index.ts
```

**Component Naming Conventions:**
- **PascalCase** for component files (e.g., `StoryboardPanel.tsx`)
- **Descriptive names** that indicate functionality
- **Feature prefixes** for domain-specific components
- **Index files** for clean barrel exports

#### 🔄 `src/context/` - State Management

Context providers manage application state using the Context + Reducer pattern:

```
context/
├── StoryboardContext.tsx    # Main application state
├── ThemeContext.tsx         # UI theme and styling state
├── SettingsContext.tsx      # User preferences and configuration
├── AIContext.tsx           # AI service state and cache
└── types.ts                # Context-related type definitions
```

**Context Responsibilities:**
- **StoryboardContext**: Project management, panel CRUD, timeline state
- **ThemeContext**: Theme selection, color schemes, UI preferences
- **SettingsContext**: API keys, user settings, feature flags
- **AIContext**: AI generation state, caching, rate limiting

#### ⚙️ `src/services/` - Business Logic

Services encapsulate business logic and external integrations:

```
services/
├── ai/                     # AI service integrations
│   ├── OpenAIService.ts    # OpenAI API integration
│   ├── ImageGenerator.ts   # DALL-E image generation
│   ├── StoryGenerator.ts   # Story content generation
│   └── index.ts
├── storage/               # Data persistence
│   ├── LocalStorage.ts    # Browser local storage
│   ├── ProjectStorage.ts  # Project data management
│   ├── CacheService.ts    # Response caching
│   └── index.ts
├── export/               # Export functionality
│   ├── JSONExporter.ts   # JSON export
│   ├── TimelineExporter.ts # Timeline data export
│   ├── ImageExporter.ts  # Image compilation
│   └── index.ts
└── validation/           # Data validation
    ├── PanelValidator.ts
    ├── ProjectValidator.ts
    └── index.ts
```

**Service Design Principles:**
- **Single Responsibility**: Each service has a focused purpose
- **Dependency Injection**: Services accept dependencies as constructor parameters
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript coverage with proper interfaces

#### 📋 `src/types/` - Type Definitions

TypeScript types are organized by domain:

```
types/
├── index.ts              # Main type exports
├── storyboard.ts         # Storyboard and panel types
├── ai.ts                # AI service types
├── ui.ts                # UI component types
├── theme.ts             # Theme and styling types
├── storage.ts           # Storage and persistence types
├── export.ts            # Export format types
└── api.ts               # External API types
```

**Type Organization:**
- **Domain-specific files** for related types
- **Barrel exports** in index.ts for clean imports
- **Comprehensive documentation** with JSDoc comments
- **Strict typing** with no `any` types in production code

#### 🛠️ `src/utils/` - Utility Functions

Helper functions and utilities:

```
utils/
├── storage.ts           # Storage utilities
├── validation.ts        # Validation helpers
├── helpers.ts          # General helper functions
├── constants.ts        # Application constants
├── formatters.ts       # Data formatting functions
├── generators.ts       # ID and data generators
└── index.ts           # Utility exports
```

## 🔍 Finding Your Way Around

### 1. **Starting a New Feature**

Follow this checklist when adding new functionality:

1. **Define Types** (`src/types/`)
   - Create or extend interfaces for your feature
   - Document type relationships and constraints

2. **Create Services** (`src/services/`)
   - Implement business logic and external integrations
   - Add comprehensive error handling

3. **Build Components** (`src/components/`)
   - Start with presentational components
   - Add container components for state management

4. **Update Context** (`src/context/`)
   - Extend existing context or create new context if needed
   - Add actions and reducers for state management

5. **Add Utilities** (`src/utils/`)
   - Create helper functions and validators
   - Add constants and configuration

### 2. **Debugging Common Issues**

#### State-Related Issues
- Check React DevTools for context state
- Verify action dispatching in reducers
- Look for stale closures in useCallback/useMemo

#### Component Issues
- Check prop types and interface compliance
- Verify component mounting and unmounting
- Look for missing dependencies in useEffect

#### Performance Issues
- Use React Profiler to identify slow components
- Check for unnecessary re-renders
- Verify memo usage and dependency arrays

#### AI Integration Issues
- Check API key configuration in settings
- Verify network connectivity and API limits
- Look for rate limiting and error responses

### 3. **Code Quality Guidelines**

#### TypeScript Best Practices
```typescript
// ✅ Good: Explicit types and comprehensive interfaces
interface StoryboardPanel {
  id: string;
  description: string;
  shotType: ShotType;
  duration: number;
}

// ❌ Bad: Any types and unclear interfaces
interface Panel {
  data: any;
  info: string;
}
```

#### Component Best Practices
```typescript
// ✅ Good: Clear props interface and proper typing
interface StoryboardPanelProps {
  panel: Panel;
  onUpdate: (id: string, updates: Partial<Panel>) => void;
  className?: string;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ 
  panel, 
  onUpdate, 
  className 
}) => {
  // Component implementation
};

// ❌ Bad: Unclear props and missing types
const Panel = ({ data, onChange, ...props }) => {
  // Component implementation
};
```

#### Service Best Practices
```typescript
// ✅ Good: Clear interface and error handling
class AIService {
  constructor(private apiKey: string) {}
  
  async generatePanel(prompt: string): Promise<Panel> {
    try {
      const response = await this.callAPI(prompt);
      return this.validateResponse(response);
    } catch (error) {
      this.handleError(error);
      throw new Error(`Panel generation failed: ${error.message}`);
    }
  }
}

// ❌ Bad: No error handling and unclear contracts
class AI {
  generate(input) {
    return fetch('/api').then(r => r.json());
  }
}
```

## 📚 Learning Path

### For React Developers
1. **Context API**: Understanding React Context and useReducer
2. **TypeScript**: Strong typing and interface design
3. **Custom Hooks**: Creating reusable logic hooks
4. **Performance**: Memoization and optimization techniques

### For TypeScript Developers
1. **React Patterns**: Component composition and state management
2. **Context Management**: Provider patterns and state organization
3. **UI Libraries**: Tailwind CSS and component libraries
4. **Testing**: React Testing Library and Jest

### For Frontend Developers
1. **Build Tools**: Vite configuration and optimization
2. **State Management**: Context vs external state libraries
3. **API Integration**: Async patterns and error handling
4. **Performance**: Bundle optimization and lazy loading

## 🎯 Common Tasks

### Adding a New Component
```bash
# 1. Create component file
touch src/components/feature/NewComponent.tsx

# 2. Add to index file
echo "export { NewComponent } from './NewComponent';" >> src/components/feature/index.ts

# 3. Create test file
touch src/components/feature/NewComponent.test.tsx
```

### Adding a New Service
```bash
# 1. Create service file
touch src/services/feature/NewService.ts

# 2. Add types
echo "// Add service types" >> src/types/feature.ts

# 3. Export service
echo "export { NewService } from './feature/NewService';" >> src/services/index.ts
```

### Adding New Types
```bash
# 1. Create or update type file
echo "export interface NewType { ... }" >> src/types/feature.ts

# 2. Export from index
echo "export * from './feature';" >> src/types/index.ts
```

## 🚀 Development Workflow

### 1. **Local Development**
```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run tests
npm run test

# Build for production
npm run build
```

### 2. **Code Quality**
```bash
# Lint code
npm run lint

# Format code
npm run format

# Check for unused exports
npm run check-exports
```

### 3. **Testing**
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📖 Additional Resources

### Documentation
- [React Documentation](https://react.dev/) - React concepts and patterns
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Vite Guide](https://vitejs.dev/guide/) - Build tool documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling framework

### Internal Documentation
- [Architecture Decisions](./ARCHITECTURE.md) - System design choices
- [Development Patterns](./DEVELOPMENT_PATTERNS.md) - Code patterns and practices
- [Context Management](./CONTEXT_MANAGEMENT.md) - State management strategies
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines

### Tools and Extensions
- **VS Code Extensions**: ES7+ React snippets, TypeScript Hero, Tailwind IntelliSense
- **Browser Tools**: React DevTools, Redux DevTools, Web Vitals
- **Development Tools**: TypeScript Compiler, ESLint, Prettier

This guide serves as your compass for navigating the Storyboard AI codebase. Keep it updated as the project evolves and new patterns emerge. 