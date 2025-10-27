# WebSim MCP Server

A comprehensive Model Context Protocol (MCP) server for interacting with WebSim's public API. This server provides access to WebSim's ecosystem of projects, users, feeds, assets, and comments through standardized MCP tools.

## 🌟 Features

### Project Management
- **Get projects by ID or slug** - Retrieve specific WebSim projects
- **List all public projects** - Browse the complete public project catalog
- **List user projects** - Access projects created by specific users
- **Project revisions** - View historical versions of projects
- **Project statistics** - Get detailed analytics for projects
- **Project descendants** - Find projects that are based on or derived from others

### User Management
- **User profiles** - Retrieve comprehensive user information
- **User statistics** - Get user activity and engagement metrics
- **User search** - Find users by username or other criteria
- **Social connections** - Access user's following and follower lists

### Feed & Discovery
- **Trending feed** - Discover popular and trending content
- **Latest posts** - Get the most recent activity
- **Feed search** - Search content with sorting options (trending, newest, popular)
- **Trending rooms** - Find popular interactive rooms and experiences

### Assets & Search
- **Asset search** - Find specific assets and resources
- **Bulk asset search** - Search multiple queries simultaneously
- **Relevant asset discovery** - Find assets related to your interests
- **Related keywords** - Get keyword suggestions for searches
- **Top searches** - See what others are searching for
- **Project assets** - Access assets within specific projects

### Comments & Interaction
- **Project comments** - Read community discussions on projects
- **Comment replies** - View threaded conversations and replies

### System Features
- **Health monitoring** - Built-in health checks for API connectivity
- **Error handling** - Comprehensive error recovery and reporting
- **Pagination support** - Efficient data retrieval with limit/offset
- **Input validation** - Robust parameter validation using Zod schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone or download the server:**
   ```bash
   # If using from source
   git clone https://github.com/minimax/websim-mcp-server.git
   cd websim-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

### Usage with MCP Clients

#### Smithery Platform
The server is configured for direct deployment on Smithery. See the `smithery.json` file for deployment configuration.

#### Claude Desktop
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "websim": {
      "command": "node",
      "args": ["/path/to/websim-mcp-server/server.js"],
      "env": {}
    }
  }
}
```

#### Generic MCP Setup
Use the provided `mcp.json` configuration file:

```bash
# Copy mcp.json to your MCP configuration directory
cp mcp.json ~/.config/claude/mcp-servers/websim.json
```

## 📋 Available Tools

### Project Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_project_by_id` | Get project by ID | `project_id: string` |
| `get_project_by_slug` | Get project by user/slug | `user: string, slug: string` |
| `list_all_projects` | List all public projects | `limit?: number, offset?: number` |
| `list_user_projects` | List projects for user | `user: string, limit?: number, offset?: number` |
| `get_project_revisions` | Get project versions | `project_id: string, limit?: number, offset?: number` |
| `get_project_stats` | Get project statistics | `project_id: string` |
| `get_project_descendants` | Get related projects | `project_id: string, limit?: number, offset?: number` |

### User Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_user` | Get user profile | `user: string` |
| `get_user_stats` | Get user statistics | `user: string` |
| `search_users` | Search users | `query: string, limit?: number, offset?: number` |
| `get_user_following` | Get user's follows | `user: string, limit?: number, offset?: number` |
| `get_user_followers` | Get user's followers | `user: string, limit?: number, offset?: number` |

### Feed & Discovery

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_trending_feed` | Get trending projects | `limit?: number, offset?: number` |
| `get_posts_feed` | Get latest posts | `limit?: number, offset?: number` |
| `search_feed` | Search feed with sorting | `sort: string, search: string, limit?: number, offset?: number` |
| `get_trending_rooms` | Get trending rooms | `limit?: number, offset?: number` |

### Assets & Search

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_assets` | Search for assets | `query: string, limit?: number, offset?: number` |
| `bulk_asset_search` | Search multiple queries | `assets: Array<{query: string, limit?: number}>` |
| `search_relevant_assets` | Find relevant assets | `query: string, limit?: number` |
| `get_related_keywords` | Get keyword suggestions | `query: string, limit?: number` |
| `get_top_searches` | Get top searches | `limit?: number, offset?: number` |
| `get_project_assets` | Get project assets | `project_id: string, version?: string` |

