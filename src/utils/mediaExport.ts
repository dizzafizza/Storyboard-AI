import type { StoryboardProject, StoryboardPanel } from '../types'
import { storage } from './storage'

export interface ExportOptions {
  format: 'json' | 'pdf' | 'images' | 'video-sequence' | 'html'
  quality?: 'standard' | 'high' | 'ultra'
  includeImages?: boolean
  includeVideos?: boolean
  includePrompts?: boolean
  includeNotes?: boolean
  pageSize?: 'A4' | 'letter' | 'legal' | 'A3'
  orientation?: 'portrait' | 'landscape'
  compression?: boolean
}

export interface ExportProgress {
  stage: string
  progress: number
  total: number
  currentItem?: string
  errors?: string[]
}

export class MediaExportService {
  private static instance: MediaExportService
  private progressCallback?: (progress: ExportProgress) => void

  static getInstance(): MediaExportService {
    if (!MediaExportService.instance) {
      MediaExportService.instance = new MediaExportService()
    }
    return MediaExportService.instance
  }

  setProgressCallback(callback: (progress: ExportProgress) => void) {
    this.progressCallback = callback
  }

  private updateProgress(stage: string, progress: number, total: number, currentItem?: string, errors?: string[]) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, total, currentItem, errors })
    }
  }

  async exportProject(project: StoryboardProject, options: ExportOptions): Promise<Blob | string> {
    const settings = storage.getSettings()
    const exportOptions = {
      ...options,
      quality: options.quality || settings.videoQuality || 'high'
    }

    switch (exportOptions.format) {
      case 'json':
        return this.exportAsJSON(project, exportOptions)
      case 'pdf':
        return this.exportAsPDF(project, exportOptions)
      case 'images':
        return this.exportAsImageBundle(project, exportOptions)
      case 'video-sequence':
        return this.exportAsVideoSequence(project, exportOptions)
      case 'html':
        return this.exportAsHTML(project, exportOptions)
      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`)
    }
  }

  private async exportAsJSON(project: StoryboardProject, options: ExportOptions): Promise<Blob> {
    this.updateProgress('Preparing JSON export', 0, 3)
    
    // Restore images from storage if needed
    const restoredProject = {
      ...project,
      panels: await Promise.all(
        project.panels.map(async (panel) => {
          let imageUrl = panel.imageUrl
          
          // If image is stored as reference, restore it
          if (panel.imageUrl && panel.imageUrl.startsWith('stored:')) {
            try {
              const imageId = panel.imageUrl.replace('stored:', '')
              const imageData = await storage.getImageFromDB(imageId)
              if (imageData) {
                imageUrl = imageData
                console.log(`📸 Restored image for export: ${imageId}`)
              } else {
                console.warn(`⚠️ Could not restore image: ${imageId}`)
                imageUrl = undefined
              }
            } catch (error) {
              console.warn('Error restoring image:', error)
              imageUrl = undefined
            }
          }
          
          return {
            ...panel,
            imageUrl: options.includeImages !== false ? imageUrl : undefined,
            // Ensure both videoPrompt and aiGeneratedPrompt are included for compatibility
            videoPrompt: panel.videoPrompt || panel.aiGeneratedPrompt,
            aiGeneratedPrompt: panel.aiGeneratedPrompt || panel.videoPrompt
          }
        })
      )
    }
    
    this.updateProgress('Creating export data', 1, 3)
    
    const exportData = {
      project: restoredProject,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Storyboard AI',
        version: '1.0.0',
        options: {
          includeImages: options.includeImages !== false,
          includeVideos: options.includeVideos !== false,
          includePrompts: options.includePrompts !== false,
          includeNotes: options.includeNotes !== false
        }
      },
      settings: (() => {
        const settings = storage.getSettings()
        // Remove sensitive data
        if (settings.openaiApiKey) {
          settings.openaiApiKey = '[REMOVED_FOR_SECURITY]'
        }
        return settings
      })()
    }

    this.updateProgress('Finalizing JSON export', 2, 3)
    
    const jsonString = JSON.stringify(exportData, null, 2)
    
    this.updateProgress('JSON export complete', 3, 3)
    
    return new Blob([jsonString], { type: 'application/json' })
  }

  private async exportAsPDF(project: StoryboardProject, options: ExportOptions): Promise<Blob> {
    // Import jsPDF dynamically to avoid increasing bundle size
    const jsPDF = await import('jspdf').then(module => module.default)
    
    this.updateProgress('Initializing PDF export', 0, project.panels.length + 3)
    
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    
    // Title page
    doc.setFontSize(24)
    doc.text(project.title, margin, margin + 20)
    
    doc.setFontSize(12)
    if (project.description) {
      doc.text(project.description, margin, margin + 35)
    }
    
    doc.text(`Created: ${project.createdAt.toLocaleDateString()}`, margin, margin + 50)
    doc.text(`Updated: ${project.updatedAt.toLocaleDateString()}`, margin, margin + 60)
    doc.text(`Panels: ${project.panels.length}`, margin, margin + 70)

    if (project.directorNotes && options.includeNotes !== false) {
      doc.setFontSize(14)
      doc.text('Director Notes:', margin, margin + 90)
      doc.setFontSize(10)
      const splitNotes = doc.splitTextToSize(project.directorNotes, contentWidth)
      doc.text(splitNotes, margin, margin + 105)
    }

    this.updateProgress('Creating title page', 1, project.panels.length + 3)

    // Add panels
    for (let i = 0; i < project.panels.length; i++) {
      const panel = project.panels[i]
      
      this.updateProgress('Adding panels to PDF', i + 2, project.panels.length + 3, `Panel ${i + 1}: ${panel.title}`)
      
      doc.addPage()
      
      // Panel header
      doc.setFontSize(16)
      doc.text(`Panel ${i + 1}: ${panel.title}`, margin, margin + 15)
      
      let yPosition = margin + 35
      
      // Panel image
      if (panel.imageUrl && options.includeImages !== false) {
        try {
          let imageUrl = panel.imageUrl
          
          // If image is stored as reference, restore it
          if (panel.imageUrl.startsWith('stored:')) {
            const imageId = panel.imageUrl.replace('stored:', '')
            const imageData = await storage.getImageFromDB(imageId)
            if (imageData) {
              imageUrl = imageData
              console.log(`📸 Restored image for PDF: ${imageId}`)
            } else {
              throw new Error(`Could not restore image: ${imageId}`)
            }
          }
          
          // Create a canvas to resize the image with high quality
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Increase max dimensions for better quality
              const maxWidth = contentWidth * 0.9
              const maxHeight = options.quality === 'ultra' ? 300 : options.quality === 'high' ? 200 : 150
              
              let { width, height } = img
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width *= ratio
              height *= ratio
              
              canvas.width = width
              canvas.height = height
              
              // Use better image rendering
              if (ctx) {
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                ctx.drawImage(img, 0, 0, width, height)
              }
              
              // Use PNG for lossless quality or high-quality JPEG
              const imageFormat = options.quality === 'ultra' ? 'image/png' : 'image/jpeg'
              const jpegQuality = options.quality === 'ultra' ? 1.0 : options.quality === 'high' ? 0.95 : 0.85
              const imageData = ctx!.canvas.toDataURL(imageFormat, jpegQuality)
              
              const format = imageFormat === 'image/png' ? 'PNG' : 'JPEG'
              doc.addImage(imageData, format, margin, yPosition, width * 0.8, height * 0.8)
              yPosition += height * 0.8 + 10
              resolve(null)
            }
            img.onerror = reject
            img.src = imageUrl
          })
        } catch (error) {
          console.warn(`Failed to add image for panel ${i + 1}:`, error)
        }
      }
      
      // Panel details
      doc.setFontSize(12)
      doc.text('Description:', margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(10)
      const splitDescription = doc.splitTextToSize(panel.description, contentWidth)
      doc.text(splitDescription, margin, yPosition)
      yPosition += splitDescription.length * 5 + 10
      
      // Technical details
      doc.setFontSize(10)
      doc.text(`Shot Type: ${panel.shotType}`, margin, yPosition)
      doc.text(`Camera Angle: ${panel.cameraAngle}`, margin + contentWidth/2, yPosition)
      yPosition += 7
      
      doc.text(`Duration: ${panel.duration}s`, margin, yPosition)
      yPosition += 10
      
      // Notes
      if (panel.notes && options.includeNotes !== false) {
        doc.setFontSize(11)
        doc.text('Notes:', margin, yPosition)
        yPosition += 7
        
        doc.setFontSize(9)
        const splitNotes = doc.splitTextToSize(panel.notes, contentWidth)
        doc.text(splitNotes, margin, yPosition)
        yPosition += splitNotes.length * 4 + 10
      }
      
      // Video prompt (check both fields for compatibility)
      const videoPrompt = panel.videoPrompt || panel.aiGeneratedPrompt
      if (videoPrompt && options.includePrompts !== false) {
        doc.setFontSize(11)
        doc.text('Video Prompt:', margin, yPosition)
        yPosition += 7
        
        doc.setFontSize(9)
        const splitPrompt = doc.splitTextToSize(videoPrompt, contentWidth)
        doc.text(splitPrompt, margin, yPosition)
      }
    }

    this.updateProgress('Finalizing PDF', project.panels.length + 2, project.panels.length + 3)

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
      doc.text(`${project.title} - Storyboard AI`, margin, pageHeight - 10)
    }

    this.updateProgress('PDF export complete', project.panels.length + 3, project.panels.length + 3)

    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  private async exportAsImageBundle(project: StoryboardProject, options: ExportOptions): Promise<Blob> {
    // Import JSZip dynamically
    const JSZip = await import('jszip').then(module => module.default)
    
    this.updateProgress('Creating image bundle', 0, project.panels.length + 2)
    
    const zip = new JSZip()
    const imagesFolder = zip.folder('images')
    const errors: string[] = []
    
    // Add project info
    const projectInfo = {
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      totalPanels: project.panels.length,
      directorNotes: project.directorNotes
    }
    
    zip.file('project-info.json', JSON.stringify(projectInfo, null, 2))
    
    // Process each panel
    for (let i = 0; i < project.panels.length; i++) {
      const panel = project.panels[i]
      
      this.updateProgress('Processing images', i + 1, project.panels.length + 2, `Panel ${i + 1}: ${panel.title}`)
      
      if (panel.imageUrl) {
        try {
          let imageUrl = panel.imageUrl
          
          // If image is stored as reference, restore it
          if (panel.imageUrl.startsWith('stored:')) {
            const imageId = panel.imageUrl.replace('stored:', '')
            const imageData = await storage.getImageFromDB(imageId)
            if (imageData) {
              imageUrl = imageData
              console.log(`📸 Restored image for bundle: ${imageId}`)
            } else {
              throw new Error(`Could not restore image: ${imageId}`)
            }
          }
          
          // Convert image to blob
          let imageBlob: Blob
          if (imageUrl.startsWith('data:')) {
            // Handle base64 data URLs
            const response = await fetch(imageUrl)
            imageBlob = await response.blob()
          } else {
            // Handle regular URLs
            const response = await fetch(imageUrl)
            imageBlob = await response.blob()
          }
          
          const fileName = `panel_${String(i + 1).padStart(3, '0')}_${panel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
          imagesFolder?.file(fileName, imageBlob)
          
          // Add panel metadata
          const panelInfo = {
            order: i + 1,
            title: panel.title,
            description: panel.description,
            shotType: panel.shotType,
            cameraAngle: panel.cameraAngle,
            duration: panel.duration,
            notes: panel.notes,
            videoPrompt: panel.videoPrompt || panel.aiGeneratedPrompt,
            fileName: fileName
          }
          
          zip.file(`panel_${String(i + 1).padStart(3, '0')}_info.json`, JSON.stringify(panelInfo, null, 2))
          
        } catch (error) {
          const errorMsg = `Failed to export image for panel ${i + 1}: ${panel.title}`
          errors.push(errorMsg)
          console.warn(errorMsg, error)
        }
      }
    }
    
    // Add summary file
    const summary = {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Storyboard AI',
      project: projectInfo,
      totalImages: project.panels.filter(p => p.imageUrl).length,
      errors: errors.length > 0 ? errors : undefined
    }
    
    zip.file('export-summary.json', JSON.stringify(summary, null, 2))
    
    this.updateProgress('Compressing image bundle', project.panels.length + 2, project.panels.length + 2)
    
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: options.compression !== false ? 'DEFLATE' : 'STORE',
      compressionOptions: { level: options.quality === 'ultra' ? 9 : options.quality === 'high' ? 6 : 3 }
    })
    
    if (errors.length > 0) {
      this.updateProgress('Image bundle complete with errors', project.panels.length + 2, project.panels.length + 2, undefined, errors)
    }
    
    return zipBlob
  }

  private async exportAsVideoSequence(project: StoryboardProject, options: ExportOptions): Promise<Blob> {
    // Export video sequence data for use with video editing software
    this.updateProgress('Creating video sequence export', 0, 1)
    
    const videoData = {
      project: {
        title: project.title,
        description: project.description,
        totalDuration: project.panels.reduce((sum, panel) => sum + panel.duration, 0)
      },
      sequence: project.panels.map((panel, index) => ({
        order: index + 1,
        title: panel.title,
        description: panel.description,
        duration: panel.duration,
        shotType: panel.shotType,
        cameraAngle: panel.cameraAngle,
        notes: panel.notes,
        videoPrompt: panel.videoPrompt || panel.aiGeneratedPrompt,
        imageReference: panel.imageUrl ? `panel_${String(index + 1).padStart(3, '0')}.jpg` : null,
        timecode: {
          start: project.panels.slice(0, index).reduce((sum, p) => sum + p.duration, 0),
          end: project.panels.slice(0, index + 1).reduce((sum, p) => sum + p.duration, 0)
        }
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Storyboard AI',
        version: '1.0.0',
        format: 'video-sequence',
        settings: {
          quality: options.quality,
          includePrompts: options.includePrompts !== false
        }
      },
      directorNotes: project.directorNotes,
      videoStyle: project.videoStyle
    }
    
    this.updateProgress('Video sequence export complete', 1, 1)
    
    const jsonString = JSON.stringify(videoData, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  private async exportAsHTML(project: StoryboardProject, options: ExportOptions): Promise<string> {
    this.updateProgress('Creating HTML export', 0, 2)
    
    // Restore images from storage if needed
    const restoredPanels = await Promise.all(
      project.panels.map(async (panel) => {
        let imageUrl = panel.imageUrl
        
        // If image is stored as reference, restore it
        if (panel.imageUrl && panel.imageUrl.startsWith('stored:')) {
          try {
            const imageId = panel.imageUrl.replace('stored:', '')
            const imageData = await storage.getImageFromDB(imageId)
            if (imageData) {
              imageUrl = imageData
              console.log(`📸 Restored image for HTML: ${imageId}`)
            } else {
              console.warn(`⚠️ Could not restore image: ${imageId}`)
              imageUrl = undefined
            }
          } catch (error) {
            console.warn('Error restoring image:', error)
            imageUrl = undefined
          }
        }
        
        return { ...panel, imageUrl }
      })
    )
    
    this.updateProgress('Generating HTML content', 1, 2)
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - Storyboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .project-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .project-description {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 20px;
        }
        .project-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            font-size: 0.9rem;
            color: #777;
        }
        .director-notes {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
        }
        .panels {
            display: grid;
            gap: 30px;
        }
        .panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .panel-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        .panel-number {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        .panel-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .panel-content {
            padding: 20px;
        }
        .panel-image {
            width: 100%;
            max-width: 600px;
            height: auto;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .panel-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .detail-item {
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 6px;
            border-left: 3px solid #3498db;
        }
        .detail-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .detail-value {
            font-weight: 600;
            color: #2c3e50;
        }
        .panel-description {
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: 15px;
        }
        .panel-notes {
            background: #fff3cd;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #ffc107;
            margin-bottom: 15px;
        }
        .panel-prompt {
            background: #d1ecf1;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #17a2b8;
            font-family: monospace;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        .export-info {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin-top: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
        }
        @media print {
            body { background: white; }
            .panel { break-inside: avoid; margin-bottom: 30px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="project-title">${project.title}</h1>
        ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
        <div class="project-meta">
            <div><strong>Created:</strong> ${project.createdAt.toLocaleDateString()}</div>
            <div><strong>Updated:</strong> ${project.updatedAt.toLocaleDateString()}</div>
            <div><strong>Total Panels:</strong> ${restoredPanels.length}</div>
            <div><strong>Total Duration:</strong> ${restoredPanels.reduce((sum, p) => sum + p.duration, 0)}s</div>
        </div>
        ${project.directorNotes && options.includeNotes !== false ? `
        <div class="director-notes">
            <h3>Director's Notes</h3>
            <p>${project.directorNotes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
    </div>

    <div class="panels">
        ${restoredPanels.map((panel, index) => `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-number">Panel ${index + 1}</div>
                <div class="panel-title">${panel.title}</div>
            </div>
            <div class="panel-content">
                ${panel.imageUrl && options.includeImages !== false ? `
                <img src="${panel.imageUrl}" alt="${panel.title}" class="panel-image">
                ` : ''}
                
                <div class="panel-description">${panel.description}</div>
                
                <div class="panel-details">
                    <div class="detail-item">
                        <div class="detail-label">Shot Type</div>
                        <div class="detail-value">${panel.shotType}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Camera Angle</div>
                        <div class="detail-value">${panel.cameraAngle}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Duration</div>
                        <div class="detail-value">${panel.duration}s</div>
                    </div>
                </div>
                
                ${panel.notes && options.includeNotes !== false ? `
                <div class="panel-notes">
                    <strong>Notes:</strong><br>
                    ${panel.notes.replace(/\n/g, '<br>')}
                </div>
                ` : ''}
                
                ${(panel.videoPrompt || panel.aiGeneratedPrompt) && options.includePrompts !== false ? `
                <div class="panel-prompt">
                    <strong>Video Prompt:</strong><br>
                    ${(panel.videoPrompt || panel.aiGeneratedPrompt || '').replace(/\n/g, '<br>')}
                </div>
                ` : ''}
            </div>
        </div>
        `).join('')}
    </div>

    <div class="export-info">
        Exported from Storyboard AI on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>
    `.trim()
    
    this.updateProgress('HTML export complete', 2, 2)
    
    return html
  }

  async downloadExport(project: StoryboardProject, options: ExportOptions): Promise<void> {
    try {
      const result = await this.exportProject(project, options)
      
      let filename: string
      let mimeType: string
      let content: Blob | string
      
      switch (options.format) {
        case 'json':
          filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`
          mimeType = 'application/json'
          content = result as Blob
          break
        case 'pdf':
          filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_storyboard.pdf`
          mimeType = 'application/pdf'
          content = result as Blob
          break
        case 'images':
          filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_images.zip`
          mimeType = 'application/zip'
          content = result as Blob
          break
        case 'video-sequence':
          filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_video_sequence.json`
          mimeType = 'application/json'
          content = result as Blob
          break
        case 'html':
          filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_storyboard.html`
          mimeType = 'text/html'
          content = new Blob([result as string], { type: mimeType })
          break
        default:
          throw new Error(`Unsupported download format: ${options.format}`)
      }
      
      // Create download link
      const url = content instanceof Blob ? URL.createObjectURL(content) : `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      if (content instanceof Blob) {
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }
}

export const mediaExport = MediaExportService.getInstance()