import { useState } from 'react'
import { X, Film, Users, Zap, Heart } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import WindowFrame from './WindowFrame'
import type { StoryboardProject } from '../types'

interface ProjectTemplatesProps {
  isOpen: boolean
  onClose: () => void
}

const templates: Array<{
  id: string
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  project: StoryboardProject
}> = [
  {
    id: 'dialogue-scene',
    title: 'Dialogue Scene',
    description: 'Two-person conversation template',
    icon: <Users className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    project: {
      id: 'dialogue-template',
      title: 'Dialogue Scene Template',
      description: 'Template for filming a conversation between two characters',
      panels: [
        {
          id: 'dialogue-1',
          title: 'Establishing Shot',
          description: 'Wide shot showing both characters and their environment',
          shotType: 'wide-shot',
          cameraAngle: 'eye-level',
          notes: 'Set the scene and show relationship between characters',
          duration: 4,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dialogue-2',
          title: 'Character A Close-up',
          description: 'Close-up of first character speaking',
          shotType: 'close-up',
          cameraAngle: 'eye-level',
          notes: 'Focus on facial expressions and dialogue delivery',
          duration: 3,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dialogue-3',
          title: 'Character B Close-up',
          description: 'Close-up of second character responding',
          shotType: 'close-up',
          cameraAngle: 'eye-level',
          notes: 'Show reaction and response',
          duration: 3,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dialogue-4',
          title: 'Over Shoulder',
          description: 'Over shoulder shot showing both characters',
          shotType: 'over-the-shoulder',
          cameraAngle: 'eye-level',
          notes: 'Show interaction and maintain screen direction',
          duration: 4,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 'action-sequence',
    title: 'Action Sequence',
    description: 'High-energy action scene template',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    project: {
      id: 'action-template',
      title: 'Action Sequence Template',
      description: 'Template for filming fast-paced action scenes',
      panels: [
        {
          id: 'action-1',
          title: 'Wide Action Shot',
          description: 'Wide shot establishing the action space',
          shotType: 'wide-shot',
          cameraAngle: 'high-angle',
          notes: 'Show full scope of action, establish geography',
          duration: 2,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'action-2',
          title: 'Character in Motion',
          description: 'Medium shot of protagonist moving',
          shotType: 'medium-shot',
          cameraAngle: 'low-angle',
          notes: 'Dynamic movement, heroic angle',
          duration: 1,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'action-3',
          title: 'Impact Moment',
          description: 'Extreme close-up of impact or contact',
          shotType: 'extreme-close-up',
          cameraAngle: 'dutch-angle',
          notes: 'Quick cut, high impact moment',
          duration: 1,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'action-4',
          title: 'Reaction Shot',
          description: 'Close-up of character reaction',
          shotType: 'close-up',
          cameraAngle: 'eye-level',
          notes: 'Show emotional response to action',
          duration: 2,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 'romantic-scene',
    title: 'Romantic Scene',
    description: 'Intimate romantic moment template',
    icon: <Heart className="w-6 h-6" />,
    gradient: 'from-pink-500 to-rose-500',
    project: {
      id: 'romantic-template',
      title: 'Romantic Scene Template',
      description: 'Template for filming intimate romantic moments',
      panels: [
        {
          id: 'romantic-1',
          title: 'Setting the Mood',
          description: 'Establishing shot with romantic lighting',
          shotType: 'establishing-shot',
          cameraAngle: 'eye-level',
          notes: 'Soft lighting, romantic atmosphere',
          duration: 5,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'romantic-2',
          title: 'Two Shot',
          description: 'Medium shot of both characters together',
          shotType: 'two-shot',
          cameraAngle: 'eye-level',
          notes: 'Show connection between characters',
          duration: 4,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'romantic-3',
          title: 'Intimate Close-up',
          description: 'Close-up focusing on emotional connection',
          shotType: 'close-up',
          cameraAngle: 'eye-level',
          notes: 'Capture intimate emotions and expressions',
          duration: 3,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
]

export default function ProjectTemplates({ isOpen, onClose }: ProjectTemplatesProps) {
  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleSelectTemplate = (template: typeof templates[0]) => {
    if (confirm(`Load the "${template.title}" template? This will replace your current project.`)) {
      dispatch({
        type: 'SET_PROJECT',
        payload: {
          ...template.project,
          id: `template-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Project Templates"
      subtitle="Start with a pre-built storyboard template"
      icon={<Film className="w-5 h-5" />}
              defaultWidth="min(92vw, 1000px)"
      defaultHeight="min(85vh, 700px)"
      maxWidth="98vw"
      maxHeight="95vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="project-templates"
      zIndex={9100}
    >
      <div className="h-full overflow-y-auto">

        {/* Templates Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer"
                style={{
                  borderColor: selectedTemplate === template.id
                    ? themeState.theme.colors.primary[500]
                    : themeState.theme.colors.border.secondary,
                  backgroundColor: selectedTemplate === template.id
                    ? `${themeState.theme.colors.primary[50]}80`
                    : 'transparent'
                }}
                onMouseOver={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.borderColor = themeState.theme.colors.border.secondary
                  }
                }}
                onClick={() => setSelectedTemplate(template.id)}
              >
                {/* Template Header */}
                <div className={`bg-gradient-to-r ${template.gradient} p-4 text-white`}>
                  <div className="flex items-center space-x-3">
                    {template.icon}
                    <div>
                      <h3 className="font-semibold">{template.title}</h3>
                      <p className="text-sm opacity-90">{template.description}</p>
                    </div>
                  </div>
                </div>

                {/* Template Preview */}
                <div className="p-4">
                  <div 
                    className="text-sm mb-3"
                    style={{ color: themeState.theme.colors.text.secondary }}
                  >
                    {template.project.panels.length} panels • Total duration: {' '}
                    {template.project.panels.reduce((acc, panel) => acc + (panel.duration || 0), 0)}s
                  </div>
                  
                  <div className="space-y-2">
                    {template.project.panels.slice(0, 3).map((panel, index) => (
                      <div key={panel.id} className="flex items-center space-x-2 text-xs">
                        <div 
                          className="w-4 h-4 rounded flex items-center justify-center font-medium"
                          style={{ 
                            backgroundColor: themeState.theme.colors.background.tertiary,
                            color: themeState.theme.colors.text.secondary
                          }}
                        >
                          {index + 1}
                        </div>
                        <span 
                          className="truncate"
                          style={{ color: themeState.theme.colors.text.primary }}
                        >
                          {panel.title}
                        </span>
                      </div>
                    ))}
                    {template.project.panels.length > 3 && (
                      <div 
                        className="text-xs ml-6"
                        style={{ color: themeState.theme.colors.text.secondary }}
                      >
                        +{template.project.panels.length - 3} more panels
                      </div>
                    )}
                  </div>
                </div>

                {/* Use Template Button */}
                <div 
                  className="p-4 border-t"
                  style={{ borderColor: themeState.theme.colors.border.secondary }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTemplate(template)
                    }}
                    className="w-full btn-primary text-sm py-2"
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Template Option */}
          <div 
            className="mt-6 p-4 border-2 border-dashed rounded-lg text-center"
            style={{ borderColor: themeState.theme.colors.border.secondary }}
          >
            <Film 
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: themeState.theme.colors.text.secondary }}
            />
            <h3 
              className="font-medium mb-1"
              style={{ color: themeState.theme.colors.text.primary }}
            >
              Create Custom Template
            </h3>
            <p 
              className="text-sm mb-3"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              Start with a blank project and build your own storyboard from scratch
            </p>
            <button
              onClick={() => {
                dispatch({
                  type: 'SET_PROJECT',
                  payload: {
                    id: `custom-${Date.now()}`,
                    title: 'Custom Storyboard Project',
                    description: 'A custom storyboard project',
                    panels: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                })
                onClose()
              }}
              className="btn-secondary"
            >
              Start Blank Project
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
} 