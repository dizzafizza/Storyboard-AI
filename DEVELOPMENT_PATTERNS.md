# 🎨 Development Patterns for Large Codebases

## Overview

This document outlines proven development patterns and practices for maintaining high code quality, architectural consistency, and developer productivity in large-scale React TypeScript applications. These patterns are specifically applied to the Storyboard AI project but can be generalized to similar applications.

## 🏗️ Architectural Patterns

### 1. **Layered Architecture Pattern**

Organize code into distinct layers with clear dependencies flowing downward:

```
Presentation Layer (UI Components)
    ↓
Application Layer (Business Logic)
    ↓
Domain Layer (Core Models & Services)
    ↓
Infrastructure Layer (External APIs, Storage)
```

#### Implementation in Storyboard AI:

```typescript
// Presentation Layer - UI Components
const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, onUpdate }) => {
  const { updatePanel } = useStoryboard(); // Application layer
  
  const handleUpdate = (updates: Partial<Panel>) => {
    updatePanel(panel.id, updates); // Delegates to application layer
  };
  
  return (
    <div className="storyboard-panel">
      {/* UI rendering logic only */}
    </div>
  );
};

// Application Layer - Business Logic
export const useStoryboard = () => {
  const { state, dispatch } = useContext(StoryboardContext);
  
  const updatePanel = useCallback((id: string, updates: Partial<Panel>) => {
    // Business logic and validation
    const validatedUpdates = validatePanelUpdates(updates);
    dispatch({ type: 'UPDATE_PANEL', payload: { id, updates: validatedUpdates } });
    
    // Trigger side effects (persistence, etc.)
    StorageService.saveProject(state.currentProject); // Infrastructure layer
  }, [dispatch, state.currentProject]);
  
  return { updatePanel, ...state };
};

// Domain Layer - Core Models
interface Panel {
  id: string;
  description: string;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  duration: number;
  imageUrl?: string;
}

// Infrastructure Layer - External Services
export class StorageService {
  static async saveProject(project: Project): Promise<void> {
    // Handles external storage concerns
    localStorage.setItem('storyboard-project', JSON.stringify(project));
  }
}
```

### 2. **Modular Federation Pattern**

Organize features as self-contained modules that can be developed independently:

```
src/
├── modules/
│   ├── storyboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── timeline/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   └── ai-assistant/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
└── shared/
    ├── components/
    ├── hooks/
    ├── utils/
    └── types/
```

#### Module Interface Pattern:

```typescript
// Each module exports a standardized interface
export interface StoryboardModule {
  // Components
  components: {
    StoryboardGrid: React.ComponentType<StoryboardGridProps>;
    StoryboardPanel: React.ComponentType<StoryboardPanelProps>;
  };
  
  // Hooks
  hooks: {
    useStoryboard: () => StoryboardContextType;
    usePanel: (id: string) => PanelContextType;
  };
  
  // Services
  services: {
    StoryboardService: typeof StoryboardService;
    PanelService: typeof PanelService;
  };
  
  // Types
  types: {
    Panel: typeof Panel;
    StoryboardState: typeof StoryboardState;
  };
}
```

### 3. **Event-Driven Architecture Pattern**

Use events for loose coupling between modules and components:

```typescript
// Event Bus Pattern
class EventBus {
  private events: Map<string, Function[]> = new Map();
  
  subscribe(event: string, callback: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }
  
  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Usage in components
const AIAssistant: React.FC = () => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('panel:generated', (panel: Panel) => {
      // Handle AI-generated panel
      dispatch({ type: 'ADD_PANEL', payload: panel });
    });
    
    return unsubscribe;
  }, [dispatch]);
  
  const generatePanel = async (prompt: string) => {
    const panel = await aiService.generatePanel(prompt);
    eventBus.emit('panel:generated', panel);
  };
  
  return <div>AI Assistant UI</div>;
};
```

## 🧩 Component Design Patterns

