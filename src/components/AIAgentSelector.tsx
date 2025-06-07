import { useState, useRef, useEffect } from 'react'
import { Star, Sparkles, Users, Heart, Brain, Zap, Eye, Wand2 } from 'lucide-react'
import { AIAgent } from '../types'
import { aiAgents, agentCategories, getRandomAgent } from '../services/aiAgents'
import WindowFrame from './WindowFrame'
import { useTheme } from '../context/ThemeContext'

interface AIAgentSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectAgent: (agent: AIAgent) => void
  currentAgent?: AIAgent
}

export default function AIAgentSelector({ 
  isOpen, 
  onClose, 
  onSelectAgent, 
  currentAgent 
}: AIAgentSelectorProps) {
  const { state: themeState } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>(aiAgents)
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('ai-agent-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Filter agents based on category and search
  useEffect(() => {
    let filtered = aiAgents

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = agentCategories.find(cat => cat.id === selectedCategory)
      if (category) {
        filtered = category.agents
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAgents(filtered)
  }, [selectedCategory, searchQuery])

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const toggleFavorite = (agentId: string) => {
    const newFavorites = favorites.includes(agentId)
      ? favorites.filter(id => id !== agentId)
      : [...favorites, agentId]
    
    setFavorites(newFavorites)
    localStorage.setItem('ai-agent-favorites', JSON.stringify(newFavorites))
  }

  const selectRandomAgent = () => {
    const randomAgent = getRandomAgent()
    onSelectAgent(randomAgent)
    onClose()
  }

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent.id)
    setTimeout(() => {
      onSelectAgent(agent)
      onClose()
    }, 300)
  }

  const getPersonalityColor = (personality: string) => {
    const colors: Record<string, string> = {
      creative: 'bg-purple-100 text-purple-700',
      professional: 'bg-blue-100 text-blue-700',
      friendly: 'bg-green-100 text-green-700',
      analytical: 'bg-indigo-100 text-indigo-700',
      enthusiastic: 'bg-orange-100 text-orange-700',
      calm: 'bg-teal-100 text-teal-700',
      witty: 'bg-yellow-100 text-yellow-700',
      inspiring: 'bg-pink-100 text-pink-700'
    }
    return colors[personality] || 'bg-secondary text-secondary'
  }

  const getAgentCategory = (agent: AIAgent): string => {
    const specialty = agent.specialty.toLowerCase()
    if (specialty.includes('creative') || specialty.includes('artistic')) return 'Creative'
    if (specialty.includes('technical') || specialty.includes('data')) return 'Technical'
    if (specialty.includes('cultural') || specialty.includes('international')) return 'Cultural'
    if (specialty.includes('social') || specialty.includes('modern')) return 'Modern'
    if (specialty.includes('therapy') || specialty.includes('wellness')) return 'Wellness'
    return 'General'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Creative': return <Wand2 className="w-5 h-5" />
      case 'Technical': return <Brain className="w-5 h-5" />
      case 'Cultural': return <Users className="w-5 h-5" />
      case 'Modern': return <Zap className="w-5 h-5" />
      case 'Wellness': return <Heart className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your AI Assistant"
      subtitle="Select the perfect creative partner"
      icon={<Users className="w-5 h-5" />}
      defaultWidth="600px"
      defaultHeight="700px"
      minWidth={400}
      minHeight={500}
    >
      {/* Enhanced Search with Glass Effect */}
      <div 
        className="p-6 border-b glass-effect animate-slide-in"
        style={{
          backgroundColor: `${themeState.theme.colors.background.secondary}90`,
          borderColor: themeState.theme.colors.border.primary,
          backdropFilter: 'blur(12px)'
        }}
      >
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assistants by name, specialty, or skills..."
          className="input-modern w-full"
          style={{
            backgroundColor: themeState.theme.colors.background.primary,
            borderColor: themeState.theme.colors.border.primary,
            color: themeState.theme.colors.text.primary
          }}
        />
      </div>

      {/* Enhanced Categories with Better Theming */}
      <div 
        className="p-4 border-b glass-subtle animate-slide-in-bottom"
        style={{
          backgroundColor: `${themeState.theme.colors.background.primary}95`,
          borderColor: themeState.theme.colors.border.primary,
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex flex-wrap gap-2">
          {['all', ...Array.from(new Set(aiAgents.map(agent => getAgentCategory(agent))))].map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 animate-fade-in animate-delay-${index * 50}`}
              style={{
                background: selectedCategory === category
                  ? `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                  : `${themeState.theme.colors.background.secondary}80`,
                color: selectedCategory === category
                  ? 'white'
                  : themeState.theme.colors.text.primary,
                borderColor: selectedCategory === category
                  ? 'transparent'
                  : themeState.theme.colors.border.primary,
                boxShadow: selectedCategory === category
                  ? `0 4px 12px ${themeState.theme.colors.primary[500]}40`
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {category !== 'all' && getCategoryIcon(category)}
              <span className="capitalize font-semibold">
                {category === 'all' ? 'All Assistants' : category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Agent Grid with Better Animations */}
      <div className="flex-1 overflow-y-auto p-6 scrollable">
        <div className="grid gap-4">
          {filteredAgents.map((agent, index) => {
            const isSelected = selectedAgent === agent.id
            const isFavorite = favorites.includes(agent.id)
            const isCurrentAgent = currentAgent?.id === agent.id

            return (
              <div
                key={agent.id}
                className={`relative card-interactive p-4 transition-all duration-500 cursor-pointer animate-grid-item animate-grid-stagger-${(index % 9) + 1} ${
                  isSelected ? 'animate-glow' : ''
                }`}
                style={{
                  backgroundColor: isCurrentAgent 
                    ? `${themeState.theme.colors.primary[50]}95`
                    : `${themeState.theme.colors.background.secondary}90`,
                  borderColor: isSelected 
                    ? themeState.theme.colors.primary[500]
                    : isCurrentAgent
                    ? themeState.theme.colors.primary[300]
                    : themeState.theme.colors.border.primary,
                  borderWidth: isSelected || isCurrentAgent ? '2px' : '1px',
                  boxShadow: isSelected 
                    ? `0 8px 32px ${themeState.theme.colors.primary[500]}40, 0 0 0 4px ${themeState.theme.colors.primary[500]}20`
                    : isCurrentAgent
                    ? `0 4px 20px ${themeState.theme.colors.primary[300]}30`
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(12px)',
                  transform: 'translateZ(0)'
                }}
                onClick={() => handleSelectAgent(agent)}
              >
                {/* Enhanced Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg animate-float"
                      style={{
                        background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                      }}
                    >
                      <span className="drop-shadow-sm">{agent.avatar}</span>
                    </div>
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: themeState.theme.colors.text.primary }}
                      >
                        {agent.name}
                      </h3>
                      <p 
                        className="text-sm font-medium"
                        style={{ color: themeState.theme.colors.text.secondary }}
                      >
                        {agent.specialty}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(agent.id)
                    }}
                    className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: isFavorite 
                        ? `${themeState.theme.colors.primary[100]}80`
                        : `${themeState.theme.colors.background.tertiary}80`,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <Star className={`w-5 h-5 transition-all duration-300 ${
                      isFavorite 
                        ? 'fill-yellow-400 text-yellow-400 animate-pulse' 
                        : 'text-gray-400 hover:text-yellow-400'
                    }`} />
                  </button>
                </div>

                {/* Enhanced Personality */}
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles 
                    className="w-4 h-4 animate-pulse" 
                    style={{ color: themeState.theme.colors.primary[500] }}
                  />
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm"
                    style={{
                      backgroundColor: `${themeState.theme.colors.primary[100]}90`,
                      color: themeState.theme.colors.primary[700],
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {agent.personality}
                  </span>
                </div>

                {/* Enhanced Description */}
                <p 
                  className="text-sm leading-relaxed mb-4 font-medium"
                  style={{ color: themeState.theme.colors.text.secondary }}
                >
                  {agent.description}
                </p>

                {/* Enhanced Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.skills.slice(0, 3).map((skill, skillIndex) => (
                    <span 
                      key={skillIndex} 
                      className="px-3 py-1 text-xs font-medium rounded-lg animate-fade-in"
                      style={{
                        backgroundColor: `${themeState.theme.colors.background.tertiary}90`,
                        color: themeState.theme.colors.text.secondary,
                        backdropFilter: 'blur(8px)',
                        animationDelay: `${skillIndex * 100}ms`
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {agent.skills.length > 3 && (
                    <span 
                      className="px-3 py-1 text-xs font-medium rounded-lg opacity-75"
                      style={{
                        backgroundColor: `${themeState.theme.colors.primary[100]}90`,
                        color: themeState.theme.colors.primary[600],
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      +{agent.skills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Enhanced Example */}
                <div 
                  className="rounded-xl p-4 glass-subtle"
                  style={{
                    backgroundColor: `${themeState.theme.colors.background.tertiary}80`,
                    borderColor: `${themeState.theme.colors.border.primary}60`,
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <h4 
                    className="text-sm font-bold mb-2 flex items-center space-x-1"
                    style={{ color: themeState.theme.colors.text.primary }}
                  >
                    <span>💡</span>
                    <span>Try asking:</span>
                  </h4>
                  <p 
                    className="text-sm italic font-medium leading-relaxed"
                    style={{ color: themeState.theme.colors.text.secondary }}
                  >
                    "{agent.examples[0]}"
                  </p>
                </div>

                {/* Enhanced Current Agent Indicator */}
                {isCurrentAgent && (
                  <div className="absolute top-3 right-16">
                    <div 
                      className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`,
                        color: 'white',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Enhanced Footer */}
      <div 
        className="p-6 border-t glass-effect animate-slide-in-bottom"
        style={{
          backgroundColor: `${themeState.theme.colors.background.secondary}90`,
          borderColor: themeState.theme.colors.border.primary,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p 
              className="text-sm font-medium"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              {filteredAgents.length} assistant{filteredAgents.length !== 1 ? 's' : ''} available
            </p>
            {currentAgent && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`,
                    color: 'white'
                  }}
                >
                  {currentAgent.avatar}
                </div>
                <span 
                  className="text-xs font-medium"
                  style={{ color: themeState.theme.colors.text.tertiary }}
                >
                  Current: {currentAgent.name}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={selectRandomAgent}
              className="btn-secondary flex items-center space-x-2 animate-bounce-in animate-delay-100"
            >
              <Sparkles className="w-4 h-4" />
              <span>Surprise Me</span>
            </button>
            <button
              onClick={onClose}
              className="btn-ghost animate-bounce-in animate-delay-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
} 