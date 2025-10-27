# WebSim MCP Server

[![smithery badge](https://smithery.ai/badge/@gigachadtrey/websimm)](https://smithery.ai/insight/@gigachadtrey/websimm)

A production-ready Model Context Protocol (MCP) server for accessing WebSim API data. This server provides comprehensive access to WebSim project information, user profiles, trending content, and community features.

## 🌟 Features

### 📊 Project Discovery & Management
- **Get Project Details**: Retrieve comprehensive project information by ID or username/slug
- **Trending Projects**: Access popular and trending content with filtering options
- **Project Search**: Find projects by keywords, tags, or descriptions
- **Project Statistics**: View engagement metrics, fork counts, and activity data

### 👥 User Profile & Analytics
- **User Profiles**: Get detailed user information including bio, join date, and verification status
- **User Projects**: Browse projects created by specific users with sorting options
- **User Statistics**: Analyze user engagement metrics and community standing
- **Follower Analytics**: Track user growth and influence metrics

### 🎨 Asset & Content Management
- **Asset Search**: Find images, files, and resources across WebSim projects
- **Screenshot Gallery**: View project screenshots and revisions
- **Related Keywords**: Discover trending topics and search suggestions

### 💬 Community Features
- **Project Comments**: Access user discussions and feedback
- **Comment Threading**: View nested conversations and replies
- **Engagement Tracking**: Monitor likes, shares, and community interaction

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Smithery CLI** (optional, for development)

### Installing via Smithery

To install WebSim MCP Server automatically via [Smithery](https://smithery.ai/insight/@gigachadtrey/websimm):

```bash
npx -y @smithery/cli install @gigachadtrey/websimm
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd websim-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run in development mode:**
   ```bash
   npm run dev
   ```

## 🛠 Available Tools

### Core Project Operations

#### `get_project`
Get detailed information about a WebSim project by its ID.

**Parameters:**
- `id` (string, required): The unique identifier of the WebSim project

**Example Usage:**
```
"Show me project abc123"
"Tell me about project ID xyz789"
```

#### `get_project_by_slug`
Get project information using owner's username and project slug.

**Parameters:**
- `user` (string, required): The username of the project owner
- `slug` (string, required): The project slug/identifier

**Example Usage:**
```
"Show me @johndoe/my-awesome-project"
"Tell me about username/project-slug"
```

#### `list_trending_projects`
Get trending WebSim projects with filtering and pagination.

**Parameters:**
- `limit` (number, optional): Number of projects (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)
- `range` (string, optional): Time range - "hour", "day", "week", "month", "all" (default: "day")
- `feed` (string, optional): Feed type - "trending", "popular", "new" (default: "trending")

**Example Usage:**
```
"Show me trending projects from the last week"
"List popular projects with 50 results"
"What are the new projects?"
```

### User Management

#### `get_user`
Get detailed user profile information.

**Parameters:**
- `username` (string, required): The username of the WebSim user

**Example Usage:**
```
"Tell me about user johndoe"
"Show me @janesmith profile"
```

#### `get_user_projects`
List projects created by a specific user.

**Parameters:**
- `username` (string, required): The username of the WebSim user
- `query` (string, optional): Search query to filter projects
- `sort_by` (string, optional): Sort field - "created", "updated", "views", "likes", "title" (default: "updated")
- `limit` (number, optional): Number of projects (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Usage:**
```
"Show me johndoe's projects"
"List projects by @janesmith sorted by views"
"Find @user's projects about web development"
```

#### `get_user_stats`
Get detailed user statistics and analytics.

**Parameters:**
- `username` (string, required): The username of the WebSim user

**Example Usage:**
```
"Show me johndoe's statistics"
"What are @janesmith's stats?"
```

### Search & Discovery

#### `search_projects`
Search for projects by keywords, tags, or descriptions.

**Parameters:**
- `query` (string, required): Search query to find projects
- `sort` (string, optional): Sort results by - "relevance", "date", "views", "likes", "trending" (default: "relevance")
- `limit` (number, optional): Number of results (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Usage:**
```
"Find projects about React"
"Search for web development projects"
"Find trending AI projects"
```

#### `search_assets`
Search for assets (images, files, resources) in WebSim projects.

**Parameters:**
- `query` (string, required): Search query to find assets
- `mime_type` (string, optional): Filter by MIME type (e.g., "image/", "text/", "application/json")
- `limit` (number, optional): Number of results (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Usage:**
```
"Find images about technology"
"Search for CSS files"
"Find JSON configuration assets"
```

#### `get_related_keywords`
Get related keywords and search suggestions.

**Parameters:**
- `query` (string, required): The search query to get related keywords for
- `limit` (number, optional): Number of keywords (1-50, default: 10)
- `min_frequency` (number, optional): Minimum frequency threshold (default: 1)

**Example Usage:**
```
"What keywords are related to React?"
"Show me suggestions for web development"
```

### Community & Content

#### `list_project_comments`
Get comments on a WebSim project.

**Parameters:**
- `id` (string, required): The unique identifier of the WebSim project
- `first` (number, optional): Number of first comments to return
- `last` (number, optional): Number of last comments to return
- `before` (string, optional): Get comments before this comment ID
- `after` (string, optional): Get comments after this comment ID
- `sort_by` (string, optional): Sort comments by - "created", "likes" (default: "created")
- `sort_order` (string, optional): Sort order - "asc", "desc" (default: "desc")

**Example Usage:**
```
"Show me comments on project abc123"
"What are people saying about xyz789?"
"Get latest comments on my project"
```

#### `list_project_screenshots`
Get screenshots of a WebSim project revision.

**Parameters:**
- `id` (string, required): The unique identifier of the WebSim project
- `version` (number, optional): Project revision version number (default: 1)

**Example Usage:**
```
"Show me screenshots of project abc123"
"What does version 2 of my project look like?"
```

## 🔧 Configuration

### Environment Variables

The server can be configured using environment variables:

```bash
# Custom User-Agent for API requests
WEBSIM_USER_AGENT=websim-mcp-server/1.0.0 (your-contact-info@example.com)

# API request timeout in milliseconds
WEBSIM_TIMEOUT=30000

# Rate limiting settings
WEBSIM_RATE_LIMIT_REQUESTS=100
WEBSIM_RATE_LIMIT_WINDOW=60000
```

### Smithery Configuration

The server includes a `smithery.yaml` configuration for Smithery deployment:

```yaml
runtime: typescript
```

## 🚢 Deployment

### Smithery Deployment

This server is optimized for Smithery platform deployment:

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy to Smithery:**
   ```bash
   smithery deploy
   ```

3. **Monitor deployment:**
   ```bash
   smithery logs
   ```

### Docker Deployment

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing

Test individual tools using the MCP Inspector:

```bash
npm run inspect
```

### Unit Tests

Run the test suite:

```bash
npm test
```

### Integration Tests

Test API integration:

```bash
npm run test:integration
```

## 📊 API Coverage

This MCP server provides access to the following WebSim API endpoints:

### Project Operations
- ✅ `/api/v1/projects/{id}` - Get project by ID
- ✅ `/api/v1/users/{user}/slugs/{slug}` - Get project by username + slug
- ✅ `/api/v1/projects` - List public projects
- ✅ `/api/v1/projects/{id}/stats` - Get project statistics
- ✅ `/api/v1/projects/{id}/comments` - Get project comments
- ✅ `/api/v1/projects/{id}/revisions/{version}/screenshots` - Get project screenshots

### User Operations
- ✅ `/api/v1/users/{user}` - Get user profile
- ✅ `/api/v1/users/{user}/projects` - Get user projects
- ✅ `/api/v1/users/{user}/stats` - Get user statistics

### Discovery & Search
- ✅ `/api/v1/feed/trending` - Get trending feed
- ✅ `/api/v1/feed/search/{sort}/{search}` - Search projects
- ✅ `/api/v1/search/assets` - Search assets
- ✅ `/api/v1/search/related` - Get related keywords

### Community Features
- ✅ `/api/v1/users/{user}/following` - Get user following
- ✅ `/api/v1/users/{user}/followers` - Get user followers
- ✅ `/api/v1/users/{user}/likes` - Get user likes

## 🏗 Architecture

### Server Structure

```
src/
├── index.ts              # Main server implementation
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── config/               # Configuration management
```

### Key Components

1. **MCP Server**: Built using `@modelcontextprotocol/sdk`
2. **API Client**: Custom WebSim API integration with error handling
3. **Type Safety**: Comprehensive TypeScript definitions
4. **Error Handling**: Robust error handling with meaningful messages
5. **Performance**: Efficient API calls with caching and rate limiting

## 🔒 Security & Privacy

### Data Handling
- **No Data Storage**: The server doesn't store any user data
- **Read-Only Access**: All operations are read-only (public WebSim API)
- **No Authentication Required**: Uses public endpoints

### Best Practices
- **Rate Limiting**: Respects API rate limits
- **Error Handling**: Graceful error handling with user-friendly messages
- **Input Validation**: All inputs validated using Zod schemas
- **Type Safety**: Full TypeScript coverage for runtime safety

## 🐛 Troubleshooting

### Common Issues

1. **Connection Errors**
   ```
   Error: Unable to connect to WebSim service
   ```
   - Check internet connection
   - Verify WebSim API availability

2. **Rate Limiting**
   ```
   Error: Rate limit exceeded. Please try again later.
   ```
   - Wait before making additional requests
   - Consider implementing request delays

3. **Project Not Found**
   ```
   Error: Resource not found
   ```
   - Verify project ID or username/slug
   - Check if project is public

### Debug Mode

Enable debug logging:

```bash
DEBUG=websim:* npm run dev
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration
- Write comprehensive tests
- Document all public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebSim Platform** - For providing the public API
- **Smithery** - For the MCP framework and deployment platform
- **Model Context Protocol** - For the open standard
- **Community** - For feedback and contributions

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and inline comments
2. **Issues**: Report bugs via GitHub issues
3. **Discussions**: Join community discussions
4. **API Status**: Check WebSim API status

### Contact

- **Author**: MiniMax Agent
- **Email**: minimax@agent.com
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 🎯 Use Cases

### Research & Analysis
- "Analyze trending web simulation projects"
- "Show me popular React-based projects"
- "What are the most viewed projects this week?"

### User Discovery
- "Find influential WebSim users"
- "Show me active contributors"
- "Who are the top creators?"

### Content Discovery
- "Find projects about machine learning"
- "Search for UI/UX design examples"
- "Show me gaming-related simulations"

### Community Insights
- "What are people saying about AI projects?"
- "Show me recent project comments"
- "Find projects with high engagement"

This MCP server makes WebSim's rich ecosystem accessible to AI assistants, enabling comprehensive project discovery, user analysis, and community engagement insights.