### 1. **Compound Component Pattern**

Create flexible, composable components:

```typescript
// Compound component for storyboard management
interface StoryboardCompoundProps {
  children: React.ReactNode;
}

const Storyboard = ({ children }: StoryboardCompoundProps) => {
  return (
    <div className="storyboard-container">
      {children}
    </div>
  );
};

// Sub-components
Storyboard.Header = ({ children }: { children: React.ReactNode }) => (
  <header className="storyboard-header">{children}</header>
);

Storyboard.Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="storyboard-grid">{children}</div>
);

Storyboard.Panel = StoryboardPanel;

// Usage
const StoryboardView = () => (
  <Storyboard>
    <Storyboard.Header>
      <ProjectControls />
      <ViewToggle />
    </Storyboard.Header>
    <Storyboard.Grid>
      {panels.map(panel => (
        <Storyboard.Panel key={panel.id} panel={panel} />
      ))}
    </Storyboard.Grid>
  </Storyboard>
);
```

### 2. **Render Props Pattern**

Enable flexible component composition and state sharing:

```typescript
interface StoryboardProviderProps {
  children: (props: StoryboardContextType) => React.ReactNode;
}

const StoryboardProvider: React.FC<StoryboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(storyboardReducer, initialState);
  
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    actions: {
      addPanel: (panel: Panel) => dispatch({ type: 'ADD_PANEL', payload: panel }),
      updatePanel: (id: string, updates: Partial<Panel>) => 
        dispatch({ type: 'UPDATE_PANEL', payload: { id, updates } }),
      deletePanel: (id: string) => dispatch({ type: 'DELETE_PANEL', payload: id }),
    }
  }), [state, dispatch]);
  
  return children(contextValue);
};

// Usage
const App = () => (
  <StoryboardProvider>
    {({ state, actions }) => (
      <div>
        <StoryboardGrid panels={state.panels} onUpdatePanel={actions.updatePanel} />
        <AIAssistant onPanelGenerated={actions.addPanel} />
      </div>
    )}
  </StoryboardProvider>
);
```

### 3. **Higher-Order Component (HOC) Pattern**

Add cross-cutting functionality to components:

```typescript
// HOC for error boundary functionality
function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return class WithErrorBoundary extends React.Component<T, { hasError: boolean; error?: Error }> {
    constructor(props: T) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
      // Report to error tracking service
    }
    
    render() {
      if (this.state.hasError) {
        const FallbackComponent = fallback || DefaultErrorFallback;
        return <FallbackComponent error={this.state.error!} />;
      }
      
      return <Component {...this.props} />;
    }
  };
}

// Usage
const SafeStoryboardPanel = withErrorBoundary(StoryboardPanel, PanelErrorFallback);
```

## 🔄 State Management Patterns

### 1. **Context + Reducer Pattern**

Scalable state management for complex applications:

```typescript
// Action definitions with type safety
type StoryboardAction = 
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'ADD_PANEL'; payload: Panel }
  | { type: 'UPDATE_PANEL'; payload: { id: string; updates: Partial<Panel> } }
  | { type: 'DELETE_PANEL'; payload: string }
  | { type: 'REORDER_PANELS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer with immutable updates
const storyboardReducer = (state: StoryboardState, action: StoryboardAction): StoryboardState => {
  switch (action.type) {
    case 'LOAD_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        panels: action.payload.panels,
        isLoading: false,
        error: null
      };
      
    case 'ADD_PANEL':
      return {
        ...state,
        panels: [...state.panels, action.payload],
        lastModified: Date.now()
      };
      
    case 'UPDATE_PANEL':
      return {
        ...state,
        panels: state.panels.map(panel =>
          panel.id === action.payload.id
            ? { ...panel, ...action.payload.updates }
            : panel
        ),
        lastModified: Date.now()
      };
      
    case 'DELETE_PANEL':
      return {
        ...state,
        panels: state.panels.filter(panel => panel.id !== action.payload),
        lastModified: Date.now()
      };
      
    case 'REORDER_PANELS':
      const { fromIndex, toIndex } = action.payload;
      const newPanels = [...state.panels];
      const [removed] = newPanels.splice(fromIndex, 1);
      newPanels.splice(toIndex, 0, removed);
      
      return {
        ...state,
        panels: newPanels,
        lastModified: Date.now()
      };
      
    default:
      return state;
  }
};
```

