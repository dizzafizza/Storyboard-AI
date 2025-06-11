import { useState, useEffect } from 'react'
import { MessageSquare, Trash2, Edit3, Search, Clock, User, AlertTriangle, History } from 'lucide-react'
import { SavedChat, AIAgent } from '../types'
import { chatManager } from '../services/chatManager'
import { getAgentById } from '../services/aiAgents'
import WindowFrame from './WindowFrame'

interface ChatHistoryManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectChat: (chat: SavedChat) => void
  currentChatId?: string
}

export default function ChatHistoryManager({ 
  isOpen, 
  onClose, 
  onSelectChat, 
  currentChatId 
}: ChatHistoryManagerProps) {
  const [chats, setChats] = useState<SavedChat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredChats, setFilteredChats] = useState<SavedChat[]>([])
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all')

  // Load chats on component mount
  useEffect(() => {
    if (isOpen) {
      loadChats()
    }
  }, [isOpen])

  // Filter chats based on search and agent filter
  useEffect(() => {
    let filtered = chats

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Filter by agent
    if (selectedAgentFilter !== 'all') {
      filtered = filtered.filter(chat => chat.agentId === selectedAgentFilter)
    }

    setFilteredChats(filtered)
  }, [chats, searchQuery, selectedAgentFilter])

  const loadChats = () => {
    const allChats = chatManager.getAllChats()
    setChats(allChats)
  }

  const handleSelectChat = (chat: SavedChat) => {
    onSelectChat(chat)
    onClose()
  }

  const handleDeleteChat = async (chatId: string) => {
    const success = chatManager.deleteChat(chatId)
    if (success) {
      loadChats()
      setShowDeleteConfirm(null)
    }
  }

  const handleRenameChat = (chatId: string, currentName: string) => {
    setEditingChatId(chatId)
    setEditingName(currentName)
  }

  const handleSaveRename = () => {
    if (editingChatId && editingName.trim()) {
      const success = chatManager.renameChat(editingChatId, editingName.trim())
      if (success) {
        loadChats()
      }
    }
    setEditingChatId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingChatId(null)
    setEditingName('')
  }

  const handleClearAllChats = () => {
    const success = chatManager.clearAllChats()
    if (success) {
      loadChats()
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getAgentTheme = (agentId: string) => {
    const agent = getAgentById(agentId)
    return agent?.theme || {
      primary: '#6366F1',
      secondary: '#818CF8',
      accent: '#E0E7FF',
      gradient: 'from-indigo-600 to-purple-600'
    }
  }

  const getUniqueAgents = () => {
    const agentIds = [...new Set(chats.map(chat => chat.agentId))]
    return agentIds.map(id => getAgentById(id)).filter(Boolean) as AIAgent[]
  }

  const stats = chatManager.getChatStats()

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Chat History"
      subtitle={`${stats.totalChats} conversations • ${stats.totalMessages} messages`}
      icon={<History className="w-5 h-5" />}
              defaultWidth="min(88vw, 900px)"
      defaultHeight="700px"
      minWidth={600}
      minHeight={500}
      maxWidth="98vw"
      maxHeight="95vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="chat-history-manager"
      zIndex={9500}
    >
      <div className="h-full flex flex-col overflow-hidden">

        {/* Filters and Search */}
        <div className="p-6 border-b border-primary bg-secondary">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats by name, agent, or content..."
                className="w-full pl-10 pr-4 py-3 bg-primary border border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-primary placeholder-secondary"
              />
            </div>

            {/* Agent Filter */}
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="px-4 py-3 bg-primary border border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-primary min-w-[200px]"
            >
              <option value="all">All Agents</option>
              {getUniqueAgents().map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.avatar} {agent.name}
                </option>
              ))}
            </select>

            {/* Clear All Button */}
            {chats.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm('all')}
                className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-6 scrollable">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                {chats.length === 0 ? 'No saved chats yet' : 'No chats found'}
              </h3>
              <p className="text-secondary">
                {chats.length === 0 
                  ? 'Start a conversation with an AI agent to save your first chat'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map(chat => {
                const agent = getAgentById(chat.agentId)
                const theme = getAgentTheme(chat.agentId)
                const isCurrentChat = chat.id === currentChatId
                const isEditing = editingChatId === chat.id

                return (
                  <div
                    key={chat.id}
                    className={`relative bg-primary rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      isCurrentChat
                        ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg'
                        : 'border-primary hover:border-secondary'
                    }`}
                  >
                    {/* Agent Theme Header */}
                    <div 
                      className={`h-3 rounded-t-xl bg-gradient-to-r ${theme.gradient}`}
                    />

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        
                        {/* Chat Info */}
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelectChat(chat)}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            {/* Agent Avatar */}
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
                              style={{ background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})` }}
                            >
                              <span className="text-white">{agent?.avatar || '🤖'}</span>
                            </div>
                            
                            {/* Chat Name */}
                            {isEditing ? (
                              <div className="flex-1 flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSaveRename()
                                    if (e.key === 'Escape') handleCancelRename()
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-primary rounded bg-secondary text-primary"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSaveRename}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCancelRename}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <h3 className="font-semibold text-primary text-lg leading-tight">
                                  {chat.name}
                                </h3>
                                <div className="flex items-center space-x-2 text-sm text-secondary mt-1">
                                  <User className="w-3 h-3" />
                                  <span>{chat.agentName}</span>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>{formatRelativeTime(chat.lastActivity)}</span>
                                  {chat.projectName && (
                                    <>
                                      <span>•</span>
                                      <span>{chat.projectName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Current Chat Indicator */}
                            {isCurrentChat && (
                              <div className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                                Current
                              </div>
                            )}
                          </div>

                          {/* Chat Preview */}
                          <div className="text-sm text-secondary line-clamp-2 ml-11">
                            {chat.messages.length > 1 
                              ? chat.messages.find(msg => msg.type === 'user')?.content?.substring(0, 120) + '...'
                              : 'New conversation'
                            }
                          </div>

                          {/* Chat Stats */}
                          <div className="flex items-center space-x-4 text-xs text-secondary mt-2 ml-11">
                            <span>{chat.messageCount} messages</span>
                            <span>Updated {formatRelativeTime(chat.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            onClick={() => handleRenameChat(chat.id, chat.name)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-secondary hover:text-primary"
                            title="Rename chat"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(chat.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-secondary hover:text-red-600"
                            title="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-primary bg-secondary">
          <div className="text-sm text-secondary">
            Showing {filteredChats.length} of {chats.length} chats
          </div>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Window */}
      {showDeleteConfirm && (
        <WindowFrame
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title={showDeleteConfirm === 'all' ? 'Clear All Chats' : 'Delete Chat'}
          subtitle="Confirmation Required"
          icon={<AlertTriangle className="w-4 h-4" />}
          defaultWidth="400px"
          defaultHeight="200px"
          minWidth={350}
          minHeight={180}
          maxWidth="500px"
          maxHeight="250px"
          resizable={false}
          minimizable={false}
          maximizable={false}
          windowId="delete-confirmation"
          zIndex={9400}
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {showDeleteConfirm === 'all' ? 'Clear All Chats?' : 'Delete Chat?'}
                </h3>
                <p className="text-sm text-secondary">
                  {showDeleteConfirm === 'all' 
                    ? 'This will permanently delete all saved chats. This action cannot be undone.'
                    : 'This will permanently delete this chat. This action cannot be undone.'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'all') {
                    handleClearAllChats()
                  } else {
                    handleDeleteChat(showDeleteConfirm)
                  }
                  setShowDeleteConfirm(null)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showDeleteConfirm === 'all' ? 'Clear All' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-secondary hover:bg-tertiary text-primary px-4 py-2 rounded-lg transition-colors border border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </WindowFrame>
      )}
    </WindowFrame>
  )
} 