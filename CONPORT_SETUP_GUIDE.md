# ConPort Setup Guide for Storyboard AI
Complete installation and configuration guide for ConPort MCP server integration

## Overview

ConPort (Context Portal) is an MCP (Model Context Protocol) server that provides structured knowledge management, semantic search, and RAG capabilities for AI-assisted development. This guide covers installation, configuration, and integration with the Storyboard AI project.

## Prerequisites

### System Requirements
- **Python 3.8+** (for ConPort MCP server)
- **Node.js 18+** (for React TypeScript development)
- **Git** (for version control)
- **SQLite** (usually pre-installed on macOS/Linux)

### Verify Prerequisites
```bash
# Check Python version (should be 3.8+)
python3 --version

# Check Node.js version (should be 18+)
node --version

# Check if SQLite is available
sqlite3 --version
```

## ConPort Installation

### Option 1: Install from GitHub (Recommended)
```bash
# Clone ConPort repository
cd ~/
git clone https://github.com/GreatScottyMac/context-portal.git
cd context-portal

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -m context_portal --help
```

### Option 2: Install via pip (if available)
```bash
# Install ConPort (when available on PyPI)
pip install context-portal

# Or install development version
pip install git+https://github.com/GreatScottyMac/context-portal.git
```

## Cursor IDE MCP Configuration

### 1. Locate MCP Configuration File
The MCP configuration is typically located at:
- **macOS**: `~/.cursor/mcp.json`
- **Linux**: `~/.cursor/mcp.json`
- **Windows**: `%APPDATA%\cursor\mcp.json`

### 2. Update mcp.json Configuration
```json
{
  "mcpServers": {
    "conport": {
      "command": "python3",
      "args": [
        "-m", "context_portal",
        "--workspace-id", "/Users/jamisonstevens/Documents/Storyboard AI"
      ],
      "env": {
        "PYTHONPATH": "/path/to/context-portal",
        "CONPORT_LOG_LEVEL": "INFO",
        "CONPORT_DB_PATH": ".conport/context.db",
        "CONPORT_VECTOR_STORE": "chromadb",
        "CONPORT_EMBEDDINGS_MODEL": "sentence-transformers/all-MiniLM-L6-v2"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "src"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key-here"
      }
    }
  }
}
```

### 3. Alternative HTTP Configuration
If you prefer to run ConPort as an HTTP server:

```json
{
  "mcpServers": {
    "conport": {
      "transport": {
        "type": "http",
        "url": "http://localhost:8000/mcp"
      }
    }
  }
}
```

## ConPort Server Startup

### Method 1: Direct Command Line
```bash
# Navigate to your project workspace
cd "/Users/jamisonstevens/Documents/Storyboard AI"

# Start ConPort in STDIO mode (for MCP)
python3 -m context_portal \
  --mode stdio \
  --workspace-id "$(pwd)" \
  --db-path .conport/context.db \
  --log-level INFO
```

### Method 2: HTTP Server Mode
```bash
# Start ConPort as HTTP server
python3 -m context_portal \
  --mode http \
  --host localhost \
  --port 8000 \
  --workspace-id "$(pwd)" \
  --db-path .conport/context.db \
  --log-level INFO
```

### Method 3: Background Service (Recommended)
```bash
# Create startup script
cat > start-conport.sh << 'EOF'
#!/bin/bash
cd "/Users/jamisonstevens/Documents/Storyboard AI"
source ~/context-portal/venv/bin/activate
python3 -m context_portal \
  --mode stdio \
  --workspace-id "$(pwd)" \
  --db-path .conport/context.db \
  --log-level INFO
EOF

chmod +x start-conport.sh

# Run in background
nohup ./start-conport.sh > conport.log 2>&1 &
```

## Initial Project Setup

### 1. Initialize ConPort Database
The database will be automatically created when ConPort starts, but you can pre-seed it:

```bash
# Run the initialization script
python3 scripts/initialize-conport.py

# Verify database creation
ls -la .conport/
```

### 2. Import Project Brief (Automatic)
ConPort will automatically detect and offer to import `projectBrief.md` when it starts. This provides initial context about the Storyboard AI project.

### 3. Seed Knowledge Base
```bash
# Run comprehensive codebase analysis
python3 scripts/advanced-codebase-indexer.py

# The analysis will generate knowledge entities for ConPort
# Results will be saved to analysis_output/
```

## Cursor IDE Integration

### 1. Restart Cursor IDE
After updating the MCP configuration, restart Cursor IDE to load ConPort integration.

### 2. Verify MCP Connection
1. Open Cursor IDE
2. Create a new chat or use an existing one
3. Type a message like "Check ConPort connection"
4. The AI should be able to access ConPort tools

### 3. Test ConPort Functionality
Try these commands in Cursor to test ConPort:

- "Query ConPort for architectural decisions"
- "Show me the project context from ConPort"  
- "Search ConPort for React patterns"
- "Add a new decision to ConPort about component architecture"

## ConPort Tools Available