### 2. **Selector Pattern**

Optimize context consumption and prevent unnecessary re-renders:

```typescript
// Selector hooks for specific state slices
export const useStoryboardPanels = () => {
  const { state } = useStoryboard();
  return useMemo(() => state.panels, [state.panels]);
};

export const useStoryboardPanel = (id: string) => {
  const panels = useStoryboardPanels();
  return useMemo(() => panels.find(panel => panel.id === id), [panels, id]);
};

export const useStoryboardMetadata = () => {
  const { state } = useStoryboard();
  return useMemo(() => ({
    panelCount: state.panels.length,
    totalDuration: state.panels.reduce((sum, panel) => sum + panel.duration, 0),
    lastModified: state.lastModified
  }), [state.panels, state.lastModified]);
};

// Usage in components
const StoryboardStats = () => {
  const metadata = useStoryboardMetadata(); // Only re-renders when metadata changes
  
  return (
    <div>
      <span>Panels: {metadata.panelCount}</span>
      <span>Duration: {formatDuration(metadata.totalDuration)}</span>
    </div>
  );
};
```

## 🛠️ Service Layer Patterns

### 1. **Repository Pattern**

Abstract data access and provide a consistent interface:

```typescript
// Abstract repository interface
interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: K): Promise<void>;
}

// Concrete implementation for projects
class ProjectRepository implements Repository<Project> {
  private storageKey = 'storyboard-projects';
  
  async findById(id: string): Promise<Project | null> {
    const projects = await this.findAll();
    return projects.find(project => project.id === id) || null;
  }
  
  async findAll(): Promise<Project[]> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
  
  async save(project: Project): Promise<Project> {
    const projects = await this.findAll();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
    return project;
  }
  
  async delete(id: string): Promise<void> {
    const projects = await this.findAll();
    const filtered = projects.filter(project => project.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }
}
```

### 2. **Service Layer Pattern**

Encapsulate business logic and coordinate between different concerns:

```typescript
// Service with dependency injection
class StoryboardService {
  constructor(
    private projectRepository: ProjectRepository,
    private aiService: AIService,
    private exportService: ExportService
  ) {}
  
  async createProject(name: string): Promise<Project> {
    const project: Project = {
      id: generateId(),
      name,
      panels: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    return this.projectRepository.save(project);
  }
  
  async generateStoryboard(prompt: string): Promise<Panel[]> {
    // Business logic for AI generation
    const storyOutline = await this.aiService.generateStoryOutline(prompt);
    const panels: Panel[] = [];
    
    for (const scene of storyOutline.scenes) {
      const panel = await this.aiService.generatePanel(scene);
      panels.push(panel);
    }
    
    return panels;
  }
  
  async exportProject(projectId: string, format: ExportFormat): Promise<Blob> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    return this.exportService.export(project, format);
  }
}
```

## 🎯 Custom Hook Patterns

### 1. **Data Fetching Hook**

Encapsulate data fetching logic with loading states and error handling:

```typescript
interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });
  
  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      options.onError?.(err);
      throw err;
    }
  }, dependencies);
  
  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, options.immediate]);
  
  return { ...state, execute };
}

// Usage
const useProject = (projectId: string) => {
  return useAsync(
    () => projectRepository.findById(projectId),
    [projectId],
    {
      immediate: !!projectId,
      onError: (error) => toast.error(`Failed to load project: ${error.message}`)
    }
  );
};
```

