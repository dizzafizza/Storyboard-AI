

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    let parsed = text
    
    // Handle bold text **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Handle italic text *text*
    parsed = parsed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    
    // Handle code `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code class="bg-tertiary px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Handle headings ## heading
    parsed = parsed.replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    parsed = parsed.replace(/^### (.*$)/gm, '<h3 class="text-md font-semibold mt-3 mb-2">$1</h3>')
    
    // Handle bullet points • item
    parsed = parsed.replace(/^• (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    
    // Wrap consecutive list items in <ul>
    parsed = parsed.replace(/(<li.*?<\/li>(?:\s*<li.*?<\/li>)*)/gs, '<ul class="space-y-1 my-2">$1</ul>')
    
    // Handle links [text](url)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>')
    
    // Handle line breaks
    parsed = parsed.replace(/\n\n/g, '</p><p class="mb-2">')
    parsed = `<p class="mb-2">${parsed}</p>`
    
    return parsed
  }

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
} 