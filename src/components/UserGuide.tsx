import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import WindowFrame from './WindowFrame'
import { 
  BookOpen, 
  X, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Paintbrush,
  Film,
  Settings,
  Folder,
  Lightbulb
} from 'lucide-react'

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  const { state } = useTheme()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const guideSection = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      content: [
        {
          title: 'Quick Start',
          tips: [
            'Click "New Project" in the sidebar to create your first storyboard',
            'Use project templates for common story types (film, commercial, etc.)',
            'Switch between Grid and Timeline views using the header buttons',
            'Double-click any panel to edit its content'
          ]
        }
      ]
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      icon: Sparkles,
      content: [
        {
          title: 'Story Generation',
          tips: [
            'Describe your story concept and let AI generate panel scripts',
            'Use specific genres and moods for better results',
            'Ask for revisions by describing what you want changed',
            'Generate multiple variations to compare options'
          ]
        },
        {
          title: 'Image Generation',
          tips: [
            'Be descriptive about visual style, lighting, and composition',
            'Specify camera angles (close-up, wide shot, bird\'s eye, etc.)',
            'Include artistic styles (photorealistic, cartoon, sketch, etc.)',
            'Mention specific details like time of day, weather, or mood'
          ]
        },
        {
          title: 'AI Settings',
          tips: [
            'Adjust image dimensions for your project needs',
            'Choose between different AI models for varied results',
            'Set consistent style preferences for your entire project',
            'Use custom prompts to maintain visual consistency'
          ]
        }
      ]
    },
    {
      id: 'panel-editing',
      title: 'Panel Editing',
      icon: Paintbrush,
      content: [
        {
          title: 'Panel Content',
          tips: [
            'Write clear, concise scene descriptions',
            'Include dialogue, sound effects, and camera notes',
            'Use the visual notes section for specific shot details',
            'Add timing information for animated sequences'
          ]
        },
        {
          title: 'Organization',
          tips: [
            'Use meaningful panel titles for easy navigation',
            'Organize panels logically in sequence',
            'Use the timeline view to see story flow',
            'Drag and drop panels to reorder them'
          ]
        }
      ]
    },
    {
      id: 'video-prompts',
      title: 'Video Generation',
      icon: Film,
      content: [
        {
          title: 'Creating Video Prompts',
          tips: [
            'Generate detailed video prompts from your storyboard',
            'Include camera movements, transitions, and effects',
            'Specify duration and pacing for each shot',
            'Export prompts for use with video AI tools like Runway or Pika'
          ]
        }
      ]
    },
    {
      id: 'project-management',
      title: 'Project Management',
      icon: Folder,
      content: [
        {
          title: 'Saving & Loading',
          tips: [
            'Projects auto-save as you work',
            'Export projects as JSON files for backup',
            'Import existing projects to continue work',
            'Use descriptive project names and descriptions'
          ]
        }
      ]
    },
    {
      id: 'customization',
      title: 'Customization',
      icon: Settings,
      content: [
        {
          title: 'Themes & Display',
          tips: [
            'Choose from multiple color themes in settings',
            'Themes apply consistently across all interfaces',
            'Dark mode reduces eye strain during long sessions',
            'Colored themes can match your project\'s mood'
          ]
        },
        {
          title: 'Views & Layout',
          tips: [
            'Grid view: Best for detailed panel editing',
            'Timeline view: Perfect for story flow and sequencing',
            'Resize panels by dragging corners',
            'Use full-screen mode for focused work'
          ]
        }
      ]
    }
  ]

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Storyboard AI User Guide"
      subtitle="Learn how to create amazing storyboards"
      icon={<BookOpen className="w-5 h-5" />}
              defaultWidth="min(92vw, 900px)"
      defaultHeight="min(85vh, 700px)"
      maxWidth="98vw"
      maxHeight="95vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="user-guide"
      zIndex={9100}
    >
      {/* Guide Content */}
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen 
              className="h-6 w-6"
              style={{ color: state.theme.colors.primary[600] }}
            />
            <h2 
              className="text-xl font-semibold"
              style={{ color: state.theme.colors.text.primary }}
            >
              Welcome to Storyboard AI
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            {guideSection.map((section) => {
              const Icon = section.icon
              const isExpanded = expandedSections.has(section.id)
              
              return (
                <div
                  key={section.id}
                  className="border rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: state.theme.colors.background.secondary,
                    borderColor: state.theme.colors.border.primary,
                  }}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors"
                    style={{
                      color: state.theme.colors.text.primary,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = state.theme.colors.background.tertiary
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        className="h-5 w-5"
                        style={{ color: state.theme.colors.primary[600] }}
                      />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {section.content.map((subsection, subIndex) => (
                        <div key={subIndex} className="mb-4 last:mb-0">
                          <h4 
                            className="font-medium mb-2"
                            style={{ color: state.theme.colors.text.primary }}
                          >
                            {subsection.title}
                          </h4>
                          <ul className="space-y-2">
                            {subsection.tips.map((tip, tipIndex) => (
                              <li 
                                key={tipIndex}
                                className="flex items-start space-x-2 text-sm"
                                style={{ color: state.theme.colors.text.secondary }}
                              >
                                <span 
                                  className="block w-1 h-1 rounded-full mt-2 flex-shrink-0"
                                  style={{ backgroundColor: state.theme.colors.primary[500] }}
                                />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Quick Tips Section */}
            <div
              className="border rounded-lg p-4 mt-6"
              style={{
                backgroundColor: state.theme.colors.primary[50],
                borderColor: state.theme.colors.primary[200],
              }}
            >
              <h3 
                className="font-semibold mb-3 flex items-center space-x-2"
                style={{ color: state.theme.colors.primary[800] }}
              >
                <Lightbulb className="h-5 w-5" />
                <span>Pro Tips</span>
              </h3>
              <ul className="space-y-2 text-sm">
                <li style={{ color: state.theme.colors.primary[700] }}>
                  • Use keyboard shortcuts: Ctrl/Cmd + N for new panel, Ctrl/Cmd + S to save
                </li>
                <li style={{ color: state.theme.colors.primary[700] }}>
                  • Right-click panels for quick actions like duplicate, delete, or move
                </li>
                <li style={{ color: state.theme.colors.primary[700] }}>
                  • Keep AI prompts specific but not overly detailed for best results
                </li>
                <li style={{ color: state.theme.colors.primary[700] }}>
                  • Use the timeline view to spot pacing issues in your story
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
}

export default UserGuide 