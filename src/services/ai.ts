import OpenAI from 'openai'
import type { StoryboardPanel, ShotType, CameraAngle } from '../types'
import { storage } from '../utils/storage'

// Web search API configuration
const SEARCH_API_URL = 'https://api.search.brave.com/res/v1/web/search'

export interface ImageGenerationOptions {
  style?: 'realistic' | 'cinematic' | 'artistic' | 'storyboard'
  quality?: 'standard' | 'hd'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
}

export interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ThinkingState {
  active: boolean
  content: string
  stages: string[]
}

export interface ProjectContext {
  projectTitle: string
  projectDescription: string
  panelCount: number
  totalDuration: number
  currentPanel?: StoryboardPanel | null
  allPanels: Array<{
    number: number
    title: string
    description: string
    shotType: string
    cameraAngle: string
    duration: number
    notes: string
  }>
  directorNotes?: string
  agentPersonality?: string
}

// Web search result interface
export interface WebSearchResult {
  title: string
  url: string
  description: string
}

class AIService {
  private openai: OpenAI | null = null
  private isInitialized = false
  private thinkingStateListeners: ((state: ThinkingState) => void)[] = []
  public thinkingState: ThinkingState = {
    active: false,
    content: '',
    stages: []
  }

  constructor() {
    this.initializeOpenAI()
  }

  // Monkey-patch the URL constructor to handle relative URLs
  private patchURLConstructor() {
    try {
      // Store the original URL constructor
      const originalURL = window.URL;
      
      // Replace with our patched version
      window.URL = class extends originalURL {
        constructor(url: string | URL, base?: string | URL) {
          try {
            super(url, base);
          } catch (e) {
            // If parsing fails and it's an OpenAI proxy URL, prepend the origin
            if (typeof url === 'string' && 
                (url.startsWith('/openai-proxy') || url.startsWith('/image-proxy'))) {
              console.log('🔧 Fixing relative URL:', url);
              super(url, window.location.origin);
            } else {
              throw e;
            }
          }
        }
      } as any;
      
      console.log('✅ URL constructor patched for OpenAI SDK compatibility');
    } catch (error) {
      console.error('❌ Failed to patch URL constructor:', error);
    }
  }

