# Cursor IDE Rules for Storyboard AI - ConPort Optimized Development
# Technical Configuration for Large Codebase Management

## IDE Integration Settings

### ConPort MCP Configuration
- MCP Server: ConPort running on local workspace
- Database: .conport/context.db (auto-created)
- Vector Store: ChromaDB for semantic search
- Workspace ID: /Users/jamisonstevens/Documents/Storyboard AI

### File Indexing Priorities
1. **Architecture Files** (High Priority)
   - ARCHITECTURE.md - Core system design
   - DEVELOPMENT_PATTERNS.md - Established patterns
   - KNOWLEDGE_INDEX.md - Concept relationships
   - CONTEXT_MANAGEMENT.md - ConPort integration guide

2. **ConPort Documentation** (High Priority)
   - CONPORT_INTEGRATION.md - Usage instructions
   - CONPORT_WORKFLOW.md - Daily development workflow
   - CONPORT_OPTIMIZATION_GUIDE.md - Implementation strategy

3. **Core Source Files** (High Priority)
   - src/types/index.ts - TypeScript definitions
   - src/context/*.tsx - React Context providers
   - src/services/*.ts - Business logic layer

4. **Component Files** (Medium Priority, Size-Ordered)
   - AIAssistant.tsx (81KB) - AI integration patterns
   - ProjectManager.tsx (39KB) - Project lifecycle
   - VideoPromptGenerator.tsx (31KB) - Content generation
   - StoryboardPanel.tsx (30KB) - Core domain logic

## Code Intelligence Configuration

### TypeScript Analysis
- Enable strict type checking for all new code
- Prioritize type inference from src/types/index.ts
- Use ConPort for understanding complex type relationships
- Reference existing patterns before creating new interfaces

### React Component Analysis
- Index component hierarchy: Context → Services → Components → Utils
- Track component dependencies and data flow
- Monitor component size and complexity metrics
- Use ConPort to understand component relationships

### Import Resolution
- Prioritize relative imports for project files
- Use absolute imports for shared utilities
- Reference ConPort for understanding module dependencies
- Follow established import patterns from large components

## ConPort Query Optimization

### Semantic Search Keywords
- "architectural decision" - for design choices
- "design pattern" - for reusable solutions  
- "component pattern" - for React-specific patterns
- "domain concept" - for business logic understanding
- "integration pattern" - for service connections
- "error handling" - for resilience patterns
- "performance optimization" - for efficiency improvements

### Knowledge Graph Navigation
- Start with architectural decisions for context
- Follow relationships to implementation patterns
- Use glossary terms for domain understanding
- Link components through shared concepts

### Context Assembly Strategy
1. **Foundation Context** (Architecture + Decisions)
2. **Pattern Context** (Design patterns + Code examples)
3. **Domain Context** (Business logic + Terminology)
4. **Implementation Context** (Specific components + Dependencies)

## Large File Handling

### Component Navigation Strategy
- Use ConPort semantic search before opening large files
- Break down understanding by functionality sections
- Reference related smaller components first
- Use type definitions to understand data flow

### Memory Management
- Close unused large files (>30KB) when not actively editing
- Use ConPort queries instead of keeping multiple large files open
- Prioritize focused editing over broad exploration
- Cache frequently accessed patterns in ConPort

### Search Optimization
- Use ConPort semantic search for conceptual queries
- Use IDE search for specific code patterns
- Combine both for comprehensive understanding
- Document search patterns in ConPort for reuse

## Development Workflow Integration

### Pre-Development Setup
1. Query ConPort for related concepts and decisions
2. Open relevant architecture documentation
3. Check established patterns in DEVELOPMENT_PATTERNS.md
4. Identify affected components and dependencies

### Active Development
- Keep ConPort queries focused and specific
- Log decisions and patterns as they emerge
- Update progress tracking for complex features
- Link new concepts to existing knowledge graph

### Post-Development
- Update ConPort with new learnings
- Document any new patterns discovered
- Update component relationships if changed
- Validate against established architectural principles

## Error Handling & Debugging

### ConPort Integration Issues
- Check MCP server connection status
- Verify workspace ID configuration
- Test database connectivity (.conport/context.db)
- Validate semantic search functionality

### Large Component Debugging
- Use ConPort to understand component context before debugging
- Reference established error patterns
- Check related components for similar issues
- Document debugging insights in ConPort

### Performance Monitoring
- Monitor ConPort query response times (<200ms target)
- Track IDE responsiveness with large files open
- Optimize semantic search query construction
- Use ConPort for performance pattern references

## Code Quality Standards

### TypeScript Compliance
- Maintain strict type safety standards
- Use established interfaces from src/types/index.ts
- Reference ConPort for complex type relationships
- Document new type patterns for reuse

### React Best Practices
- Follow established Context patterns (StoryboardContext, ThemeContext)
- Use proper component lifecycle patterns
- Implement error boundaries for large components
- Reference ConPort for component architecture decisions

### Documentation Standards
- Update KNOWLEDGE_INDEX.md for new concepts
- Log architectural decisions to ConPort
- Maintain ConPort glossary with domain terms
- Keep documentation synchronized with code changes

## Collaboration Features

### Knowledge Sharing
- Use ConPort for documenting team insights
- Share complex implementation decisions with rationale
- Maintain up-to-date architectural decision log
- Document lessons learned from large component refactoring

### Code Review Preparation
- Query ConPort for related decisions before reviews
- Validate against established patterns
- Check for proper error handling implementation
- Ensure TypeScript compliance and type safety

## Advanced Features

### AI-Assisted Development
- Use ConPort context for more accurate AI suggestions
- Reference established patterns for AI prompts
- Leverage semantic search for finding similar implementations
- Log AI-generated solutions that work well

### Automated Pattern Detection
- Monitor for repeated code patterns across large components
- Use ConPort to document discovered patterns
- Consider extracting common patterns into utilities
- Track pattern usage and effectiveness

### Continuous Optimization
- Regular ConPort database optimization
- Monitor and improve semantic search accuracy
- Update knowledge graph relationships
- Refine development workflow based on usage patterns

## Environment Configuration

### Required Tools
- Node.js (for React/TypeScript development)
- Python 3.8+ (for ConPort MCP server)
- SQLite (for ConPort database)
- ChromaDB (for vector embeddings)

### Recommended Extensions
- TypeScript and React IntelliSense
- Error lens for immediate feedback
- GitLens for version control context
- ConPort MCP integration (when available)

## Performance Targets

### Context Assembly
- ConPort query response: <200ms
- Knowledge graph traversal: <100ms
- Semantic search results: <300ms
- Full context assembly: <500ms

### IDE Responsiveness
- Large file opening: <2s
- Type checking: <3s for full project
- IntelliSense response: <500ms
- Search across codebase: <1s

This configuration optimizes Cursor IDE for efficient development with ConPort integration, focusing on large codebase navigation and knowledge management. 