### Core Information Management
- `get_product_context` - Retrieve project overview and goals
- `update_product_context` - Update project information
- `get_active_context` - Get current work focus and recent changes
- `update_active_context` - Update current work status

### Decision Management
- `log_decision` - Record architectural or technical decisions
- `get_decisions` - Retrieve logged decisions with filtering
- `update_decision` - Modify existing decisions

### Progress Tracking
- `log_progress` - Record progress on tasks or features
- `get_progress` - Retrieve progress entries
- `update_progress` - Modify progress entries

### Pattern Management  
- `log_system_pattern` - Document reusable code patterns
- `get_system_patterns` - Retrieve documented patterns
- `search_system_patterns` - Search patterns by keywords

### Knowledge Graph
- `link_conport_items` - Create relationships between entities
- `get_linked_items` - Find related items through relationships
- `semantic_search_conport` - Semantic search across all content

### Custom Data
- `store_custom_data` - Store domain-specific information
- `get_custom_data` - Retrieve custom data entries
- `search_custom_data` - Search custom data

## Daily Development Workflow

### 1. Morning Startup
```bash
# Start ConPort server
./start-conport.sh

# Open Cursor IDE
# ConPort will automatically connect via MCP
```

### 2. Before Coding Session
In Cursor, ask:
- "What's the current active context?"
- "Show recent architectural decisions"
- "Search for patterns related to [feature/component]"

### 3. During Development
- Log decisions as you make them
- Document new patterns you discover
- Update progress on current tasks
- Link related components and concepts

### 4. End of Session
- Update active context with current status
- Log any lessons learned
- Update progress entries

## Troubleshooting

### ConPort Won't Start
1. **Check Python version**: Ensure Python 3.8+
2. **Verify dependencies**: Run `pip install -r requirements.txt`
3. **Check workspace path**: Ensure the workspace ID is correct
4. **Review logs**: Check `conport.log` for error messages

### Cursor Can't Connect to ConPort
1. **Verify MCP config**: Check `~/.cursor/mcp.json` syntax
2. **Restart Cursor**: Completely close and reopen Cursor IDE
3. **Check ConPort process**: Ensure ConPort is running
4. **Review paths**: Verify Python and ConPort paths in config

### Database Issues
1. **Check permissions**: Ensure write access to `.conport/` directory
2. **Reset database**: Delete `.conport/context.db` to start fresh
3. **Check SQLite**: Verify SQLite is installed and working

### Performance Issues
1. **Monitor query times**: Use `CONPORT_LOG_LEVEL=DEBUG` for detailed logs
2. **Check database size**: Large databases may need optimization
3. **Vector store health**: Ensure ChromaDB is functioning properly

## Advanced Configuration

### Custom Embeddings Model
```bash
# Use a different embeddings model
export CONPORT_EMBEDDINGS_MODEL="sentence-transformers/paraphrase-MiniLM-L6-v2"
```

### Database Optimization
```bash
# Vacuum database for better performance
sqlite3 .conport/context.db "VACUUM;"

# Analyze database for query optimization
sqlite3 .conport/context.db "ANALYZE;"
```

### Logging Configuration
```bash
# Enable debug logging
export CONPORT_LOG_LEVEL=DEBUG

# Custom log file
export CONPORT_LOG_FILE=conport-debug.log
```

## Security Considerations

### Data Privacy
- ConPort stores data locally in SQLite database
- No data is sent to external services (except for embeddings generation)
- All project knowledge remains under your control

### API Key Management
- Store API keys in environment variables, not in code
- Use `.env` files for local development
- Rotate keys regularly

### Database Security
- Restrict file permissions on `.conport/` directory
- Consider encryption for sensitive projects
- Regular backups of knowledge base

## Maintenance

### Regular Tasks
1. **Weekly database vacuum** for performance
2. **Monthly backup** of `.conport/` directory  
3. **Quarterly review** of stored knowledge for accuracy
4. **Update ConPort** when new versions are available

### Backup Strategy
```bash
# Create backup script
cat > backup-conport.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp -r .conport/ .conport_backup_${DATE}/
echo "ConPort backup created: .conport_backup_${DATE}/"
EOF

chmod +x backup-conport.sh
```

### Updates
```bash
# Update ConPort to latest version
cd ~/context-portal
git pull origin main
pip install -r requirements.txt --upgrade
```

## Getting Help

### Documentation
- [ConPort GitHub Repository](https://github.com/GreatScottyMac/context-portal)
- [MCP Documentation](https://modelcontextprotocol.io/)
- Project-specific documentation in this repository

### Common Issues
- Check the `dev.log` file for application-specific issues
- Review `conport.log` for ConPort server issues
- Use Cursor's developer tools for MCP connection debugging

### Community Support
- GitHub Issues for ConPort-specific problems
- Cursor community for IDE integration questions
- Project-specific issues in this repository

This setup guide provides comprehensive instructions for integrating ConPort with your Storyboard AI development environment. Follow the steps in order for optimal results. 