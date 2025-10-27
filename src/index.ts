import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// WebSim API base URL
const WEBSIM_API_BASE = "https://api.websim.com"

// User-Agent header for WebSim API requests
const USER_AGENT = "websim-mcp-server/1.0.0 (contact: minimax@agent.com)"

// Type definitions based on the WebSim API specification
interface WebSimProject {
	id: string
	owner: {
		username: string
		displayName?: string
		avatarUrl?: string
	}
	slug: string
	title: string
	description?: string
	createdAt: string
	updatedAt: string
	isPublic: boolean
	isFeatured?: boolean
	likesCount: number
	viewsCount: number
	forksCount: number
	revisionsCount: number
	latestRevision?: {
		version: number
		createdAt: string
		thumbnailUrl?: string
	}
	tags: string[]
}

interface WebSimUser {
	username: string
	displayName?: string
	avatarUrl?: string
	bio?: string
	joinedAt: string
	isVerified?: boolean
	stats: {
		projectsCount: number
		followersCount: number
		followingCount: number
		likesReceived: number
		viewsReceived: number
	}
}

interface WebSimFeed {
	items: Array<{
		id: string
		type: "project" | "like" | "follow" | "comment"
		project?: WebSimProject
		user?: WebSimUser
		timestamp: string
	}>
	pagination: {
		hasMore: boolean
		nextCursor?: string
	}
}

interface WebSimComment {
	id: string
	user: {
		username: string
		displayName?: string
		avatarUrl?: string
	}
	content: string
	createdAt: string
	likesCount: number
	repliesCount: number
	parentId?: string
}

interface WebSimScreenshot {
	id: string
	url: string
	width: number
	height: number
	createdAt: string
}

interface WebSimAsset {
	path: string
	name: string
	type: string
	size: number
	url: string
	lastModified: string
}

// Helper function to make WebSim API requests
async function websimApiRequest(endpoint: string, params?: Record<string, any>): Promise<unknown> {
	try {
		const url = new URL(`${WEBSIM_API_BASE}${endpoint}`)
		
		// Add query parameters if provided
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value))
				}
			})
		}

		const response = await fetch(url.toString(), {
			headers: {
				"User-Agent": USER_AGENT,
				"Accept": "application/json",
			},
		})

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error("Resource not found")
			}
			if (response.status === 429) {
				throw new Error("Rate limit exceeded. Please try again later.")
			}
			if (response.status >= 500) {
				throw new Error("WebSim service temporarily unavailable")
			}
			throw new Error(`WebSim API error: ${response.status} ${response.statusText}`)
		}

		return await response.json()
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message.includes("fetch")) {
				throw new Error("Unable to connect to WebSim service. Please check your internet connection.")
			}
			throw error
		}
		throw new Error("An unexpected error occurred while accessing WebSim API")
	}
}

// Helper function to format date/time
function formatDateTime(timestamp: string): string {
	try {
		const date = new Date(timestamp)
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short"
		})
	} catch {
		return timestamp
	}
}

// Helper function to format relative time
function formatRelativeTime(timestamp: string): string {
	try {
		const date = new Date(timestamp)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		
		const diffMinutes = Math.floor(diffMs / (1000 * 60))
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
		
		if (diffMinutes < 1) {
			return "just now"
		} else if (diffMinutes < 60) {
			return `${diffMinutes}m ago`
		} else if (diffHours < 24) {
			return `${diffHours}h ago`
		} else if (diffDays < 7) {
			return `${diffDays}d ago`
		} else {
			return formatDateTime(timestamp)
		}
	} catch {
		return timestamp
	}
}

// Helper function to format numbers with commas
function formatNumber(num: number): string {
	return num.toLocaleString("en-US")
}

export const stateless = true