### 2. **Local Storage Hook**

Manage local storage with React state synchronization:

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Update both state and localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);
  
  return [storedValue, setValue];
}
```

## 🔒 Security Patterns

### 1. **Input Validation Pattern**

Ensure data integrity and security:

```typescript
// Schema-based validation using Zod
import { z } from 'zod';

const PanelSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  shotType: z.enum(['close-up', 'wide-shot', 'medium-shot', 'extreme-close-up']),
  cameraAngle: z.enum(['high-angle', 'low-angle', 'eye-level', 'birds-eye', 'worms-eye']),
  duration: z.number().min(1000).max(60000), // 1s to 60s in milliseconds
  imageUrl: z.string().url().optional()
});

// Validation service
class ValidationService {
  static validatePanel(data: unknown): Panel {
    return PanelSchema.parse(data);
  }
  
  static isValidPanel(data: unknown): data is Panel {
    return PanelSchema.safeParse(data).success;
  }
}

// Usage in components and services
const handlePanelUpdate = (panelData: unknown) => {
  try {
    const validatedPanel = ValidationService.validatePanel(panelData);
    updatePanel(validatedPanel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(`Invalid panel data: ${error.errors.map(e => e.message).join(', ')}`);
    }
  }
};
```

### 2. **API Key Management Pattern**

Secure handling of sensitive credentials:

```typescript
class SecureStorage {
  private static encrypt(value: string): string {
    // Simple encryption for local storage (use crypto-js for production)
    return btoa(value);
  }
  
  private static decrypt(value: string): string {
    try {
      return atob(value);
    } catch {
      throw new Error('Failed to decrypt value');
    }
  }
  
  static setApiKey(key: string): void {
    const encrypted = this.encrypt(key);
    localStorage.setItem('ai_api_key', encrypted);
  }
  
  static getApiKey(): string | null {
    const encrypted = localStorage.getItem('ai_api_key');
    if (!encrypted) return null;
    
    try {
      return this.decrypt(encrypted);
    } catch {
      this.clearApiKey(); // Clear corrupted key
      return null;
    }
  }
  
  static clearApiKey(): void {
    localStorage.removeItem('ai_api_key');
  }
}

// Usage in AI service
class AIService {
  private getApiKey(): string {
    const key = SecureStorage.getApiKey();
    if (!key) {
      throw new Error('API key not found. Please configure your OpenAI API key.');
    }
    return key;
  }
  
  async generateContent(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    // Use API key for external service call
  }
}
```

## 📊 Performance Patterns

### 1. **Memoization Pattern**

Optimize expensive computations and prevent unnecessary re-renders:

```typescript
// Component memoization
const StoryboardPanel = React.memo<StoryboardPanelProps>(({ panel, onUpdate }) => {
  // Expensive computation with memoization
  const processedImageData = useMemo(() => {
    if (!panel.imageUrl) return null;
    return processImageForDisplay(panel.imageUrl);
  }, [panel.imageUrl]);
  
  // Stable callback reference
  const handleUpdate = useCallback((updates: Partial<Panel>) => {
    onUpdate(panel.id, updates);
  }, [panel.id, onUpdate]);
  
  return (
    <div className="panel">
      {processedImageData && <img src={processedImageData.url} alt={panel.description} />}
      <EditControls onUpdate={handleUpdate} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.panel.id === nextProps.panel.id &&
    prevProps.panel.imageUrl === nextProps.panel.imageUrl &&
    prevProps.panel.description === nextProps.panel.description
  );
});
```

### 2. **Lazy Loading Pattern**

Load components and resources on demand:

```typescript
// Lazy component loading
const TimelineView = React.lazy(() => 
  import('./components/TimelineView').then(module => ({
    default: module.TimelineView
  }))
);

const AIAssistant = React.lazy(() => 
  import('./components/AIAssistant').then(module => ({
    default: module.AIAssistant
  }))
);

