#!/usr/bin/env node

/**
 * WebSim MCP Server
 * Fetch and interact with WebSim public data (projects, users, feeds, assets)
 * 
 * API Base URL: https://api.websim.com
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Configuration
const WEBSIM_API_BASE = 'https://api.websim.com';
const DEFAULT_TIMEOUT = 30000;

// Input validation schemas
const ProjectIdSchema = z.object({
  project_id: z.string().describe('WebSim project ID')
});

const UserSlugSchema = z.object({
  user: z.string().describe('Username'),
  slug: z.string().describe('Project slug')
});

const ProjectRevisionSchema = z.object({
  project_id: z.string().describe('WebSim project ID'),
  version: z.string().optional().describe('Project version (default: latest)')
});

const UserParamsSchema = z.object({
  user: z.string().describe('Username')
});

const SearchParamsSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().optional().default(20).describe('Number of results to return (default: 20)'),
  offset: z.number().optional().default(0).describe('Number of results to skip (default: 0)')
});

const FeedSearchSchema = z.object({
  sort: z.enum(['trending', 'newest', 'popular']).describe('Sort method'),
  search: z.string().describe('Search query')
});

const BulkAssetSearchSchema = z.object({
  assets: z.array(z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().default(10).describe('Number of results per query')
  }))
});

const ProjectCommentsSchema = z.object({
  project_id: z.string().describe('WebSim project ID'),
  limit: z.number().optional().default(20).describe('Number of comments to return'),
  offset: z.number().optional().default(0).describe('Number of comments to skip')
});

// API client class
class WebSimAPIClient {
  constructor(baseURL = WEBSIM_API_BASE, timeout = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Project Management
  async getProjectById(projectId) {
    return this.makeRequest(`/api/v1/projects/${projectId}`);
  }

  async getProjectBySlug(user, slug) {
    return this.makeRequest(`/api/v1/users/${user}/slugs/${slug}`);
  }

  async listAllProjects(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/projects?${params}`);
  }

  async listUserProjects(user, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/users/${user}/projects?${params}`);
  }

  async getProjectRevisions(projectId, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/projects/${projectId}/revisions?${params}`);
  }

  async getProjectStats(projectId) {
    return this.makeRequest(`/api/v1/projects/${projectId}/stats`);
  }

  async getProjectDescendants(projectId, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/projects/${projectId}/descendants?${params}`);
  }

  // User Management
  async getUser(user) {
    return this.makeRequest(`/api/v1/users/${user}`);
  }

  async getUserStats(user) {
    return this.makeRequest(`/api/v1/users/${user}/stats`);
  }

  async searchUsers(query, limit = 20, offset = 0) {
    const params = new URLSearchParams({ 
      q: query, 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    return this.makeRequest(`/api/v1/user-search?${params}`);
  }

  async getUserFollowing(user, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/users/${user}/following?${params}`);
  }

  async getUserFollowers(user, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/users/${user}/followers?${params}`);
  }

  // Feed & Discovery
  async getTrendingFeed(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/feed/trending?${params}`);
  }

  async getPostsFeed(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/feed/posts?${params}`);
  }

  async searchFeed(sort, search, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/feed/search/${sort}/${search}?${params}`);
  }

  async getTrendingRooms(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/feed/rooms?${params}`);
  }

  // Assets & Search
  async searchAssets(query, limit = 20, offset = 0) {
    const params = new URLSearchParams({ 
      q: query, 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    return this.makeRequest(`/api/v1/search/assets?${params}`);
  }

  async bulkAssetSearch(assets) {
    return this.makeRequest('/api/v1/search/assets/bulk', {
      method: 'POST',
      body: JSON.stringify({ assets })
    });
  }

  async searchRelevantAssets(query, limit = 10) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return this.makeRequest(`/api/v1/search/assets/relevant?${params}`);
  }

  async getRelatedKeywords(query, limit = 10) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return this.makeRequest(`/api/v1/search/related?${params}`);
  }

  async getTopSearches(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/search/top?${params}`);
  }

  async getProjectAssets(projectId, version = 'latest') {
    const params = new URLSearchParams({ version });
    return this.makeRequest(`/api/v1/projects/${projectId}/revisions/${version}/assets?${params}`);
  }

  // Comments
  async getProjectComments(projectId, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/projects/${projectId}/comments?${params}`);
  }

  async getCommentReplies(projectId, commentId, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.makeRequest(`/api/v1/projects/${projectId}/comments/${commentId}/replies?${params}`);
  }
}

// Initialize API client
const apiClient = new WebSimAPIClient();

// Tool implementations
const tools = [
  {
    name: "get_project_by_id",
    description: "Get a WebSim project by its ID",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id } = ProjectIdSchema.parse(args);
      const result = await apiClient.getProjectById(project_id);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved project ${project_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_by_slug",
    description: "Get a WebSim project by user and slug",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        },
        slug: {
          type: "string",
          description: "Project slug"
        }
      },
      required: ["user", "slug"]
    },
    handler: async (args) => {
      const { user, slug } = UserSlugSchema.parse(args);
      const result = await apiClient.getProjectBySlug(user, slug);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved project ${user}/${slug}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "list_all_projects",
    description: "List all public WebSim projects with pagination",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of projects to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of projects to skip (default: 0)",
          default: 0
        }
      }
    },
    handler: async (args) => {
      const { limit = 20, offset = 0 } = args;
      const result = await apiClient.listAllProjects(limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} projects (offset: ${offset})`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "list_user_projects",
    description: "List all projects for a specific user",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        },
        limit: {
          type: "number",
          description: "Number of projects to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of projects to skip (default: 0)",
          default: 0
        }
      },
      required: ["user"]
    },
    handler: async (args) => {
      const { user, limit = 20, offset = 0 } = UserParamsSchema.parse(args);
      const result = await apiClient.listUserProjects(user, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} projects for user ${user}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_revisions",
    description: "Get all revisions of a WebSim project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        },
        limit: {
          type: "number",
          description: "Number of revisions to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of revisions to skip (default: 0)",
          default: 0
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id, limit = 20, offset = 0 } = ProjectIdSchema.parse(args);
      const result = await apiClient.getProjectRevisions(project_id, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} revisions for project ${project_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_stats",
    description: "Get statistics for a WebSim project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id } = ProjectIdSchema.parse(args);
      const result = await apiClient.getProjectStats(project_id);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved statistics for project ${project_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_descendants",
    description: "Get projects that are descendants of a WebSim project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        },
        limit: {
          type: "number",
          description: "Number of descendants to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of descendants to skip (default: 0)",
          default: 0
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id, limit = 20, offset = 0 } = ProjectIdSchema.parse(args);
      const result = await apiClient.getProjectDescendants(project_id, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} descendants for project ${project_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_user",
    description: "Get details for a specific WebSim user",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        }
      },
      required: ["user"]
    },
    handler: async (args) => {
      const { user } = UserParamsSchema.parse(args);
      const result = await apiClient.getUser(user);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved user ${user}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_user_stats",
    description: "Get statistics for a specific WebSim user",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        }
      },
      required: ["user"]
    },
    handler: async (args) => {
      const { user } = UserParamsSchema.parse(args);
      const result = await apiClient.getUserStats(user);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved statistics for user ${user}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "search_users",
    description: "Search for WebSim users",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of results to skip (default: 0)",
          default: 0
        }
      },
      required: ["query"]
    },
    handler: async (args) => {
      const { query, limit = 20, offset = 0 } = SearchParamsSchema.parse(args);
      const result = await apiClient.searchUsers(query, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Found ${result.items?.length || 0} users matching "${query}"`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_user_following",
    description: "Get users that a specific user is following",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        },
        limit: {
          type: "number",
          description: "Number of users to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of users to skip (default: 0)",
          default: 0
        }
      },
      required: ["user"]
    },
    handler: async (args) => {
      const { user, limit = 20, offset = 0 } = UserParamsSchema.parse(args);
      const result = await apiClient.getUserFollowing(user, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} users followed by ${user}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_user_followers",
    description: "Get followers of a specific WebSim user",
    inputSchema: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "Username"
        },
        limit: {
          type: "number",
          description: "Number of users to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of users to skip (default: 0)",
          default: 0
        }
      },
      required: ["user"]
    },
    handler: async (args) => {
      const { user, limit = 20, offset = 0 } = UserParamsSchema.parse(args);
      const result = await apiClient.getUserFollowers(user, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} followers of ${user}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_trending_feed",
    description: "Get trending WebSim projects feed",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of projects to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of projects to skip (default: 0)",
          default: 0
        }
      }
    },
    handler: async (args) => {
      const { limit = 20, offset = 0 } = args;
      const result = await apiClient.getTrendingFeed(limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} trending projects`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_posts_feed",
    description: "Get latest posts from WebSim feed",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of posts to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of posts to skip (default: 0)",
          default: 0
        }
      }
    },
    handler: async (args) => {
      const { limit = 20, offset = 0 } = args;
      const result = await apiClient.getPostsFeed(limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} latest posts`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "search_feed",
    description: "Search WebSim feed with sorting options",
    inputSchema: {
      type: "object",
      properties: {
        sort: {
          type: "string",
          enum: ["trending", "newest", "popular"],
          description: "Sort method (trending, newest, or popular)"
        },
        search: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of results to skip (default: 0)",
          default: 0
        }
      },
      required: ["sort", "search"]
    },
    handler: async (args) => {
      const { sort, search, limit = 20, offset = 0 } = FeedSearchSchema.parse(args);
      const result = await apiClient.searchFeed(sort, search, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Found ${result.items?.length || 0} results for "${search}" (sorted by ${sort})`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_trending_rooms",
    description: "Get trending WebSim rooms",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of rooms to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of rooms to skip (default: 0)",
          default: 0
        }
      }
    },
    handler: async (args) => {
      const { limit = 20, offset = 0 } = args;
      const result = await apiClient.getTrendingRooms(limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} trending rooms`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "search_assets",
    description: "Search for WebSim assets",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of results to skip (default: 0)",
          default: 0
        }
      },
      required: ["query"]
    },
    handler: async (args) => {
      const { query, limit = 20, offset = 0 } = SearchParamsSchema.parse(args);
      const result = await apiClient.searchAssets(query, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Found ${result.items?.length || 0} assets matching "${query}"`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "bulk_asset_search",
    description: "Search for multiple asset queries in bulk",
    inputSchema: {
      type: "object",
      properties: {
        assets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query"
              },
              limit: {
                type: "number",
                description: "Number of results per query (default: 10)",
                default: 10
              }
            },
            required: ["query"]
          },
          description: "Array of asset search queries"
        }
      },
      required: ["assets"]
    },
    handler: async (args) => {
      const { assets } = BulkAssetSearchSchema.parse(args);
      const result = await apiClient.bulkAssetSearch(assets);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Bulk search completed for ${assets.length} queries`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "search_relevant_assets",
    description: "Search for assets relevant to a query",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 10)",
          default: 10
        }
      },
      required: ["query"]
    },
    handler: async (args) => {
      const { query, limit = 10 } = args;
      const result = await apiClient.searchRelevantAssets(query, limit);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Found ${result.items?.length || 0} relevant assets for "${query}"`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_related_keywords",
    description: "Get keywords related to a search query",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of keywords to return (default: 10)",
          default: 10
        }
      },
      required: ["query"]
    },
    handler: async (args) => {
      const { query, limit = 10 } = args;
      const result = await apiClient.getRelatedKeywords(query, limit);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Found ${result.items?.length || 0} related keywords for "${query}"`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_top_searches",
    description: "Get top search queries on WebSim",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of searches to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of searches to skip (default: 0)",
          default: 0
        }
      }
    },
    handler: async (args) => {
      const { limit = 20, offset = 0 } = args;
      const result = await apiClient.getTopSearches(limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved top ${result.items?.length || 0} searches`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_assets",
    description: "Get assets for a specific project version",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        },
        version: {
          type: "string",
          description: "Project version (default: latest)",
          default: "latest"
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id, version = 'latest' } = ProjectRevisionSchema.parse(args);
      const result = await apiClient.getProjectAssets(project_id, version);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved assets for project ${project_id} (version: ${version})`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_project_comments",
    description: "Get comments for a WebSim project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        },
        limit: {
          type: "number",
          description: "Number of comments to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of comments to skip (default: 0)",
          default: 0
        }
      },
      required: ["project_id"]
    },
    handler: async (args) => {
      const { project_id, limit = 20, offset = 0 } = ProjectCommentsSchema.parse(args);
      const result = await apiClient.getProjectComments(project_id, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} comments for project ${project_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "get_comment_replies",
    description: "Get replies to a specific comment",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "WebSim project ID"
        },
        comment_id: {
          type: "string",
          description: "Comment ID"
        },
        limit: {
          type: "number",
          description: "Number of replies to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Number of replies to skip (default: 0)",
          default: 0
        }
      },
      required: ["project_id", "comment_id"]
    },
    handler: async (args) => {
      const { project_id, comment_id, limit = 20, offset = 0 } = args;
      const result = await apiClient.getCommentReplies(project_id, comment_id, limit, offset);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            message: `Successfully retrieved ${result.items?.length || 0} replies to comment ${comment_id}`
          }, null, 2)
        }]
      };
    }
  },
  {
    name: "health_check",
    description: "Check if the WebSim API is accessible",
    inputSchema: {
      type: "object",
      properties: {}
    },
    handler: async (args) => {
      try {
        // Try to access a simple endpoint to test connectivity
        await apiClient.makeRequest('/api/v1/projects', { method: 'GET' });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              status: "healthy",
              message: "WebSim API is accessible",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              status: "unhealthy",
              message: `WebSim API is not accessible: ${error.message}`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: "websim-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    console.log(`[WebSim MCP] Tool called: ${request.params.name}`);
    console.log(`[WebSim MCP] Arguments:`, JSON.stringify(request.params.arguments, null, 2));

    const result = await tool.handler(request.params.arguments || {});
    
    console.log(`[WebSim MCP] Tool ${request.params.name} completed successfully`);
    return result;
  } catch (error) {
    console.error(`[WebSim MCP] Tool ${request.params.name} failed:`, error);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }, null, 2)
      }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[WebSim MCP] WebSim MCP Server started");
}

main().catch((error) => {
  console.error("[WebSim MCP] Fatal error:", error);
  process.exit(1);
});