export default function createStatelessServer() {
	const server = new McpServer({
		name: "WebSim MCP Server",
		version: "1.0.0",
	})

	// Tool: Get Project by ID
	server.tool(
		"get_project",
		"Get detailed information about a WebSim project by its ID. Perfect for 'Show me project [ID]' or 'Tell me about project [ID]' questions.",
		{
			id: z.string().describe("The unique identifier of the WebSim project"),
		},
		async ({ id }) => {
			try {
				const data = await websimApiRequest(`/api/v1/projects/${id}`)
				const project = data as WebSimProject

				let markdown = "# WebSim Project Details\n\n"
				markdown += `**Title:** ${project.title}\n`
				markdown += `**Project ID:** ${project.id}\n`
				markdown += `**Owner:** [${project.owner.displayName || project.owner.username}](https://websim.com/@${project.owner.username})\n`
				markdown += `**Slug:** ${project.slug}\n`
				
				if (project.description) {
					markdown += `**Description:** ${project.description}\n`
				}

				markdown += `**Status:** ${project.isPublic ? "Public" : "Private"}\n`
				if (project.isFeatured) {
					markdown += `**Featured:** Yes ⭐\n`
				}

				markdown += `**Created:** ${formatDateTime(project.createdAt)} (${formatRelativeTime(project.createdAt)})\n`
				markdown += `**Updated:** ${formatDateTime(project.updatedAt)} (${formatRelativeTime(project.updatedAt)})\n\n`

				// Statistics
				markdown += "## Statistics\n\n"
				markdown += `- **Views:** ${formatNumber(project.viewsCount)}\n`
				markdown += `- **Likes:** ${formatNumber(project.likesCount)}\n`
				markdown += `- **Forks:** ${formatNumber(project.forksCount)}\n`
				markdown += `- **Revisions:** ${formatNumber(project.revisionsCount)}\n\n`

				// Tags
				if (project.tags && project.tags.length > 0) {
					markdown += "## Tags\n\n"
					project.tags.forEach(tag => {
						markdown += `\`${tag}\` `
					})
					markdown += "\n\n"
				}

				// Latest revision info
				if (project.latestRevision) {
					markdown += "## Latest Revision\n\n"
					markdown += `**Version:** ${project.latestRevision.version}\n`
					markdown += `**Created:** ${formatDateTime(project.latestRevision.createdAt)} (${formatRelativeTime(project.latestRevision.createdAt)})\n`
					
					if (project.latestRevision.thumbnailUrl) {
						markdown += `**Thumbnail:** ![Thumbnail](${project.latestRevision.thumbnailUrl})\n`
					}
				}

				markdown += `\n\n**Project URL:** https://websim.com/@${project.owner.username}/${project.slug}`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get project: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching the project")
			}
		},
	)

	// Tool: Get Project by Username and Slug
	server.tool(
		"get_project_by_slug",
		"Get detailed information about a WebSim project using the owner's username and project slug. Perfect for 'Show me @username/project-slug' or 'Tell me about [username]/[slug]' questions.",
		{
			user: z.string().describe("The username of the project owner"),
			slug: z.string().describe("The project slug/identifier"),
		},
		async ({ user, slug }) => {
			try {
				const data = await websimApiRequest(`/api/v1/users/${user}/slugs/${slug}`)
				const project = data as WebSimProject

				let markdown = "# WebSim Project Details\n\n"
				markdown += `**Title:** ${project.title}\n`
				markdown += `**Project ID:** ${project.id}\n`
				markdown += `**Owner:** [${project.owner.displayName || project.owner.username}](https://websim.com/@${project.owner.username})\n`
				markdown += `**Slug:** ${project.slug}\n`
				
				if (project.description) {
					markdown += `**Description:** ${project.description}\n`
				}

				markdown += `**Status:** ${project.isPublic ? "Public" : "Private"}\n`
				if (project.isFeatured) {
					markdown += `**Featured:** Yes ⭐\n`
				}

				markdown += `**Created:** ${formatDateTime(project.createdAt)} (${formatRelativeTime(project.createdAt)})\n`
				markdown += `**Updated:** ${formatDateTime(project.updatedAt)} (${formatRelativeTime(project.updatedAt)})\n\n`

				// Statistics
				markdown += "## Statistics\n\n"
				markdown += `- **Views:** ${formatNumber(project.viewsCount)}\n`
				markdown += `- **Likes:** ${formatNumber(project.likesCount)}\n`
				markdown += `- **Forks:** ${formatNumber(project.forksCount)}\n`
				markdown += `- **Revisions:** ${formatNumber(project.revisionsCount)}\n\n`

				// Tags
				if (project.tags && project.tags.length > 0) {
					markdown += "## Tags\n\n"
					project.tags.forEach(tag => {
						markdown += `\`${tag}\` `
					})
					markdown += "\n\n"
				}

				// Latest revision info
				if (project.latestRevision) {
					markdown += "## Latest Revision\n\n"
					markdown += `**Version:** ${project.latestRevision.version}\n`
					markdown += `**Created:** ${formatDateTime(project.latestRevision.createdAt)} (${formatRelativeTime(project.latestRevision.createdAt)})\n`
					
					if (project.latestRevision.thumbnailUrl) {
						markdown += `**Thumbnail:** ![Thumbnail](${project.latestRevision.thumbnailUrl})\n`
					}
				}

				markdown += `\n\n**Project URL:** https://websim.com/@${project.owner.username}/${project.slug}`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get project: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching the project")
			}
		},
	)

	// Tool: List Trending Projects
	server.tool(
		"list_trending_projects",
		"Get a list of trending WebSim projects. Perfect for 'Show me trending projects' or 'What are the popular projects?' questions. Supports pagination and filtering by time range.",
		{
			limit: z.number().min(1).max(100).default(20).describe("Number of projects to return (1-100, default: 20)"),
			offset: z.number().min(0).default(0).describe("Number of projects to skip for pagination (default: 0)"),
			range: z.enum(["hour", "day", "week", "month", "all"]).default("day").describe("Time range for trending calculation"),
			feed: z.enum(["trending", "popular", "new"]).default("trending").describe("Type of feed to fetch"),
		},
		async ({ limit, offset, range, feed }) => {
			try {
				const params = { limit, offset, range, feed }
				const data = await websimApiRequest(`/api/v1/feed/trending`, params)
				const feedData = data as WebSimFeed

				let markdown = `# ${feed.charAt(0).toUpperCase() + feed.slice(1)} Projects\n\n`
				markdown += `Showing ${feedData.items.length} projects (range: ${range})\n\n`

				feedData.items.forEach((item, index) => {
					if (item.project) {
						const project = item.project
						markdown += `## ${index + 1}. ${project.title}\n\n`
						markdown += `**Owner:** [${project.owner.displayName || project.owner.username}](https://websim.com/@${project.owner.username})\n`
						markdown += `**Project ID:** ${project.id}\n`
						markdown += `**Slug:** ${project.slug}\n`
						
						if (project.description) {
							markdown += `**Description:** ${project.description}\n`
						}

						markdown += `**Views:** ${formatNumber(project.viewsCount)} | **Likes:** ${formatNumber(project.likesCount)} | **Forks:** ${formatNumber(project.forksCount)}\n`
						markdown += `**Created:** ${formatRelativeTime(project.createdAt)}\n`
						
						if (project.tags && project.tags.length > 0) {
							markdown += `**Tags:** ${project.tags.slice(0, 5).map(tag => `\`${tag}\``).join(" ")}${project.tags.length > 5 ? "..." : ""}\n`
						}

						if (project.isFeatured) {
							markdown += `**Featured:** ⭐\n`
						}

						markdown += `**URL:** https://websim.com/@${project.owner.username}/${project.slug}\n\n`
						markdown += "---\n\n"
					}
				})

				if (feedData.pagination.hasMore) {
					markdown += `*More projects available. Use offset ${offset + limit} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get trending projects: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching trending projects")
			}
		},
	)

	// Tool: Get User Profile
	server.tool(
		"get_user",
		"Get detailed information about a WebSim user profile. Perfect for 'Tell me about user [username]' or 'Show me @[username]' questions.",
		{
			username: z.string().describe("The username of the WebSim user"),
		},
		async ({ username }) => {
			try {
				const data = await websimApiRequest(`/api/v1/users/${username}`)
				const user = data as WebSimUser

				let markdown = `# User Profile: ${user.displayName || username}\n\n`
				markdown += `**Username:** ${username}\n`
				
				if (user.displayName) {
					markdown += `**Display Name:** ${user.displayName}\n`
				}

				if (user.bio) {
					markdown += `**Bio:** ${user.bio}\n`
				}

				markdown += `**Joined:** ${formatDateTime(user.joinedAt)} (${formatRelativeTime(user.joinedAt)})\n`

				if (user.isVerified) {
					markdown += `**Status:** Verified ✅\n`
				}

				markdown += `\n## Statistics\n\n`
				markdown += `- **Projects:** ${formatNumber(user.stats.projectsCount)}\n`
				markdown += `- **Followers:** ${formatNumber(user.stats.followersCount)}\n`
				markdown += `- **Following:** ${formatNumber(user.stats.followingCount)}\n`
				markdown += `- **Likes Received:** ${formatNumber(user.stats.likesReceived)}\n`
				markdown += `- **Views Received:** ${formatNumber(user.stats.viewsReceived)}\n\n`

				markdown += `**Profile URL:** https://websim.com/@${username}`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user profile: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching the user profile")
			}
		},
	)

	// Tool: Get User Projects
	server.tool(
		"get_user_projects",
		"Get a list of projects created by a specific WebSim user. Perfect for 'Show me [username]'s projects' or 'List projects by @[username]' questions. Supports sorting and pagination.",
		{
			username: z.string().describe("The username of the WebSim user"),
			query: z.string().optional().describe("Search query to filter projects"),
			sort_by: z.enum(["created", "updated", "views", "likes", "title"]).default("updated").describe("Sort field"),
			limit: z.number().min(1).max(100).default(20).describe("Number of projects to return (1-100, default: 20)"),
			offset: z.number().min(0).default(0).describe("Number of projects to skip for pagination (default: 0)"),
		},
		async ({ username, query, sort_by, limit, offset }) => {
			try {
				const params = { limit, offset, sort: sort_by, ...(query && { query }) }
				const data = await websimApiRequest(`/api/v1/users/${username}/projects`, params)
				const projects = data as WebSimProject[]

				let markdown = `# Projects by ${username}\n\n`
				if (query) {
					markdown += `Filtered by: "${query}"\n`
				}
				markdown += `Sorted by: ${sort_by}\n`
				markdown += `Showing ${projects.length} projects\n\n`

				projects.forEach((project, index) => {
					markdown += `## ${index + 1}. ${project.title}\n\n`
					markdown += `**Project ID:** ${project.id}\n`
					markdown += `**Slug:** ${project.slug}\n`
					
					if (project.description) {
						markdown += `**Description:** ${project.description}\n`
					}

					markdown += `**Status:** ${project.isPublic ? "Public" : "Private"}\n`
					markdown += `**Views:** ${formatNumber(project.viewsCount)} | **Likes:** ${formatNumber(project.likesCount)} | **Forks:** ${formatNumber(project.forksCount)}\n`
					markdown += `**Created:** ${formatRelativeTime(project.createdAt)}\n`
					markdown += `**Updated:** ${formatRelativeTime(project.updatedAt)}\n`
					
					if (project.tags && project.tags.length > 0) {
						markdown += `**Tags:** ${project.tags.slice(0, 3).map(tag => `\`${tag}\``).join(" ")}${project.tags.length > 3 ? "..." : ""}\n`
					}

					if (project.isFeatured) {
						markdown += `**Featured:** ⭐\n`
					}

					markdown += `**URL:** https://websim.com/@${project.owner.username}/${project.slug}\n\n`
					markdown += "---\n\n"
				})

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user projects: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user projects")
			}
		},
	)

	// Tool: Get User Stats
	server.tool(
		"get_user_stats",
		"Get detailed statistics for a WebSim user. Perfect for 'Show me [username]'s statistics' or 'What are @[username]'s stats?' questions.",
		{
			username: z.string().describe("The username of the WebSim user"),
		},
		async ({ username }) => {
			try {
				const data = await websimApiRequest(`/api/v1/users/${username}/stats`)
				const stats = data as WebSimUser["stats"]

				let markdown = `# User Statistics: ${username}\n\n`
				markdown += "## Overview\n\n"
				markdown += `- **Total Projects:** ${formatNumber(stats.projectsCount)}\n`
				markdown += `- **Followers:** ${formatNumber(stats.followersCount)}\n`
				markdown += `- **Following:** ${formatNumber(stats.followingCount)}\n`
				markdown += `- **Total Likes Received:** ${formatNumber(stats.likesReceived)}\n`
				markdown += `- **Total Views Received:** ${formatNumber(stats.viewsReceived)}\n\n`

				// Calculate engagement metrics
				if (stats.projectsCount > 0) {
					markdown += "## Engagement Metrics\n\n"
					markdown += `- **Avg Views per Project:** ${formatNumber(Math.round(stats.viewsReceived / stats.projectsCount))}\n`
					markdown += `- **Avg Likes per Project:** ${formatNumber(Math.round(stats.likesReceived / stats.projectsCount))}\n`
					markdown += `- **Follower to Project Ratio:** ${formatNumber(Math.round(stats.followersCount / stats.projectsCount))}\n\n`
				}

				// Community standing
				markdown += "## Community Standing\n\n"
				if (stats.followersCount > stats.followingCount) {
					markdown += "📈 **Growing Influence** - More followers than following\n"
				} else if (stats.followersCount < stats.followingCount) {
					markdown += "📚 **Active Explorer** - Following more than followers\n"
				} else {
					markdown += "⚖️ **Balanced Community** - Equal followers and following\n"
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user stats: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user statistics")
			}
		},
	)

	// Tool: Search Projects
	server.tool(
		"search_projects",
		"Search for WebSim projects by keywords, tags, or descriptions. Perfect for 'Find projects about [topic]' or 'Search for [keyword] projects' questions. Supports sorting and pagination.",
		{
			query: z.string().describe("Search query to find projects"),
			sort: z.enum(["relevance", "date", "views", "likes", "trending"]).default("relevance").describe("Sort results by"),
			limit: z.number().min(1).max(100).default(20).describe("Number of results to return (1-100, default: 20)"),
			offset: z.number().min(0).default(0).describe("Number of results to skip for pagination (default: 0)"),
		},
		async ({ query, sort, limit, offset }) => {
			try {
				const params = { query, sort, limit, offset }
				const data = await websimApiRequest(`/api/v1/feed/search/trending/${encodeURIComponent(query)}`, params)
				const feedData = data as WebSimFeed

				let markdown = `# Search Results for "${query}"\n\n`
				markdown += `Found ${feedData.items.length} projects (sorted by: ${sort})\n\n`

				feedData.items.forEach((item, index) => {
					if (item.project) {
						const project = item.project
						markdown += `## ${index + 1}. ${project.title}\n\n`
						markdown += `**Owner:** [${project.owner.displayName || project.owner.username}](https://websim.com/@${project.owner.username})\n`
						markdown += `**Project ID:** ${project.id}\n`
						markdown += `**Slug:** ${project.slug}\n`
						
						if (project.description) {
							markdown += `**Description:** ${project.description}\n`
						}

						markdown += `**Views:** ${formatNumber(project.viewsCount)} | **Likes:** ${formatNumber(project.likesCount)} | **Forks:** ${formatNumber(project.forksCount)}\n`
						markdown += `**Created:** ${formatRelativeTime(project.createdAt)}\n`
						
						if (project.tags && project.tags.length > 0) {
							markdown += `**Tags:** ${project.tags.slice(0, 5).map(tag => `\`${tag}\``).join(" ")}${project.tags.length > 5 ? "..." : ""}\n`
						}

						if (project.isFeatured) {
							markdown += `**Featured:** ⭐\n`
						}

						markdown += `**URL:** https://websim.com/@${project.owner.username}/${project.slug}\n\n`
						markdown += "---\n\n"
					}
				})

				if (feedData.pagination.hasMore) {
					markdown += `*More results available. Use offset ${offset + limit} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to search projects: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while searching projects")
			}
		},
	)

	// Tool: Search Assets
	server.tool(
		"search_assets",
		"Search for assets (images, files, resources) in WebSim projects. Perfect for 'Find assets about [topic]' or 'Search for [keyword] files' questions. Supports MIME type filtering.",
		{
			query: z.string().describe("Search query to find assets"),
			mime_type: z.string().optional().describe("Filter by MIME type (e.g., 'image/', 'text/', 'application/json')"),
			limit: z.number().min(1).max(100).default(20).describe("Number of results to return (1-100, default: 20)"),
			offset: z.number().min(0).default(0).describe("Number of results to skip for pagination (default: 0)"),
		},
		async ({ query, mime_type, limit, offset }) => {
			try {
				const params = { query, mime_type, limit, offset }
				const data = await websimApiRequest(`/api/v1/search/assets`, params)
				const assets = data as WebSimAsset[]

				let markdown = `# Asset Search Results for "${query}"\n\n`
				if (mime_type) {
					markdown += `Filtered by MIME type: ${mime_type}\n`
				}
				markdown += `Found ${assets.length} assets\n\n`

				assets.forEach((asset, index) => {
					markdown += `## ${index + 1}. ${asset.name}\n\n`
					markdown += `**Path:** \`${asset.path}\`\n`
					markdown += `**Type:** ${asset.type}\n`
					markdown += `**Size:** ${formatNumber(asset.size)} bytes\n`
					markdown += `**Last Modified:** ${formatDateTime(asset.lastModified)}\n`
					markdown += `**URL:** ${asset.url}\n\n`
					markdown += "---\n\n"
				})

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to search assets: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while searching assets")
			}
		},
	)

	// Tool: List Project Comments
	server.tool(
		"list_project_comments",
		"Get comments on a WebSim project. Perfect for 'Show me comments on project [ID]' or 'What are people saying about [project]?' questions. Supports pagination and different sorting orders.",
		{
			id: z.string().describe("The unique identifier of the WebSim project"),
			first: z.number().min(1).max(100).optional().describe("Number of first comments to return"),
			last: z.number().min(1).max(100).optional().describe("Number of last comments to return"),
			before: z.string().optional().describe("Get comments before this comment ID"),
			after: z.string().optional().describe("Get comments after this comment ID"),
			sort_by: z.enum(["created", "likes"]).default("created").describe("Sort comments by"),
			sort_order: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
		},
		async ({ id, first, last, before, after, sort_by, sort_order }) => {
			try {
				const params = { first, last, before, after, sort_by, sort_order }
				const data = await websimApiRequest(`/api/v1/projects/${id}/comments`, params)
				const comments = data as WebSimComment[]

				let markdown = `# Comments on Project ${id}\n\n`
				markdown += `Sorted by: ${sort_by} (${sort_order})\n`
				markdown += `Found ${comments.length} comments\n\n`

				comments.forEach((comment, index) => {
					markdown += `## Comment ${index + 1}\n\n`
					markdown += `**Author:** [${comment.user.displayName || comment.user.username}](https://websim.com/@${comment.user.username})\n`
					markdown += `**Posted:** ${formatDateTime(comment.createdAt)} (${formatRelativeTime(comment.createdAt)})\n`
					markdown += `**Likes:** ${formatNumber(comment.likesCount)}\n`
					if (comment.repliesCount > 0) {
						markdown += `**Replies:** ${formatNumber(comment.repliesCount)}\n`
					}
					markdown += `\n**Content:**\n${comment.content}\n\n`
					
					if (comment.parentId) {
						markdown += `*Reply to comment: ${comment.parentId}*\n\n`
					}
					
					markdown += "---\n\n"
				})

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get project comments: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching project comments")
			}
		},
	)

	// Tool: Get Related Keywords
	server.tool(
		"get_related_keywords",
		"Get related keywords and search suggestions based on a query. Perfect for 'What keywords are related to [topic]?' or 'Show me suggestions for [keyword]' questions. Helps discover related content and trending topics.",
		{
			query: z.string().describe("The search query to get related keywords for"),
			limit: z.number().min(1).max(50).default(10).describe("Number of related keywords to return (1-50, default: 10)"),
			min_frequency: z.number().min(1).default(1).describe("Minimum frequency threshold for keywords"),
		},
		async ({ query, limit, min_frequency }) => {
			try {
				const params = { query, limit, min_frequency }
				const data = await websimApiRequest(`/api/v1/search/related`, params)
				const relatedKeywords = data as Array<{ keyword: string; frequency: number; score: number }>

				let markdown = `# Related Keywords for "${query}"\n\n`
				markdown += `Found ${relatedKeywords.length} related keywords\n\n`

				markdown += "## Related Terms\n\n"
				relatedKeywords.forEach((item, index) => {
					markdown += `${index + 1}. **${item.keyword}**\n`
					markdown += `   - Frequency: ${formatNumber(item.frequency)}\n`
					markdown += `   - Relevance Score: ${item.score.toFixed(2)}\n\n`
				})

				markdown += "## Search Suggestions\n\n"
				markdown += "Try searching for:\n"
				relatedKeywords.slice(0, 5).forEach(item => {
					markdown += `- "${item.keyword}"\n`
				})

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get related keywords: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching related keywords")
			}
		},
	)

	// Tool: List Project Screenshots
	server.tool(
		"list_project_screenshots",
		"Get screenshots of a WebSim project revision. Perfect for 'Show me screenshots of project [ID]' or 'What does [project] version [X] look like?' questions.",
		{
			id: z.string().describe("The unique identifier of the WebSim project"),
			version: z.number().default(1).describe("Project revision version number (default: 1)"),
		},
		async ({ id, version }) => {
			try {
				const data = await websimApiRequest(`/api/v1/projects/${id}/revisions/${version}/screenshots`)
				const screenshots = data as WebSimScreenshot[]

				let markdown = `# Screenshots for Project ${id} (Version ${version})\n\n`
				markdown += `Found ${screenshots.length} screenshots\n\n`

				screenshots.forEach((screenshot, index) => {
					markdown += `## Screenshot ${index + 1}\n\n`
					markdown += `**ID:** ${screenshot.id}\n`
					markdown += `**Dimensions:** ${screenshot.width} × ${screenshot.height}\n`
					markdown += `**Created:** ${formatDateTime(screenshot.createdAt)} (${formatRelativeTime(screenshot.createdAt)})\n`
					markdown += `**URL:** ${screenshot.url}\n\n`
					markdown += `![Screenshot ${index + 1}](${screenshot.url})\n\n`
					markdown += "---\n\n"
				})

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get project screenshots: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching project screenshots")
			}
		},
	)

	return server
}