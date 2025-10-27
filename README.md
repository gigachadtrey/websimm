# WebSim MCP Server

A production-ready Model Context Protocol (MCP) server for accessing the real WebSim API. This server provides comprehensive access to WebSim trending sites, user profiles, bookmarks, and community features using the official WebSim API endpoints.

## 🌟 Features

### 🔥 Trending & Discovery
- **Trending Sites**: Access popular and trending sites with time range filtering (day/week/month/all)
- **Site Details**: Get comprehensive site information by ID or username/slug
- **Real-time Data**: Live access to WebSim's trending algorithms and user engagement

### 👥 User Profile & Social Features
- **User Profiles**: Get detailed user information including usernames, avatar, and profile data
- **User Bookmarks**: Browse bookmarks created by specific users
- **Following & Followers**: Track social connections and user relationships
- **Liked Sites**: Access sites that users have liked

### 🏷️ Community Insights
- **Following Activity**: See what people you follow are bookmarking
- **Social Discovery**: Explore user interactions and community patterns
- **Engagement Metrics**: Track views, likes, and community engagement

## 🔗 Available Tools

### Trending & Discovery
- **`get_trending_sites`** - Get trending sites with range and class filtering

### Site Information  
- **`get_site_details`** - Get detailed site information by ID
- **`get_site_by_username_slug`** - Get site by username/slug path

### User Management
- **`get_user_profile`** - Get user profile by username or ID
- **`get_user_bookmarks`** - Get bookmarks created by a user
- **`get_user_following`** - Get list of users this user follows
- **`get_user_followers`** - Get list of this user's followers

### Social Features
- **`get_user_likes`** - Get sites liked by a user
- **`get_following_bookmarks`** - Get bookmarks from users being followed

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Smithery CLI** (optional, for development)

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

This MCP server provides access to the following **real WebSim API endpoints**:

### Trending & Discovery
- ✅ `/api/v1/feed/trending` - Get trending sites with filtering

### Site Information
- ✅ `/api/v1/sites/{site_id}` - Get site details by ID
- ✅ `/api/v1/sites/{username}/{slug}` - Get site by username/slug

### User Operations
- ✅ `/api/v1/users/{usernameOrId}` - Get user profile by username or ID
- ✅ `/api/v1/users/{usernameOrId}/bookmarks` - Get user bookmarks
- ✅ `/api/v1/users/{usernameOrId}/following` - Get users that user is following
- ✅ `/api/v1/users/{usernameOrId}/followers` - Get user's followers
- ✅ `/api/v1/users/{usernameOrId}/likes` - Get sites liked by user

### Social Features
- ✅ `/api/v1/users/{usernameOrId}/following/bookmarks` - Get bookmarks from followed users

**Base URL**: `https://websim.ai/api/v1`
**API Version**: v1
**Authentication**: Not required (public API)

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

### Trending Content Discovery
- "Show me trending sites for today"
- "What are the popular sites this week?"
- "Get trending sites in the last month"
- "Find trending gaming sites"

### Site Information Analysis
- "Show me details for site [ID]"
- "Tell me about @username/slug-name"
- "What information is available for this site?"
- "Get site statistics and engagement data"

### User Profile Research
- "Show me user profile for @username"
- "What has @username bookmarked?"
- "Who follows @username?"
- "Who is @username following?"

### Social Network Analysis
- "Show me what @username's follows are posting"
- "What sites has @username liked?"
- "Get bookmarks from users @username follows"
- "Analyze social connections on WebSim"

### Community Insights
- "Find active community members"
- "Show me recent bookmarking activity"
- "What are people discovering on WebSim?"
- "Analyze user engagement patterns"

This MCP server makes WebSim's rich ecosystem accessible to AI assistants, enabling comprehensive project discovery, user analysis, and community engagement insights.