// Usage with Suspense
const App = () => {
  const [activeView, setActiveView] = useState<'storyboard' | 'timeline'>('storyboard');
  
  return (
    <div className="app">
      <ViewSelector activeView={activeView} onViewChange={setActiveView} />
      
      <Suspense fallback={<LoadingSpinner />}>
        {activeView === 'storyboard' && <StoryboardView />}
        {activeView === 'timeline' && <TimelineView />}
      </Suspense>
      
      <Suspense fallback={<div>Loading AI Assistant...</div>}>
        <AIAssistant />
      </Suspense>
    </div>
  );
};
```

## 🧪 Testing Patterns

### 1. **Component Testing Pattern**

Test components in isolation with proper mocking:

```typescript
// Test utilities
const createMockStoryboardContext = (overrides?: Partial<StoryboardContextType>) => ({
  state: {
    panels: [],
    currentProject: null,
    isLoading: false,
    error: null,
    ...overrides?.state
  },
  dispatch: jest.fn(),
  actions: {
    addPanel: jest.fn(),
    updatePanel: jest.fn(),
    deletePanel: jest.fn(),
    ...overrides?.actions
  }
});

// Component test
describe('StoryboardPanel', () => {
  const mockPanel: Panel = {
    id: '1',
    description: 'Test panel',
    shotType: 'close-up',
    cameraAngle: 'eye-level',
    duration: 5000,
    imageUrl: 'https://example.com/image.jpg'
  };
  
  it('renders panel with correct information', () => {
    const mockContext = createMockStoryboardContext();
    
    render(
      <StoryboardContext.Provider value={mockContext}>
        <StoryboardPanel panel={mockPanel} onUpdate={jest.fn()} />
      </StoryboardContext.Provider>
    );
    
    expect(screen.getByText(mockPanel.description)).toBeInTheDocument();
    expect(screen.getByAltText(mockPanel.description)).toHaveAttribute('src', mockPanel.imageUrl);
  });
  
  it('calls onUpdate when panel is modified', async () => {
    const mockOnUpdate = jest.fn();
    const mockContext = createMockStoryboardContext();
    
    render(
      <StoryboardContext.Provider value={mockContext}>
        <StoryboardPanel panel={mockPanel} onUpdate={mockOnUpdate} />
      </StoryboardContext.Provider>
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Updated description');
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(mockPanel.id, {
      description: 'Updated description'
    });
  });
});
```

### 2. **Integration Testing Pattern**

Test complete user workflows:

```typescript
describe('Storyboard Creation Workflow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  it('allows users to create a complete storyboard', async () => {
    render(<App />);
    
    // Start new project
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await userEvent.click(newProjectButton);
    
    const projectNameInput = screen.getByLabelText(/project name/i);
    await userEvent.type(projectNameInput, 'Test Storyboard');
    
    const createButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(createButton);
    
    // Add panels
    const addPanelButton = screen.getByRole('button', { name: /add panel/i });
    await userEvent.click(addPanelButton);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    await userEvent.type(descriptionInput, 'Opening scene: Hero walking');
    
    const shotTypeSelect = screen.getByLabelText(/shot type/i);
    await userEvent.selectOptions(shotTypeSelect, 'wide-shot');
    
    const saveButton = screen.getByRole('button', { name: /save panel/i });
    await userEvent.click(saveButton);
    
    // Verify panel was created
    expect(screen.getByText('Opening scene: Hero walking')).toBeInTheDocument();
    
    // Verify project is saved
    const savedProject = JSON.parse(localStorage.getItem('storyboard-projects') || '[]')[0];
    expect(savedProject.name).toBe('Test Storyboard');
    expect(savedProject.panels).toHaveLength(1);
  });
});
```

These development patterns provide a robust foundation for building and maintaining large-scale React applications. They promote code reusability, maintainability, and scalability while ensuring high code quality and developer productivity. 