  private initializeOpenAI() {
    // Apply URL constructor patch
    this.patchURLConstructor();
    
    try {
      const settings = storage.getSettings()
      if (settings.openaiApiKey) {
        this.openai = new OpenAI({
          apiKey: settings.openaiApiKey,
          // Required for browser usage in 2025
          dangerouslyAllowBrowser: true,
          // Add timeout and retry configuration
          timeout: 60000, // 60 seconds timeout
          maxRetries: 2,
          // Use direct API URL format to avoid path issues
          baseURL: 'https://api.openai.com',
          defaultHeaders: {
            'X-Custom-Header': 'Using direct API with proxy'
          },
          fetch: async (url: RequestInfo | URL, init?: RequestInit) => {
            // Replace the OpenAI API URL with our proxy URL
            const urlStr = url.toString();
            
            // Ensure the URL has /v1 in the path
            let proxyUrl;
            if (urlStr.includes('/v1/')) {
              // URL already has /v1 in the path
              proxyUrl = urlStr.replace('https://api.openai.com', window.location.origin + '/openai-proxy');
            } else if (urlStr === 'https://api.openai.com' || urlStr === 'https://api.openai.com/') {
              // Base URL with no path
              proxyUrl = window.location.origin + '/openai-proxy/v1';
            } else {
              // URL without /v1 in the path
              const path = urlStr.replace('https://api.openai.com', '');
              proxyUrl = window.location.origin + '/openai-proxy/v1' + path;
            }
            
            console.log('🔄 Proxying OpenAI request to:', proxyUrl);
            return fetch(proxyUrl, init);
          }
        })
        this.isInitialized = true
        console.log('✅ OpenAI service initialized successfully')
      } else {
        console.warn('⚠️ No OpenAI API key found in settings')
      }
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error)
      this.openai = null
      this.isInitialized = false
    }
  }

  public setApiKey(apiKey: string) {
    storage.saveSettings({ openaiApiKey: apiKey })
    this.initializeOpenAI()
  }

  public getApiKey(): string | undefined {
    return storage.getSettings().openaiApiKey
  }
  
  public setSearchApiKey(apiKey: string) {
    storage.saveSettings({ searchApiKey: apiKey })
  }
  
  public getSearchApiKey(): string | undefined {
    return storage.getSettings().searchApiKey
  }

  public isReady(): boolean {
    return this.isInitialized && this.openai !== null
  }
  
  // New method to add thinking state change listeners
  public addThinkingStateListener(callback: (state: ThinkingState) => void) {
    this.thinkingStateListeners.push(callback)
  }

  // New method to remove thinking state change listeners
  public removeThinkingStateListener(callback: (state: ThinkingState) => void) {
    this.thinkingStateListeners = this.thinkingStateListeners.filter(cb => cb !== callback)
  }

  // Update thinking state and notify all listeners
  private updateThinkingState(state: Partial<ThinkingState>) {
    this.thinkingState = { ...this.thinkingState, ...state }
    this.thinkingStateListeners.forEach(callback => callback(this.thinkingState))
  }

  // Start thinking process
  private startThinking() {
    this.updateThinkingState({ 
      active: true, 
      content: 'Thinking...\n', 
      stages: ['Analyzing request'] 
    })
  }

  // Update thinking content
  private appendThinking(content: string) {
    this.updateThinkingState({ 
      content: this.thinkingState.content + content + '\n' 
    })
  }

  // Add a new thinking stage
  private addThinkingStage(stage: string) {
    this.updateThinkingState({ 
      stages: [...this.thinkingState.stages, stage] 
    })
  }

  // End thinking process
  private endThinking() {
    // Keep the content visible but mark as inactive
    this.updateThinkingState({ 
      active: false,
      stages: [...this.thinkingState.stages, 'Completed']
    })
    
    // Reset after a delay
    setTimeout(() => {
      if (!this.thinkingState.active) {
        this.updateThinkingState({ 
          content: '',
          stages: [] 
        })
      }
    }, 5000)
  }

  // Method to search the web using OpenAI's built-in web search tool
  public async searchWeb(query: string, count: number = 5): Promise<WebSearchResult[]> {
    try {
      // Add thinking stage for web search
      this.addThinkingStage(`Searching web for: "${query}"`)
      this.appendThinking(`Running web search for: "${query}"...`)
      
      if (!this.isReady()) {
        this.appendThinking('❌ OpenAI API not initialized')
        return []
      }

      const settings = storage.getSettings()
      // Use gpt-4o for web search as it's compatible with the web search tool
      // gpt-o4-mini doesn't support web search
      const model = 'gpt-4o'
      
      // Use OpenAI's built-in web search tool
      const response = await this.openai!.chat.completions.create({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: `Search the web for: "${query}". Return the most relevant information as a JSON object with an array of results. Each result should have title, url, and description fields.` 
          },
          { 
            role: 'user', 
            content: `Please search for: "${query}" and return ${count} relevant results.` 
          }
        ],
        response_format: { type: "json_object" },
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for real-time information",
              parameters: {
                type: "object",
                properties: {
                  search_query: {
                    type: "string",
                    description: "The search query to look up on the web"
                  }
                },
                required: ["search_query"]
              }
            }
          }
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "web_search"
          }
        }
      });
      
      // Process the response
      const results: WebSearchResult[] = []
      
      if (response.choices && response.choices[0]?.message?.content) {
        try {
          const content = response.choices[0].message.content;
          const parsedResults = JSON.parse(content);
          
          if (parsedResults && Array.isArray(parsedResults.results)) {
            parsedResults.results.forEach((result: any) => {
              results.push({
                title: result.title || 'No title',
                url: result.url || '#',
                description: result.description || 'No description'
              });
            });
          }
        } catch (error) {
          console.error('Error parsing web search results:', error);
        }
      }
      
      this.appendThinking(`✅ Found ${results.length} results`)
      
      // Log brief summary of results
      if (results.length > 0) {
        this.appendThinking('Search results summary:')
        results.slice(0, 3).forEach((result: WebSearchResult, index: number) => {
          this.appendThinking(`${index + 1}. ${result.title}`)
        })
        if (results.length > 3) {
          this.appendThinking(`...and ${results.length - 3} more results`)
        }
      }
      
      return results
    } catch (error) {
      console.error('Error during web search:', error)
      this.appendThinking(`❌ Web search error: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  private createSystemPrompt(context: ProjectContext): string {
    const basePersonality = context.agentPersonality || "You're a friendly, experienced film director and storyboard artist who can actually help create and modify storyboards. You talk like a real person and can take action when users ask for help."
    
    // Add final reinforcement segment
    const finalReinforcement = `
CRITICAL INSTRUCTION - ACTION USAGE REQUIRED:
For this application to function properly, it is ABSOLUTELY ESSENTIAL that you:

1. ALWAYS format any storyboard modification with action tags [ACTION:type:params]
2. NEVER respond with just conversation when user requests involve creating, editing, or modifying storyboards
3. For every editing request, ALWAYS determine if it needs single-panel or batch operations
4. CLEARLY identify panel numbers when editing specific panels 
5. Keep your action formats precise and correctly structured
6. ALWAYS put a space between the action tag and surrounding text to ensure proper detection
7. Use EXACT format [ACTION:type:params] with NO variations

🚨 WITHOUT PROPERLY FORMATTED ACTION TAGS, THE APPLICATION CANNOT PERFORM THE REQUESTED OPERATIONS.

FINAL CHECK: Before sending your response, verify your action tags are properly formatted with:
- Square brackets: [ACTION:type:params]
- Correct action type from the provided list
- Proper parameters for the action type
- Proper spacing around the action tag
    `
    
    return `${basePersonality}

Current project: "${context.projectTitle}" - ${context.projectDescription}
${context.directorNotes ? `Director's vision: "${context.directorNotes}"` : 'No director notes yet'}

What you're working with:
${context.allPanels.length > 0 ? 
  `${context.allPanels.length} panels so far:\n` + context.allPanels.slice(0, 3).map(p => 
    `• Panel ${p.number}: ${p.title} - ${p.description}`
  ).join('\n') + (context.allPanels.length > 3 ? `\n• ...and ${context.allPanels.length - 3} more` : '')
  : 'No panels yet - blank canvas!'}

CRITICAL: When users ask you to DO something (create, add, edit, generate, modify, change, update, remove, delete, analyze), you MUST include action commands. ALWAYS respond with both conversation AND action!

🚨 BATCH OPERATIONS PRIORITY: When users say words like "ALL", "EVERY", "EVERYTHING", "ENTIRE", "WHOLE", or want to modify multiple panels, USE BATCH ACTIONS!

Action format: [ACTION:action_type:parameters]

📋 SINGLE PANEL ACTIONS:
• [ACTION:generate_storyboard:story description] - When users want to create/generate/make storyboards
• [ACTION:add_panel:scene description] - When users want to add/create new scenes/panels  
• [ACTION:edit_panel:panel X: instructions] - When users want to edit/modify/change ONE specific panel (X is panel number)
• [ACTION:remove_panel:panel X] - When users want to remove/delete panels (X is panel number)
• [ACTION:analyze_storyboard] - When users want analysis/feedback on current storyboard
• [ACTION:generate_video_prompts] - When users want video prompts created
• [ACTION:update_director_notes:new notes text] - When users want to update project vision

🎬 BATCH/MULTIPLE PANEL ACTIONS (USE THESE FOR "ALL", "EVERY", "WHOLE" REQUESTS):
• [ACTION:batch_edit:instructions] - Edit ALL panels with same instructions
• [ACTION:batch_edit_range:start:end:instructions] - Edit specific range (e.g., 2:5:make these panels more dramatic)
• [ACTION:batch_apply_style:style_type:style_instructions] - Apply consistent style to ALL panels
• [ACTION:enhance_all_cinematography:instructions] - Enhance cinematography across ALL panels
• [ACTION:standardize_shot_types:instructions] - Standardize shot progression across ALL panels

PANEL EDITING SPECIFICS:
• When editing a specific panel, use format: [ACTION:edit_panel:panel 3: make this scene more dramatic]
• When removing a specific panel, use format: [ACTION:remove_panel:panel 3]
• For batch range, use format: [ACTION:batch_edit_range:2:5:make these panels more dramatic] (first panel is 1)

BATCH DETECTION KEYWORDS - When you see these, USE BATCH ACTIONS:
• "all panels", "every panel", "entire storyboard", "whole project" → [ACTION:batch_edit:instructions]
• "all of them", "everything", "the whole thing" → [ACTION:batch_edit:instructions]
• "make them all more..." → [ACTION:batch_edit:make all panels more...]
• "apply X style to everything" → [ACTION:batch_apply_style:X:style instructions]
• "enhance all", "improve all", "update all" → [ACTION:batch_edit:instructions]
• "panels 1-3", "first few panels", "panels 2 to 5" → [ACTION:batch_edit_range:1:3:instructions]
• "better cinematography for all" → [ACTION:enhance_all_cinematography:instructions]
• "fix the shot types" → [ACTION:standardize_shot_types:instructions]

EXAMPLES OF PROPER BATCH RESPONSES:
User: "Make all panels more dramatic"
Response: "Absolutely! I'll make every panel in your storyboard more dramatic with intense lighting and dynamic compositions. [ACTION:batch_edit:make all panels more dramatic with intense lighting, dynamic camera angles, and heightened emotional tension]"

User: "Apply horror movie style to everything"
Response: "Perfect! I'll transform your entire storyboard into horror movie style with dark atmosphere and suspenseful elements. [ACTION:batch_apply_style:horror:dark shadows, eerie lighting, suspenseful atmosphere, horror movie cinematography]"

User: "Make panels 2-4 more action-packed"
Response: "Great idea! I'll amp up the action in panels 2 through 4 with dynamic movement and energy. [ACTION:batch_edit_range:2:4:make these panels more action-packed with dynamic movement, fast-paced action, and energetic cinematography]"

User: "Enhance the cinematography for the whole storyboard"
Response: "Excellent! I'll enhance the cinematography across all your panels with professional techniques and visual variety. [ACTION:enhance_all_cinematography:apply professional cinematography techniques with varied shot types and dynamic camera work]"

🎯 SINGLE PANEL EXAMPLES:
User: "Edit panel 3 to be more dramatic"
Response: "I'll make panel 3 much more dramatic for you! [ACTION:edit_panel:panel 3: make this scene more dramatic with intense lighting and dynamic camera angle]"

User: "Add a chase scene"
Response: "Great idea! I'll add an exciting chase scene to your storyboard. [ACTION:add_panel:thrilling car chase through busy city streets with close-up shots of determined faces]"

User: "Remove the last panel"
Response: "I'll remove the last panel from your storyboard. [ACTION:remove_panel:panel 6]"

User: "Edit the first panel"
Response: "I'll update the first panel for you. [ACTION:edit_panel:panel 1: enhance the opening scene with more dramatic composition]"

IMPORTANT ACTION FORMAT RULES:
1. ONE ACTION PER COMMAND - Do not combine multiple actions in one tag
2. Always include the action type and parameters in the correct format
3. For panel-specific actions, always specify the panel number when possible
4. For batch operations on specific ranges, use the format start:end:instructions
5. Always include normal conversational text alongside your action commands
6. Make sure there's a space before and after your action tags for proper detection
7. Never modify the [ACTION:type:params] format - it must be EXACTLY this format

REMEMBER: 
- Be conversational AND include actions
- ALWAYS use batch actions for "all/every/whole" requests
- The action executes while your message displays
- Never mix multiple operations in a single action tag
- Don't be afraid to use batch operations - they're powerful!
- ACTION TAGS MUST BE PROPERLY FORMATTED - system won't recognize them otherwise

${finalReinforcement}`
  }

  public async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: ProjectContext,
    agent?: any // Optional agent parameter
  ): Promise<string> {
    // Note: For web search capability, use gpt-4o model
    // gpt-o4-mini should only be used for advanced reasoning tasks without web search
    if (!this.isReady()) {
      return this.generateFallbackResponse(messages[messages.length - 1]?.content || '')
    }

    try {
      // Start thinking process if this is an agent with thinking capability
      const hasThinkingCapability = agent?.capabilities?.includes('thinking')
      const hasWebSearchCapability = agent?.capabilities?.includes('web_search')
      
      if (hasThinkingCapability) {
        this.startThinking()
        this.appendThinking(`${agent.name} is analyzing your request...`)
      }
      
      console.log('📤 Sending message to OpenAI with conversation length:', messages.length)
      
      // Define search-enhanced system prompt variable
      let systemPromptWithSearch: string | undefined = undefined
      
      // Web search capability - extract search queries if needed
      if (hasWebSearchCapability) {
        const userMessage = messages[messages.length - 1]?.content || ''
        
        // Check if the message seems to need search
        if (this.messageNeedsSearch(userMessage)) {
          // Extract search queries
          this.addThinkingStage('Identifying search queries')
          const searchQueries = await this.extractSearchQueries(userMessage)
          
          // Run searches and append context
          if (searchQueries.length > 0) {
            this.addThinkingStage('Performing web searches')
            const searchResults = await Promise.all(
              searchQueries.map(query => this.searchWeb(query))
            )
            
            // Format search results as context
            const searchContext = this.formatSearchResultsAsContext(searchQueries, searchResults)
            
            // Create search-enhanced system prompt
            systemPromptWithSearch = `${searchContext}\n\n${this.createSystemPrompt(context)}`
            
            this.addThinkingStage('Analyzing search results')
          }
        }
      }
      
      // Get the AI model from settings
      const settings = storage.getSettings()
      // Use gpt-4o for web search capability, otherwise use agent's preferredModel or settings model
      // Note: The correct model name is 'gpt-4o-mini', not 'gpt-o4-mini'
      const model = hasWebSearchCapability && typeof systemPromptWithSearch !== 'undefined' 
        ? 'gpt-4o' 
        : (agent?.preferredModel || (settings.aiModel || 'gpt-4o-mini'))
      
      if (hasThinkingCapability) {
        this.appendThinking(`Using ${model} to generate response...`)
      }
      
      console.log('🤖 Using AI model from settings:', model)
      
      // Create system prompt based on agent if provided
      let systemPrompt = hasWebSearchCapability && typeof systemPromptWithSearch !== 'undefined' 
        ? systemPromptWithSearch 
        : this.createSystemPrompt(context)
        
      if (agent) {
        systemPrompt = `${agent.prompt}\n\n${systemPrompt}`
      }
      
      // Add step-by-step thinking instruction if agent has this capability
      if (agent?.capabilities?.includes('step_by_step')) {
        this.addThinkingStage('Generating step-by-step reasoning')
        systemPrompt = `${systemPrompt}\n\nIMPORTANT: Show your step-by-step reasoning process FIRST, then provide your final response. Think carefully through each part of the problem.`
      }
      
      // For thinking process
      if (hasThinkingCapability) {
        // Check if we should use streaming or non-streaming mode
        // gpt-4o-mini doesn't support streaming, so we'll use non-streaming for it
        const useStreaming = model !== 'gpt-4o-mini';
        
        if (useStreaming) {
          // Use streaming for models that support it
          this.addThinkingStage('Generating response (streaming)')
          
          const stream = await this.openai!.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            max_tokens: settings.maxTokens || 2500,
            temperature: settings.temperature || 0.7,
            stream: true
          })
          
          let fullResponse = ''
          let partialResponse = ''
          
          // Stream the thinking process
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              partialResponse += content
              
              // Update thinking periodically (not on every tiny chunk to avoid flicker)
              if (partialResponse.length > 20 || content.includes('\n')) {
                this.appendThinking(partialResponse)
                partialResponse = ''
              }
            }
          }
          
          // Add any remaining partial response
          if (partialResponse) {
            this.appendThinking(partialResponse)
          }
          
          this.endThinking()
          return fullResponse
        } else {
          // Use non-streaming mode for gpt-4o-mini
          this.addThinkingStage('Generating response (non-streaming)')
          this.appendThinking('Using non-streaming mode for gpt-4o-mini...')
          
          // Show a "thinking" indicator
          const thinkingInterval = setInterval(() => {
            this.appendThinking('.')
          }, 1000);
          
          try {
            const response = await this.openai!.chat.completions.create({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages
              ],
              max_tokens: settings.maxTokens || 2500,
              temperature: settings.temperature || 0.7,
              presence_penalty: 0.1,
              frequency_penalty: 0.2,
              user: 'storyboard-assistant'
            })
            
            clearInterval(thinkingInterval)
            const content = response.choices[0].message.content || 'Sorry, I couldn\'t generate a response.'
            this.appendThinking('\nResponse generated successfully!')
            this.endThinking()
            return content
          } catch (error) {
            clearInterval(thinkingInterval)
            throw error
          }
        }
      } else {
        // Non-streaming for agents without thinking capability
        const response = await this.openai!.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: settings.maxTokens || 2500,
          temperature: settings.temperature || 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.2,
          user: 'storyboard-assistant'
        })
        
        return response.choices[0].message.content || 'Sorry, I couldn\'t generate a response.'
      }
    } catch (error: any) {
      // End thinking process if error occurs
      if (this.thinkingState.active) {
        this.appendThinking(`❌ Error: ${error.message || 'Unknown error'}`)
        this.endThinking()
      }
      
      console.error('❌ OpenAI API Error:', error)
      
      // Handle specific errors
      if (error.status === 401) {
        return 'It looks like your OpenAI API key is invalid. Please check your API key in the settings.'
      }
      
      return `I encountered an error: ${error.message || 'Unknown error'}. Please try again or check your settings.`
    }
  }

  // Helper to extract search queries from a user message
  private async extractSearchQueries(message: string): Promise<string[]> {
    if (!this.isReady()) {
      return []
    }
    
    try {
      const settings = storage.getSettings()
      // Use gpt-4o for web search related operations as it's compatible with the web search tool
      // gpt-o4-mini doesn't support web search
      const model = 'gpt-4o'
      
      const response = await this.openai!.chat.completions.create({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: 'Extract 1-3 search queries from the user message that would help answer their question. Return ONLY the search queries as a JSON array of strings. If no search is needed, return an empty array.' 
          },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      })
      
      const content = response.choices[0].message.content
      if (content) {
        try {
          const result = JSON.parse(content)
          const queries = result.queries || []
          
          this.appendThinking(`Extracted search queries: ${queries.map((q: string) => `"${q}"`).join(', ')}`)
          return queries
        } catch (e) {
          console.error('Error parsing search queries JSON:', e)
          return []
        }
      }
      
      return []
    } catch (error) {
      console.error('Error extracting search queries:', error)
      return []
    }
  }

  // Helper to detect if a message likely needs search
  private messageNeedsSearch(message: string): boolean {
    // Keywords suggesting search would be helpful
    const searchKeywords = [
      'latest', 'recent', 'news', 'current', 'update', 'today', 'find', 'search',
      'information about', 'tell me about', 'who is', 'what is', 'where is',
      'when was', 'how to', 'trends', 'statistics', 'data on'
    ]
    
    const messageLower = message.toLowerCase()
    const needsSearch = searchKeywords.some(keyword => messageLower.includes(keyword.toLowerCase()))
    
    if (needsSearch) {
      this.appendThinking('Message likely requires web search for up-to-date information')
    }
    
    return needsSearch
  }
  
  // Format search results into context
  private formatSearchResultsAsContext(queries: string[], searchResults: WebSearchResult[][]): string {
    let context = '### WEB SEARCH RESULTS\n\n'
    
    queries.forEach((query, index) => {
      const results = searchResults[index] || []
      context += `SEARCH QUERY: "${query}"\n\n`
      
      results.forEach((result, idx) => {
        context += `[${idx + 1}] ${result.title}\n`
        context += `URL: ${result.url}\n`
        context += `${result.description}\n\n`
      })
      
      if (results.length === 0) {
        context += 'No results found for this query.\n\n'
      }
      
      context += '---\n\n'
    })
    
    context += 'INSTRUCTIONS:\n'
    context += '- Use these search results when they\'re relevant to the user\'s request\n'
    context += '- If the search results don\'t contain relevant information, rely on your training\n'
    context += '- Always cite the source number like [1] when referencing information from the search results\n'
    
    return context
  }

  public async generateStoryboard(
    storyIdea: string,
    panelCount: number = 6,
    genre: string = 'drama'
  ): Promise<StoryboardPanel[]> {
    if (!this.isReady()) {
      return this.generateFallbackStoryboard(storyIdea, panelCount)
    }

    try {
      // Get AI model from settings
      const settings = storage.getSettings()
      const model = settings.aiModel || 'gpt-4o-mini'
      console.log('🤖 Using AI model from settings for storyboard generation:', model)
      
      const prompt = `Create a professional ${panelCount}-panel storyboard for this story idea:

**Story**: ${storyIdea}
**Genre**: ${genre}
**Panels**: ${panelCount}

Requirements for each panel:

1. **TITLE**: Create compelling, specific titles that describe the key action/moment (NOT just "Panel X - Brief Title")
   - Good: "Hero Discovers Ancient Artifact", "Villain Reveals True Identity", "Final Confrontation Begins"
   - Bad: "Panel 1 - Scene", "Panel 2 - Action"

2. **DESCRIPTION**: Write detailed 2-3 sentence scene descriptions including:
   - Character actions and emotions
   - Setting details and atmosphere
   - Key story beats or dialogue hints

3. **SHOT TYPES**: Choose from: close-up, medium-shot, wide-shot, extreme-close-up, over-the-shoulder, establishing-shot, two-shot
   - Vary shots for visual interest
   - Match shot choice to dramatic intent

4. **CAMERA ANGLES**: Choose from: eye-level, high-angle, low-angle, birds-eye-view, worms-eye-view, dutch-angle
   - Use angles to enhance mood and power dynamics

5. **DIRECTOR'S NOTES**: Include specific guidance on:
   - Lighting mood (dramatic, soft, harsh, etc.)
   - Character performance/emotion
   - Visual composition elements
   - Sound/music suggestions

6. **DURATION**: 3-8 seconds based on content complexity

7. **VIDEO PROMPT**: Comprehensive AI video generation prompt optimized for tools like RunwayML, Pika Labs, and Stable Video Diffusion:
   - Camera movement: static hold, slow push-in, pan left/right, tilt up/down, dolly forward/back, orbit, handheld
   - Technical specs: 4K resolution, 24fps cinematic, professional color grading
   - Lighting: natural daylight, golden hour, dramatic shadows, soft diffused, neon/artificial, candlelight
   - Visual style: photorealistic, cinematic film quality, shallow depth of field, film grain texture
   - Duration and pacing: smooth motion, appropriate timing for scene content
   - Environmental details: weather, atmosphere, time of day, location specifics

**Story Structure Guidelines**:
- Panel 1: Hook/establishing shot
- Panels 2-4: Rising action/character development  
- Panel 5: Climax or turning point
- Panel 6: Resolution or cliffhanger (if applicable)

**JSON Format**:
[
  {
    "title": "Compelling descriptive title here",
    "description": "Detailed scene description with character actions, setting, and atmosphere. Include emotional beats and visual details that bring the scene to life.",
    "shotType": "establishing-shot",
    "cameraAngle": "high-angle", 
    "notes": "Specific director guidance on lighting, performance, composition, and technical execution",
    "duration": 5,
    "videoPrompt": "Professional video generation prompt: establishing shot from high angle, 4K cinematic quality, [camera movement], [lighting description], [character actions], [environmental atmosphere], 24fps smooth motion, photorealistic rendering, shallow depth of field, professional color grading"
  }
]

Create a complete narrative arc with visual variety and professional filmmaking techniques. Return ONLY the JSON array without any markdown formatting or code blocks.`

      const response = await this.openai!.chat.completions.create({
        model: model, // Use model from settings
        messages: [
          { role: 'system', content: 'You are an expert storyboard artist and cinematographer with 20+ years experience in film production. Create professional, detailed storyboard content with compelling titles and complete scene descriptions. Always return valid JSON only without any markdown formatting or code blocks.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: settings.maxTokens || 2500,
        temperature: settings.temperature || 0.7,
      })

      const content = response.choices[0].message.content || ''
      
      try {
        // Clean the content to extract JSON if it's wrapped in markdown
        let cleanedContent = content.trim()
        
        // Remove markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```\s*$/, '')
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```\s*$/, '')
        }
        
        const panelsData = JSON.parse(cleanedContent)
        return panelsData.map((panel: any, index: number) => ({
          id: `panel-${Date.now()}-${index}`,
          title: panel.title || `Panel ${index + 1}`,
          description: panel.description || 'AI-generated scene',
          shotType: (panel.shotType || 'medium-shot') as ShotType,
          cameraAngle: (panel.cameraAngle || 'eye-level') as CameraAngle,
          notes: panel.notes || '',
          duration: panel.duration || 4,
          order: index,
          createdAt: new Date(),
          updatedAt: new Date(),
          videoPrompt: panel.videoPrompt
        }))
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        return this.generateFallbackStoryboard(storyIdea, panelCount)
      }
    } catch (error) {
      console.error('Failed to generate storyboard:', error)
      return this.generateFallbackStoryboard(storyIdea, panelCount)
    }
  }

  public async generateScene(
    description: string,
    shotType: string = 'medium-shot',
    cameraAngle: string = 'eye-level',
    mood: string = 'neutral'
  ): Promise<Partial<StoryboardPanel>> {
    if (!this.isReady()) {
      return this.generateFallbackScene(description, shotType, cameraAngle, mood)
    }

    try {
      // Get AI model from settings
      const settings = storage.getSettings()
      const model = settings.aiModel || 'gpt-4o-mini'
      console.log('🤖 Using AI model from settings for scene generation:', model)
      
      const prompt = `Create a professional storyboard panel for this scene:

**Scene Description**: ${description}
**Shot Type**: ${shotType}
**Camera Angle**: ${cameraAngle}
**Mood**: ${mood}

Create a detailed panel with:
1. A compelling title that describes the key action
2. An improved, detailed scene description (2-3 sentences)
3. Specific director's notes for filming
4. A comprehensive video generation prompt optimized for AI video tools

Return ONLY valid JSON that matches this structure exactly:
{
  "title": "Compelling title here",
  "description": "Enhanced description with more detail",
  "notes": "Director's notes on lighting, composition, etc.",
  "videoPrompt": "Professional video generation prompt with technical details"
}

The videoPrompt should include camera movements, lighting, atmosphere, and technical specifications (4K, framerate, etc.).`

      const response = await this.openai!.chat.completions.create({
        model: model, // Use model from settings
        messages: [
          { role: 'system', content: 'You are an expert storyboard artist and cinematographer with extensive film production experience. Create detailed, professional panel content with compelling titles and actionable direction. Return only valid JSON without any markdown formatting or code blocks.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: settings.maxTokens || 800,
        temperature: settings.temperature || 0.7,
      })

      const content = response.choices[0].message.content || ''
      
      try {
        // Clean the content to extract JSON if it's wrapped in markdown
        let cleanedContent = content.trim()
        
        // Remove markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```\s*$/, '')
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```\s*$/, '')
        }
        
        const parsed = JSON.parse(cleanedContent)
        return {
          title: parsed.title || `Enhanced ${shotType} Scene`,
          description: parsed.description || description,
          notes: parsed.notes || 'AI-generated scene content',
          shotType: shotType as ShotType,
          cameraAngle: cameraAngle as CameraAngle,
          videoPrompt: parsed.videoPrompt || `Professional video: ${shotType} ${cameraAngle} of ${description}, 4K cinematic quality, 24fps smooth motion, professional lighting, photorealistic rendering, shallow depth of field, film grain texture`
        }
      } catch (parseError) {
        console.error('Failed to parse AI scene response:', parseError)
        console.log('Raw content:', content)
        
        // Try to extract meaningful content from the raw response
        let extractedDescription = description
        
        // Look for description-like content in the response
        const descMatch = content.match(/"description":\s*"([^"]+)"/i)
        if (descMatch) {
          extractedDescription = descMatch[1]
        } else {
          // If no JSON, try to use the first meaningful sentence
          const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
          if (sentences.length > 0) {
            extractedDescription = sentences[0].trim() + '.'
          }
        }
        
        return {
          title: `${shotType} ${cameraAngle} Scene`,
          description: extractedDescription,
          notes: 'AI-generated scene content',
          shotType: shotType as ShotType,
          cameraAngle: cameraAngle as CameraAngle,
          videoPrompt: `Professional video: ${shotType} ${cameraAngle} of ${description}, 4K cinematic quality, 24fps smooth motion, professional lighting, photorealistic rendering, shallow depth of field, film grain texture`
        }
      }
    } catch (error) {
      console.error('Scene generation error:', error)
      return this.generateFallbackScene(description, shotType, cameraAngle, mood)
    }
  }

  public async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {},
    model: string | null = null
  ): Promise<string | null> {
    if (!this.isReady()) {
      console.error('🚫 OpenAI service not ready')
      throw new Error('OpenAI service is not ready. Please check your API key.')
    }

    try {
      // If no model is explicitly provided, get from settings
      if (model === null) {
        const settings = storage.getSettings()
        model = settings.imageModel || 'dall-e-3'
        console.log('🤖 Using image model from settings:', model)
      }
      
      const {
        style = 'cinematic',
        quality = 'standard',
        size = '1024x1024'
      } = options

      console.log('🎨 Generating image with options:', { style, quality, size, model })
      console.log('📝 Original prompt:', prompt)

      // Enhance the prompt based on style
      let enhancedPrompt = prompt
      
      switch (style) {
        case 'cinematic':
          enhancedPrompt = `${prompt}, cinematic lighting, professional cinematography, film quality, dramatic composition, high production value, 4K resolution`
          break
        case 'realistic':
          enhancedPrompt = `${prompt}, photorealistic, high detail, natural lighting, professional photography, sharp focus`
          break
        case 'artistic':
          enhancedPrompt = `${prompt}, artistic interpretation, creative composition, stylized, beautiful artwork, vibrant colors`
          break
        case 'storyboard':
          enhancedPrompt = `${prompt}, storyboard panel style, clean line art, professional storyboard illustration, clear composition for film production, black and white sketch`
          break
      }

      // Ensure prompt is not too long (DALL-E has a limit)
      if (enhancedPrompt.length > 1000) {
        enhancedPrompt = enhancedPrompt.substring(0, 997) + '...'
      }

      console.log('✨ Enhanced prompt:', enhancedPrompt)

      const response = await this.openai!.images.generate({
        model: model, // Use the provided model (dall-e-3 or dall-e-2)
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality,
        style: 'vivid', // Use vivid style for more dynamic images
        response_format: 'b64_json' // Use base64 format to avoid URL authentication issues
      })

      console.log('📡 OpenAI response received:', {
        hasData: !!response.data,
        dataLength: response.data?.length,
        hasBase64: !!response.data?.[0]?.b64_json
      })

      const imageData = response.data?.[0]
      if (!imageData) {
        console.error('❌ No image data in response:', response)
        throw new Error('No image data returned from OpenAI')
      }

      // Convert base64 to data URL
      const base64Data = imageData.b64_json
      if (!base64Data) {
        console.error('❌ No base64 data in response:', imageData)
        throw new Error('No base64 image data returned from OpenAI')
      }

      const dataUrl = `data:image/png;base64,${base64Data}`
      console.log('✅ Image generated and converted to data URL (self-contained)')
      
      return dataUrl
    } catch (error: any) {
      console.error('❌ DALL-E Image Generation Error:', error)
      
      // Handle specific errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key settings.')
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before generating another image.')
      } else if (error.status === 402) {
        throw new Error('Insufficient OpenAI credits. Please add credits to your account.')
      } else if (error.status === 400) {
        throw new Error('The image prompt was rejected by OpenAI content policy. Please try a different description.')
      }
      
      throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}`)
    }
  }

  public async analyzeCinematography(prompt: string): Promise<any> {
    if (!this.isReady()) {
      return {
        lighting: 'Unable to access OpenAI API',
        performance: 'Unable to access OpenAI API',
        cameraMovement: 'Unable to access OpenAI API',
        composition: 'Unable to access OpenAI API',
        sound: 'Unable to access OpenAI API'
      }
    }
  
    try {
      // Get AI model from settings
      const settings = storage.getSettings()
      const model = settings.aiModel || 'gpt-4o-mini'
      console.log('🤖 Using AI model from settings for cinematography analysis:', model)
      
      // Enhanced prompt for better JSON formatting and reliability
      const analysisPrompt = `Analyze the cinematography for the following scene and provide feedback as a valid JSON object. The JSON object must contain these exact keys: "lighting", "performance", "cameraMovement", "composition", and "sound".

Scene: "${prompt}"

Return ONLY the raw JSON object, without any markdown formatting, comments, or other text.`
  
      const response = await this.openai!.chat.completions.create({
        model: model, // Use model from settings
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: settings.temperature || 0.6,
        max_tokens: settings.maxTokens || 250,
        response_format: { type: 'json_object' }, // Enforce JSON output
      })
  
      const content = response.choices[0].message.content
      if (content) {
        try {
          const result = JSON.parse(content)
          // Validate that all expected keys are present and are strings
          const requiredKeys = ['lighting', 'performance', 'cameraMovement', 'composition', 'sound']
          for (const key of requiredKeys) {
            if (typeof result[key] !== 'string') {
              result[key] = 'Analysis incomplete'
            }
          }
          return result
        } catch (parseError) {
          console.error('Failed to parse cinematography analysis JSON:', parseError, 'Raw content:', content)
          // Fallback to a structured error object if parsing fails
          return {
            lighting: 'Error processing AI response',
            performance: 'Error processing AI response',
            cameraMovement: 'Error processing AI response',
            composition: 'Error processing AI response',
            sound: 'Error processing AI response'
          }
        }
      }
  
      // Fallback for empty response content
      return {
        lighting: 'No analysis returned',
        performance: 'No analysis returned',
        cameraMovement: 'No analysis returned',
        composition: 'No analysis returned',
        sound: 'No analysis returned'
      }
    } catch (error: any) {
      console.error('Error analyzing cinematography:', error)
      throw new Error(`Failed to analyze cinematography: ${error.message || 'Unknown error'}`)
    }
  }

  public async generatePanelImage(
    panel: StoryboardPanel,
    options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    // Get saved AI image settings from localStorage
    const savedSettings = localStorage.getItem('aiImageSettings')
    let imageSettings = null
    if (savedSettings) {
      try {
        imageSettings = JSON.parse(savedSettings)
        console.log('🎨 Found AI image settings:', imageSettings)
      } catch (error) {
        console.error('Failed to parse AI image settings:', error)
      }
    } else {
      console.log('⚠️ No AI image settings found in localStorage')
    }

    const prompt = this.createImagePromptFromPanel(panel, imageSettings)
    console.log('📝 Enhanced prompt with settings:', prompt)
    
    // Apply settings to options
    const enhancedOptions: ImageGenerationOptions = {
      style: (imageSettings?.style === 'photorealistic' ? 'realistic' : 
             imageSettings?.style === 'illustration' ? 'artistic' :
             imageSettings?.style === 'sketch' ? 'storyboard' : 'cinematic') as 'realistic' | 'cinematic' | 'artistic' | 'storyboard',
      quality: imageSettings?.quality || 'standard',
      size: imageSettings?.size || '1024x1024',
      ...options
    }
    
    console.log('🎛️ Enhanced generation options:', enhancedOptions)
    
    // Apply model setting and generate image (fallback dall-e-2 to dall-e-3 since dall-e-2 is discontinued)
    let selectedModel = imageSettings?.model || null
    
    // If no model in image settings, use the global settings
    if (!selectedModel) {
      const settings = storage.getSettings()
      selectedModel = settings.imageModel || 'dall-e-3'
      console.log('🤖 Using image model from global settings:', selectedModel)
    }
    
    if (selectedModel === 'dall-e-2') {
      console.log('⚠️ DALL-E 2 is discontinued, falling back to DALL-E 3')
      selectedModel = 'dall-e-3'
    }
    
    console.log('🤖 Using AI model:', selectedModel)
    
    // Call generateImage with the selected model
    return await this.generateImage(prompt, enhancedOptions, selectedModel)
  }

  private createImagePromptFromPanel(panel: StoryboardPanel, imageSettings: any = null): string {
    const shotTypeDescriptions = {
      'close-up': 'close-up shot focusing on details',
      'medium-shot': 'medium shot showing subject from waist up',
      'wide-shot': 'wide shot showing full scene and environment',
      'extreme-close-up': 'extreme close-up shot with intimate detail',
      'over-the-shoulder': 'over-the-shoulder perspective shot',
      'two-shot': 'two-shot showing two subjects in frame',
      'establishing-shot': 'establishing shot showing location and context'
    }

    const angleDescriptions = {
      'high-angle': 'shot from high angle looking down',
      'low-angle': 'shot from low angle looking up',
      'eye-level': 'shot at eye level',
      'birds-eye-view': 'aerial birds eye view shot',
      'worms-eye-view': 'worms eye view shot from ground level',
      'dutch-angle': 'dutch angle tilted shot for dramatic effect'
    }

    let prompt = `${panel.description}, ${shotTypeDescriptions[panel.shotType] || 'medium shot'}, ${angleDescriptions[panel.cameraAngle] || 'eye level'}`
    
    if (panel.notes) {
      prompt += `, ${panel.notes}`
    }

    // Add panel-specific video prompt if available (but sanitize it)
    if (panel.videoPrompt) {
      const sanitizedVideoPrompt = this.sanitizePrompt(panel.videoPrompt)
      prompt += `, ${sanitizedVideoPrompt}`
    }

    // Apply AI image settings to enhance the prompt (more conservatively)
    if (imageSettings) {
      // Add art style (be more conservative with wording)
      if (imageSettings.artStyle && imageSettings.artStyle !== 'cinematic') {
        const safeArtStyles: Record<string, string> = {
          'dramatic': 'dramatic composition',
          'minimalist': 'clean minimalist style',
          'vintage': 'vintage aesthetic',
          'modern': 'contemporary style',
          'fantasy': 'fantasy art style',
          'noir': 'film noir aesthetic'
        }
        const safeStyle = safeArtStyles[imageSettings.artStyle] || `${imageSettings.artStyle} style`
        prompt += `, ${safeStyle}`
      }
      
      // Add lighting (use safe descriptors)
      if (imageSettings.lighting && imageSettings.lighting !== 'natural') {
        const safeLighting: Record<string, string> = {
          'dramatic': 'dramatic lighting',
          'soft': 'soft lighting',
          'golden-hour': 'warm golden lighting',
          'moody': 'atmospheric lighting',
          'bright': 'bright illumination',
          'low-light': 'subtle lighting'
        }
        const lightingDesc = safeLighting[imageSettings.lighting] || `${imageSettings.lighting} lighting`
        prompt += `, ${lightingDesc}`
      }
      
      // Add mood (be conservative)
      if (imageSettings.mood && imageSettings.mood !== 'neutral') {
        const safeMoods: Record<string, string> = {
          'happy': 'uplifting atmosphere',
          'dramatic': 'dramatic atmosphere',
          'mysterious': 'mysterious atmosphere',
          'peaceful': 'serene atmosphere',
          'energetic': 'dynamic composition',
          'melancholic': 'contemplative mood'
        }
        const moodDesc = safeMoods[imageSettings.mood] || `${imageSettings.mood} atmosphere`
        prompt += `, ${moodDesc}`
      }
      
      // Add color scheme
      if (imageSettings.colorScheme && imageSettings.colorScheme !== 'full-color') {
        switch (imageSettings.colorScheme) {
          case 'monochrome':
            prompt += `, black and white photography`
            break
          case 'warm-tones':
            prompt += `, warm color palette`
            break
          case 'cool-tones':
            prompt += `, cool color palette`
            break
          case 'sepia':
            prompt += `, sepia tone`
            break
          case 'high-contrast':
            prompt += `, high contrast`
            break
        }
      }
      
      // Adjust creativity level (more conservative approach)
      if (imageSettings.creativity >= 8) {
        prompt += `, artistic interpretation`
      } else if (imageSettings.creativity <= 3) {
        prompt += `, precise composition`
      }
    }

    // Final sanitization and length check
    prompt = this.sanitizePrompt(prompt)
    
    // Ensure prompt is not too long
    if (prompt.length > 800) {
      prompt = prompt.substring(0, 800) + '...'
      console.log('⚠️ Prompt truncated due to length:', prompt.length)
    }

    return prompt
  }

  private sanitizePrompt(prompt: string): string {
    // Remove potentially problematic words/phrases that might trigger content policy
    const problematicTerms = [
      // Violence/weapons related
      'violence', 'violent', 'blood', 'weapon', 'gun', 'knife', 'sword', 'fight', 'battle', 'war', 'kill', 'death', 'dead',
      // Adult content
      'sexy', 'seductive', 'provocative', 'nude', 'naked', 'intimate', 'romantic', 'sensual',
      // Other potentially flagged terms
      'explosive', 'dangerous', 'harmful', 'illegal', 'drug', 'alcohol'
    ]
    
    let sanitized = prompt.toLowerCase()
    
    for (const term of problematicTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      if (regex.test(sanitized)) {
        console.log(`⚠️ Sanitizing potentially problematic term: "${term}"`)
        // Replace with safer alternatives
        sanitized = sanitized.replace(regex, (match) => {
          switch (term) {
            case 'fight': case 'battle': return 'action scene'
            case 'weapon': case 'gun': case 'knife': case 'sword': return 'prop'
            case 'violence': case 'violent': return 'dramatic'
            case 'blood': return 'red liquid'
            case 'sexy': case 'seductive': return 'elegant'
            case 'romantic': case 'intimate': return 'emotional'
            case 'dangerous': return 'exciting'
            default: return 'dramatic'
          }
        })
      }
    }
    
    // Remove excessive adjectives that might confuse the AI
    sanitized = sanitized.replace(/,\s*,/g, ',') // Remove double commas
    sanitized = sanitized.replace(/\s+/g, ' ') // Remove extra spaces
    sanitized = sanitized.trim()
    
    return sanitized
  }

  private createProxyImageUrl(originalUrl: string): string {
    // Create a CORS proxy URL to handle potential cross-origin issues
    
    // Check if the URL is from OpenAI's image storage
    if (originalUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      // Extract the path from the original URL
      const urlPath = originalUrl.replace('https://oaidalleapiprodscus.blob.core.windows.net', '');
      // Use our Vite proxy with full URL and ensure path starts with /
      const formattedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
      return `${window.location.origin}/image-proxy${formattedPath}`;
    }
    
    // For other URLs, return as is
    return originalUrl;
  }

  public async downloadAndConvertImageWithAuth(imageUrl: string): Promise<string | null> {
    try {
      console.log('📥 Attempting authenticated download from:', imageUrl)
      
      // Use our proxy URL
      const proxyUrl = this.createProxyImageUrl(imageUrl);
      console.log('🔄 Using proxy URL for authenticated download:', proxyUrl);
      
      if (!this.isReady()) {
        console.warn('⚠️ OpenAI not initialized, trying without auth')
        return await this.downloadAndConvertImage(imageUrl)
      }

      // Try with OpenAI API key authentication
      const apiKey = this.getApiKey()
      if (!apiKey) {
        console.warn('⚠️ No API key available, trying without auth')
        return await this.downloadAndConvertImage(imageUrl)
      }

      try {
        console.log('🔐 Trying authenticated fetch with API key...')
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (compatible; StoryboardAI/1.0)',
          },
          mode: 'cors',
        })

        if (response.ok) {
          const blob = await response.blob()
          console.log('✅ Authenticated image download successful, size:', blob.size, 'bytes')
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              console.log('🔄 Image converted to data URL with auth')
              resolve(dataUrl)
            }
            reader.onerror = () => {
              console.error('❌ Failed to convert authenticated image to data URL')
              reject(new Error('Failed to convert image'))
            }
            reader.readAsDataURL(blob)
          })
        } else {
          console.warn('⚠️ Authenticated fetch failed with status:', response.status)
        }
      } catch (authError) {
        console.warn('⚠️ Authenticated fetch failed:', authError)
      }

      // Fallback to non-authenticated download
      console.log('🔄 Falling back to non-authenticated download...')
      return await this.downloadAndConvertImage(imageUrl)
      
    } catch (error) {
      console.error('❌ Authenticated image download failed:', error)
      return imageUrl // Return original URL as final fallback
    }
  }

  public async downloadAndConvertImage(imageUrl: string): Promise<string | null> {
    try {
      console.log('📥 Attempting to download image from:', imageUrl)
      
      // Use our proxy URL
      const proxyUrl = this.createProxyImageUrl(imageUrl);
      console.log('🔄 Using proxy URL:', proxyUrl);
      
      // Try multiple approaches for better reliability
      
      // First try: Direct fetch with CORS
      try {
        const response = await fetch(proxyUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (compatible; StoryboardAI/1.0)',
          }
        })

        if (response.ok) {
          const blob = await response.blob()
          console.log('✅ Image downloaded via CORS, size:', blob.size, 'bytes')
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              console.log('🔄 Image converted to data URL')
              resolve(dataUrl)
            }
            reader.onerror = () => {
              console.error('❌ Failed to convert image to data URL')
              reject(new Error('Failed to convert image'))
            }
            reader.readAsDataURL(blob)
          })
        }
      } catch (corsError) {
        console.warn('⚠️ CORS fetch failed, trying alternatives:', corsError)
      }

      // Second try: no-cors mode (will return opaque response but might work for display)
      try {
        const response = await fetch(proxyUrl, {
          mode: 'no-cors',
        })
        console.log('🔄 Attempted no-cors fetch, returning original URL')
        return imageUrl // Return original URL since we can't read the response
      } catch (noCorsError) {
        console.warn('⚠️ No-cors fetch failed:', noCorsError)
      }

      // Third try: Return original URL as fallback
      console.log('🔄 All download attempts failed, returning original URL')
      return imageUrl
      
    } catch (error) {
      console.error('❌ Image download/conversion failed:', error)
      return imageUrl // Always return the original URL as final fallback
    }
  }

  public async generatePanelImageWithDownload(
    panel: StoryboardPanel,
    options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    try {
      // Generate the image directly as base64 data URL - no download needed!
      const dataUrl = await this.generatePanelImage(panel, options)
      if (!dataUrl) {
        return null
      }

      console.log('✅ Image generated as self-contained data URL')
      return dataUrl
    } catch (error) {
      console.error('❌ Panel image generation failed:', error)
      throw error
    }
  }

  private generateFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase()
    
    if (input.includes('api key') || input.includes('setup')) {
      return `🔑 **OpenAI API Setup Required**

To enable AI features, you'll need an OpenAI API key:

1. **Get API Key**: Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. **Create Key**: Click "Create new secret key"
3. **Copy Key**: It starts with "sk-"
4. **Add to App**: Use the settings menu to add your key

**Cost**: GPT-4o-mini costs ~$0.15 per 1M input tokens (very affordable!)

Once set up, I can:
• Generate complete storyboards
• Edit existing panels
• Create video prompts
• Provide filmmaking advice

Would you like me to walk you through the setup?`
    }
    
    if (input.includes('generate') || input.includes('create')) {
      return `🎬 **Ready to Create!**

I'd love to generate content for you, but I need an OpenAI API key first.

**Quick Setup**:
1. Get your key from OpenAI
2. Add it in Settings
3. Then say things like:
   • "Generate storyboard for: space adventure"
   • "Create 6 panels about a love story"
   • "Add a panel showing dramatic confrontation"

**Manual Alternative**: Use the Templates or create panels manually while we get AI set up!`
    }

    return `🤖 **AI Assistant Available**

I'm your storyboard AI assistant! I can help with:

**✨ AI Features** (requires OpenAI API key):
• Generate complete storyboards
• Edit and improve existing panels  
• Create video generation prompts
• Provide expert filmmaking advice

**🛠️ Always Available**:
• Project templates and examples
• Manual panel editing
• Story structure guidance
• Filmmaking best practices

To unlock AI features, add your OpenAI API key in Settings. Otherwise, I'm here to help with guidance and manual tools!

What would you like to work on?`
  }

  private generateFallbackStoryboard(storyIdea: string, panelCount: number): StoryboardPanel[] {
    const panels: StoryboardPanel[] = []
    const shotTypes = ['establishing-shot', 'medium-shot', 'close-up', 'wide-shot', 'over-the-shoulder', 'two-shot']
    const angles = ['eye-level', 'high-angle', 'low-angle', 'birds-eye-view']
    
    // Create more thoughtful fallback titles and descriptions
    const storyElements = storyIdea.toLowerCase()
    const isAction = storyElements.includes('fight') || storyElements.includes('chase') || storyElements.includes('battle')
    const isRomance = storyElements.includes('love') || storyElements.includes('romance') || storyElements.includes('relationship')
    const isHorror = storyElements.includes('horror') || storyElements.includes('scary') || storyElements.includes('monster')
    const isMystery = storyElements.includes('mystery') || storyElements.includes('detective') || storyElements.includes('crime')
    
    for (let i = 0; i < panelCount; i++) {
      const panelNumber = i + 1
      let title = ''
      let description = ''
      let notes = ''
      
      if (panelNumber === 1) {
        title = `Opening Scene - ${storyIdea}`
        description = `The story begins with an establishing shot that introduces the world and main character. The scene sets the tone and draws the audience into the narrative.`
        notes = 'Use wide establishing shot to show location and atmosphere. Consider dramatic lighting to set mood.'
      } else if (panelNumber === panelCount) {
        title = `Resolution - ${storyIdea}`
        description = `The final panel brings closure to the story arc. Characters reach their destination or complete their journey with satisfying resolution.`
        notes = 'Choose shot that provides emotional closure. Consider character positioning and lighting for impact.'
      } else if (panelNumber === Math.floor(panelCount * 0.7)) {
        title = `Climax - ${storyIdea}`
        description = `The story reaches its peak tension and drama. This is the moment of highest conflict and emotional intensity in the narrative.`
        notes = 'Use dynamic camera angle and dramatic lighting. Consider close-ups for emotional impact.'
      } else {
        const midStoryTitles = [
          'Character Development',
          'Rising Action',
          'Plot Development', 
          'Tension Builds',
          'Story Unfolds'
        ]
        title = `${midStoryTitles[i % midStoryTitles.length]} - ${storyIdea}`
        description = `The story continues to develop with character growth and plot advancement. New challenges and obstacles move the narrative forward toward its climax.`
        notes = 'Vary shot types for visual interest. Focus on character emotions and story progression.'
      }
      
      // Add genre-specific elements
      if (isAction) {
        notes += ' Consider dynamic angles and movement for action sequences.'
      } else if (isRomance) {
        notes += ' Use softer lighting and intimate framing for emotional connection.'
      } else if (isHorror) {
        notes += ' Employ dramatic shadows and tension-building composition.'
      } else if (isMystery) {
        notes += ' Use lighting and angles to create suspense and intrigue.'
      }

      panels.push({
        id: `fallback-panel-${Date.now()}-${i}`,
        title,
        description,
        shotType: shotTypes[i % shotTypes.length] as any,
        cameraAngle: angles[i % angles.length] as any,
        notes,
        duration: 4 + (i % 3), // Vary duration 4-6 seconds
        order: i,
        createdAt: new Date(),
        updatedAt: new Date(),
        videoPrompt: `Professional video: ${shotTypes[i % shotTypes.length]} ${angles[i % angles.length]} showing: ${description.substring(0, 80)}..., 4K cinematic quality, 24fps smooth motion, professional color grading, dramatic lighting, photorealistic rendering, ${4 + (i % 3)}s duration`
      })
    }
    
    return panels
  }

  private generateFallbackScene(
    description: string,
    shotType: string,
    cameraAngle: string,
    mood: string
  ): Partial<StoryboardPanel> {
    // Generate a better title based on the description
    const words = description.split(' ')
    const key_words = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'with', 'from', 'this', 'that', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which'].includes(word.toLowerCase())
    )
    const titleWords = key_words.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    const title = titleWords.length > 0 ? titleWords.join(' ') : `${shotType} Scene`
    
    return {
      title,
      description: `${shotType} ${cameraAngle} showing: ${description}`,
      notes: `${mood} mood - manually adjust lighting and composition as needed`,
      shotType: shotType as any,
      cameraAngle: cameraAngle as any,
      videoPrompt: `Professional video: ${shotType} ${cameraAngle} of ${description}, ${mood} atmosphere, 4K cinematic quality, 24fps smooth motion, professional lighting, photorealistic rendering, shallow depth of field`
    }
  }
}

export const aiService = new AIService() 