### Comments

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_project_comments` | Get project comments | `project_id: string, limit?: number, offset?: number` |
| `get_comment_replies` | Get comment replies | `project_id: string, comment_id: string, limit?: number, offset?: number` |

### System

| Tool | Description | Parameters |
|------|-------------|------------|
| `health_check` | Check API connectivity | None |

## 💡 Usage Examples

### Example 1: Getting a Popular Project
```javascript
// Tool call example
{
  "tool": "get_project_by_id",
  "arguments": {
    "project_id": "abc123xyz789"
  }
}
```

### Example 2: Browsing Trending Content
```javascript
// Tool call example
{
  "tool": "get_trending_feed",
  "arguments": {
    "limit": 10,
    "offset": 0
  }
}
```

### Example 3: Searching for Developers
```javascript
// Tool call example
{
  "tool": "search_users",
  "arguments": {
    "query": "developer",
    "limit": 20,
    "offset": 0
  }
}
```

### Example 4: Finding Assets
```javascript
// Tool call example
{
  "tool": "search_assets",
  "arguments": {
    "query": "game sprites",
    "limit": 15
  }
}
```

### Example 5: Bulk Asset Search
```javascript
// Tool call example
{
  "tool": "bulk_asset_search",
  "arguments": {
    "assets": [
      { "query": "game UI", "limit": 5 },
      { "query": "character sprites", "limit": 5 },
      { "query": "sound effects", "limit": 5 }
    ]
  }
}
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# WebSim API Configuration
WEBSIM_API_BASE_URL=https://api.websim.com
WEBSIM_API_TIMEOUT=30000

# Server Configuration
MCP_SERVER_NAME=websim-mcp-server
MCP_SERVER_VERSION=1.0.0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Custom API Base URL

If WebSim provides a different API endpoint, update the configuration:

```javascript
// In server.js, modify the WEBSIM_API_BASE constant
const WEBSIM_API_BASE = 'https://your-custom-api-endpoint.com';
```

## 🏥 Health Monitoring

The server includes a built-in health check system:

```javascript
// Health check tool call
{
  "tool": "health_check",
  "arguments": {}
}
```

This checks:
- WebSim API connectivity
- Response time
- Error rate monitoring

## 🔒 Security & Privacy

- **No Authentication Required**: Uses WebSim's public API endpoints
- **No Data Storage**: Server doesn't store any user data
- **HTTPS Only**: All API calls use secure connections
- **Input Validation**: All parameters are validated before API calls

## 🐛 Error Handling

The server provides comprehensive error handling:

- **Network timeouts**: Configurable request timeouts
- **API errors**: Forwarded error messages with context
- **Validation errors**: Clear parameter validation feedback
- **Recovery mechanisms**: Automatic retry logic where appropriate

### Common Error Responses

```json
{
  "success": false,
  "error": "Project not found",
  "timestamp": "2025-10-28T01:41:35.000Z"
}
```

## 📊 Rate Limiting & Performance

- **Built-in timeouts**: Prevents hanging requests
- **Pagination support**: Efficient data retrieval
- **Error recovery**: Graceful handling of API limits
- **Connection pooling**: Optimized API call handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 API Reference

This MCP server wraps the WebSim public API. For detailed API documentation, visit:
- API Base: https://api.websim.com
- Documentation: https://api.websim.com/docs

### Supported Endpoints

- `GET /api/v1/projects` - Project listing
- `GET /api/v1/projects/{id}` - Project details
- `GET /api/v1/users/{user}` - User profiles
- `GET /api/v1/feed/trending` - Trending content
- `GET /api/v1/search/assets` - Asset search
- And many more...

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP standard
- [WebSim](https://websim.com) for the public API
- [Smithery](https://smithery.ai) for MCP hosting platform

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [Create an issue](https://github.com/minimax/websim-mcp-server/issues)
- Documentation: [WebSim API Docs](https://api.websim.com/docs)

---

**Built with ❤️ by MiniMax Agent**