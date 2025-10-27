import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// WebSim API base URL - using the real WebSim API endpoint
const WEBSIM_API_BASE = "https://websim.ai/api/v1"

// User-Agent header for WebSim API requests
const USER_AGENT = "websim-mcp-server/1.0.0 (contact: minimax@agent.com)"

// Type definitions based on the real WebSim API specification
interface WebSimUser {
	_type: string
	id: string
	created_at: string
	username: string
	discord_id?: string
	discord_username?: string
	avatar_url?: string
	is_admin?: boolean
}

interface WebSimSite {
	_type: string
	id: string
	parent_id?: string
	created_at: string
	state: string
	model?: string
	lore?: any
	title?: string
	url?: string
	prompt?: any
	owner?: WebSimUser
	link_url?: string
	versioned_link_url?: string
	deleted_at?: string
	yapping?: any
}

interface WebSimTrendingItem {
	site: WebSimSite
	likes: number
	views: number
	remixes: number
	comments: number
	is_multiplayer: boolean
	project?: any
	project_revision?: any
	token?: string
	cursor: string
}

interface WebSimFeedResponse {
	data: WebSimTrendingItem[]
	meta: {
		offset: number
		limit: number
	}
}

interface ApiErrorResponse {
	error: {
		message: string
		code: string
		cause?: any
	}
}

// Helper function to make WebSim API requests
async function websimApiRequest<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
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
			try {
				const errorData = await response.json() as ApiErrorResponse
				if (response.status === 404) {
					throw new Error("Resource not found")
				}
				if (response.status === 429) {
					throw new Error("Rate limit exceeded. Please try again later.")
				}
				if (response.status >= 500) {
					throw new Error("WebSim service temporarily unavailable")
				}
				throw new Error(`WebSim API error: ${errorData.error?.message || `${response.status} ${response.statusText}`}`)
			} catch {
				throw new Error(`WebSim API error: ${response.status} ${response.statusText}`)
			}
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

	// Tool: Get Trending Sites
	server.tool(
		"get_trending_sites",
		"Get the latest trending sites on WebSim. Perfect for 'Show me trending sites' or 'What are the popular sites?' questions. Supports time range filtering.",
		{
			range: z.enum(["day", "week", "month", "all"]).default("day").describe("Time range for trending calculation"),
			class: z.string().optional().describe("Filter by class/category"),
			limit: z.number().min(1).max(100).default(20).describe("Number of results to return (1-100, default: 20)"),
		},
		async ({ range, class: classFilter, limit }) => {
			try {
				const params = { range, ...(classFilter && { class: classFilter }), first: limit }
				const data = await websimApiRequest<WebSimFeedResponse>("/feed/trending", params)

				let markdown = `# Trending Sites (${range})\n\n`
				markdown += `Showing ${data.data.length} trending sites\n\n`

				data.data.forEach((item, index) => {
					const site = item.site
					markdown += `## ${index + 1}. ${site.title || "Untitled Site"}\n\n`
					markdown += `**Site ID:** ${site.id}\n`
					
					if (site.owner?.username) {
						markdown += `**Owner:** [${site.owner.username}](https://websim.ai/@${site.owner.username})\n`
					}
					
					if (site.model) {
						markdown += `**Model:** ${site.model}\n`
					}
					
					markdown += `**State:** ${site.state}\n`
					markdown += `**Views:** ${formatNumber(item.views)}\n`
					markdown += `**Likes:** ${formatNumber(item.likes)}\n`
					markdown += `**Remixes:** ${formatNumber(item.remixes)}\n`
					markdown += `**Comments:** ${formatNumber(item.comments)}\n`
					markdown += `**Created:** ${formatDateTime(site.created_at)} (${formatRelativeTime(site.created_at)})\n`
					
					// Show site URL for rendering
					if (site.link_url) {
						markdown += `**Link URL:** ${site.link_url}\n`
					}
					
					markdown += `**Live Site:** https://websim.ai/c/${site.id}\n\n`
					
					markdown += "---\n\n"
				})

				markdown += `**Pagination:** Offset ${data.meta.offset}, Limit ${data.meta.limit}\n`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get trending sites: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching trending sites")
			}
		},
	)

	// Tool: Get Site Details by ID
	server.tool(
		"get_site_details",
		"Get detailed information about a WebSim site by its ID. Perfect for 'Show me site [ID]' or 'Tell me about site [ID]' questions.",
		{
			site_id: z.string().describe("The unique identifier of the WebSim site"),
		},
		async ({ site_id }) => {
			try {
				const data = await websimApiRequest<{ site: WebSimSite; project: any; project_revision: any }>(`/sites/${site_id}`)
				const { site, project } = data

				let markdown = `# WebSim Site Details\n\n`
				markdown += `**Site ID:** ${site.id}\n`
				markdown += `**Title:** ${site.title || "Untitled Site"}\n`
				
				if (site.owner?.username) {
					markdown += `**Owner:** [${site.owner.username}](https://websim.ai/@${site.owner.username})\n`
				}
				
				if (site.model) {
					markdown += `**Model:** ${site.model}\n`
				}
				
				markdown += `**State:** ${site.state}\n`
				markdown += `**Created:** ${formatDateTime(site.created_at)} (${formatRelativeTime(site.created_at)})\n`
				
				if (site.link_url) {
					markdown += `**Link URL:** ${site.link_url}\n`
				}
				
				// Project info if available
				if (project) {
					markdown += `\n## Project Information\n\n`
					if (project.title) {
						markdown += `**Project Title:** ${project.title}\n`
					}
					markdown += `**Project ID:** ${project.id}\n`
					markdown += `**Visibility:** ${project.visibility}\n`
					markdown += `**Updated:** ${formatDateTime(project.updated_at)}\n`
				}
				
				// Lore/attachments info
				if (site.lore?.attachments && site.lore.attachments.length > 0) {
					markdown += `\n## Attachments\n\n`
					site.lore.attachments.forEach((attachment, index) => {
						markdown += `${index + 1}. **${attachment.filename || attachment.id}**\n`
						markdown += `   - Type: ${attachment.mediaType}\n`
						if (attachment.description) {
							markdown += `   - Description: ${attachment.description}\n`
						}
						markdown += `   - Use Vision: ${attachment.useVision ? "Yes" : "No"}\n\n`
					})
				}
				
				markdown += `\n**Live Site URL:** https://websim.ai/c/${site.id}\n`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get site details: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching site details")
			}
		},
	)

	// Tool: Get Site by Username and Slug
	server.tool(
		"get_site_by_username_slug",
		"Get site details using the owner's username and site slug. Perfect for 'Show me @username/slug' or 'Tell me about [username]/[slug]' questions.",
		{
			username: z.string().describe("The username of the site owner"),
			slug: z.string().describe("The site slug/identifier"),
		},
		async ({ username, slug }) => {
			try {
				const params = { include: "session" }
				const data = await websimApiRequest<{ site: WebSimSite; project: any; project_revision: any }>(`/sites/${username}/${slug}`, params)
				const { site, project } = data

				let markdown = `# WebSim Site Details\n\n`
				markdown += `**Owner:** [${username}](https://websim.ai/@${username})\n`
				markdown += `**Site ID:** ${site.id}\n`
				markdown += `**Slug:** ${slug}\n`
				markdown += `**Title:** ${site.title || "Untitled Site"}\n`
				
				if (site.model) {
					markdown += `**Model:** ${site.model}\n`
				}
				
				markdown += `**State:** ${site.state}\n`
				markdown += `**Created:** ${formatDateTime(site.created_at)} (${formatRelativeTime(site.created_at)})\n`
				
				if (site.link_url) {
					markdown += `**Link URL:** ${site.link_url}\n`
				}
				
				// Project info if available
				if (project) {
					markdown += `\n## Project Information\n\n`
					if (project.title) {
						markdown += `**Project Title:** ${project.title}\n`
					}
					markdown += `**Project ID:** ${project.id}\n`
					markdown += `**Visibility:** ${project.visibility}\n`
					markdown += `**Updated:** ${formatDateTime(project.updated_at)}\n`
				}
				
				markdown += `\n**Live Site URL:** https://websim.ai/c/${site.id}\n`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get site by username/slug: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching site")
			}
		},
	)

	// Tool: Get User Profile
	server.tool(
		"get_user_profile",
		"Get detailed information about a WebSim user by username or ID. Perfect for 'Show me user [username]' or 'Tell me about @[username]' questions.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
		},
		async ({ username_or_id }) => {
			try {
				const data = await websimApiRequest<{ user: WebSimUser }>(`/users/${username_or_id}`)
				const user = data.user

				let markdown = `# WebSim User Profile\n\n`
				markdown += `**Username:** ${user.username || "N/A"}\n`
				markdown += `**User ID:** ${user.id}\n`
				markdown += `**Created:** ${formatDateTime(user.created_at)} (${formatRelativeTime(user.created_at)})\n`
				
				if (user.description) {
					markdown += `**Description:** ${user.description}\n`
				}
				
				if (user.twitter) {
					markdown += `**Twitter:** ${user.twitter}\n`
				}
				
				if (user.discord) {
					markdown += `**Discord:** ${user.discord}\n`
				}
				
				if (user.followed_at) {
					markdown += `**Followed:** ${formatDateTime(user.followed_at)} (${formatRelativeTime(user.followed_at)})\n`
				}
				
				markdown += `\n**Profile URL:** https://websim.ai/@${user.username}`

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user profile: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user profile")
			}
		},
	)

	// Tool: Get User Bookmarks
	server.tool(
		"get_user_bookmarks",
		"Get the latest bookmarks created by a specific WebSim user. Perfect for 'Show me [username]'s bookmarks' or 'What has @[username] bookmarked?' questions. Supports pagination.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
			limit: z.number().min(1).max(100).default(20).describe("Number of bookmarks to return (1-100, default: 20)"),
		},
		async ({ username_or_id, limit }) => {
			try {
				const params = { first: limit }
				const data = await websimApiRequest<{ bookmarks: ApiResponse<Array<{ cursor: string; bookmark: WebSimBookmark; site: WebSimSite; project: any; project_revision: any }>> }>(`/users/${username_or_id}/bookmarks`, params)
				const bookmarksData = data.bookmarks

				let markdown = `# Bookmarks by ${username_or_id}\n\n`
				markdown += `Showing ${bookmarksData.data.length} bookmarks\n\n`

				bookmarksData.data.forEach((item, index) => {
					const bookmark = item.bookmark
					const site = item.site
					markdown += `## ${index + 1}. ${bookmark.title}\n\n`
					markdown += `**Bookmark ID:** ${bookmark.id}\n`
					markdown += `**Site ID:** ${site.id}\n`
					markdown += `**Visibility:** ${bookmark.visibility}\n`
					markdown += `**Created:** ${formatDateTime(bookmark.created_at)} (${formatRelativeTime(bookmark.created_at)})\n`
					
					if (bookmark.slug && bookmark.owner?.username) {
						markdown += `**Bookmark URL:** https://websim.ai/${bookmark.owner.username}/${bookmark.slug}\n`
					}
					
					markdown += `**Live Site:** https://websim.ai/c/${site.id}\n\n`
					markdown += "---\n\n"
				})

				if (bookmarksData.meta.has_next_page) {
					markdown += `*More bookmarks available. Use limit ${limit + 20} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user bookmarks: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user bookmarks")
			}
		},
	)

	// Tool: Get Following Bookmarks
	server.tool(
		"get_following_bookmarks",
		"Get bookmarks from users that a specific user is following. Perfect for 'Show me what [username]'s follows are posting' or 'What are @[username]'s following bookmarking?' questions.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
			limit: z.number().min(1).max(100).default(20).describe("Number of bookmarks to return (1-100, default: 20)"),
		},
		async ({ username_or_id, limit }) => {
			try {
				const params = { first: limit }
				const data = await websimApiRequest<{ bookmarks: ApiResponse<Array<{ cursor: string; bookmark: WebSimBookmark; site: WebSimSite; project: any; project_revision: any }>> }>(`/users/${username_or_id}/following/bookmarks`, params)
				const bookmarksData = data.bookmarks

				let markdown = `# Following Bookmarks for ${username_or_id}\n\n`
				markdown += `Showing ${bookmarksData.data.length} bookmarks from followed users\n\n`

				bookmarksData.data.forEach((item, index) => {
					const bookmark = item.bookmark
					const site = item.site
					markdown += `## ${index + 1}. ${bookmark.title}\n\n`
					markdown += `**Bookmark ID:** ${bookmark.id}\n`
					markdown += `**Site ID:** ${site.id}\n`
					
					if (bookmark.owner?.username) {
						markdown += `**By:** [${bookmark.owner.username}](https://websim.ai/@${bookmark.owner.username})\n`
					}
					
					markdown += `**Visibility:** ${bookmark.visibility}\n`
					markdown += `**Created:** ${formatDateTime(bookmark.created_at)} (${formatRelativeTime(bookmark.created_at)})\n`
					
					if (bookmark.slug && bookmark.owner?.username) {
						markdown += `**Bookmark URL:** https://websim.ai/${bookmark.owner.username}/${bookmark.slug}\n`
					}
					
					markdown += `**Live Site:** https://websim.ai/c/${site.id}\n\n`
					markdown += "---\n\n"
				})

				if (bookmarksData.meta.has_next_page) {
					markdown += `*More bookmarks available. Use limit ${limit + 20} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get following bookmarks: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching following bookmarks")
			}
		},
	)

	// Tool: Get User Following
	server.tool(
		"get_user_following",
		"Get the list of users that a specific WebSim user is following. Perfect for 'Who is [username] following?' or 'Show me @[username]'s following list' questions.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
			limit: z.number().min(1).max(100).default(20).describe("Number of users to return (1-100, default: 20)"),
		},
		async ({ username_or_id, limit }) => {
			try {
				const params = { first: limit }
				const data = await websimApiRequest<{ following: ApiResponse<Array<{ cursor: string; follow: WebSimFollow }>> }>(`/users/${username_or_id}/following`, params)
				const followingData = data.following

				let markdown = `# Users Following by ${username_or_id}\n\n`
				markdown += `Showing ${followingData.data.length} users being followed\n\n`

				followingData.data.forEach((item, index) => {
					const follow = item.follow
					const user = follow.user
					markdown += `## ${index + 1}. ${user.username || "N/A"}\n\n`
					markdown += `**User ID:** ${user.id}\n`
					markdown += `**Username:** ${user.username || "N/A"}\n`
					
					if (user.description) {
						markdown += `**Description:** ${user.description}\n`
					}
					
					if (user.twitter) {
						markdown += `**Twitter:** ${user.twitter}\n`
					}
					
					if (user.discord) {
						markdown += `**Discord:** ${user.discord}\n`
					}
					
					markdown += `**Followed Since:** ${formatDateTime(follow.created_at)} (${formatRelativeTime(follow.created_at)})\n`
					markdown += `**Profile:** https://websim.ai/@${user.username}\n\n`
					markdown += "---\n\n"
				})

				if (followingData.meta.has_next_page) {
					markdown += `*More users available. Use limit ${limit + 20} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user following: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user following")
			}
		},
	)

	// Tool: Get User Followers
	server.tool(
		"get_user_followers",
		"Get the list of followers for a specific WebSim user. Perfect for 'Who follows [username]?' or 'Show me @[username]'s followers' questions.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
			limit: z.number().min(1).max(100).default(20).describe("Number of followers to return (1-100, default: 20)"),
		},
		async ({ username_or_id, limit }) => {
			try {
				const params = { first: limit }
				const data = await websimApiRequest<{ followers: ApiResponse<Array<{ cursor: string; follow: WebSimFollow }>> }>(`/users/${username_or_id}/followers`, params)
				const followersData = data.followers

				let markdown = `# Followers of ${username_or_id}\n\n`
				markdown += `Showing ${followersData.data.length} followers\n\n`

				followersData.data.forEach((item, index) => {
					const follow = item.follow
					const user = follow.user
					markdown += `## ${index + 1}. ${user.username || "N/A"}\n\n`
					markdown += `**User ID:** ${user.id}\n`
					markdown += `**Username:** ${user.username || "N/A"}\n`
					
					if (user.description) {
						markdown += `**Description:** ${user.description}\n`
					}
					
					if (user.twitter) {
						markdown += `**Twitter:** ${user.twitter}\n`
					}
					
					if (user.discord) {
						markdown += `**Discord:** ${user.discord}\n`
					}
					
					markdown += `**Following Since:** ${formatDateTime(follow.created_at)} (${formatRelativeTime(follow.created_at)})\n`
					markdown += `**Profile:** https://websim.ai/@${user.username}\n\n`
					markdown += "---\n\n"
				})

				if (followersData.meta.has_next_page) {
					markdown += `*More followers available. Use limit ${limit + 20} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user followers: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user followers")
			}
		},
	)

	// Tool: Get User Likes
	server.tool(
		"get_user_likes",
		"Get the list of sites that a specific WebSim user has liked. Perfect for 'What has [username] liked?' or 'Show me @[username]'s liked sites' questions.",
		{
			username_or_id: z.string().describe("The username or ID of the WebSim user"),
			limit: z.number().min(1).max(100).default(20).describe("Number of liked sites to return (1-100, default: 20)"),
		},
		async ({ username_or_id, limit }) => {
			try {
				const params = { first: limit }
				const data = await websimApiRequest<{ likes: ApiResponse<Array<{ cursor: string; like: WebSimLike; site: WebSimSite }>> }>(`/users/${username_or_id}/likes`, params)
				const likesData = data.likes

				let markdown = `# Sites Liked by ${username_or_id}\n\n`
				markdown += `Showing ${likesData.data.length} liked sites\n\n`

				likesData.data.forEach((item, index) => {
					const like = item.like
					const site = item.site
					markdown += `## ${index + 1}. ${site.title || "Untitled Site"}\n\n`
					markdown += `**Site ID:** ${site.id}\n`
					
					if (site.owner?.username) {
						markdown += `**Owner:** [${site.owner.username}](https://websim.ai/@${site.owner.username})\n`
					}
					
					if (site.model) {
						markdown += `**Model:** ${site.model}\n`
					}
					
					markdown += `**State:** ${site.state}\n`
					markdown += `**Liked:** ${formatDateTime(like.created_at)} (${formatRelativeTime(like.created_at)})\n`
					markdown += `**Live Site:** https://websim.ai/c/${site.id}\n\n`
					markdown += "---\n\n"
				})

				if (likesData.meta.has_next_page) {
					markdown += `*More liked sites available. Use limit ${limit + 20} to see more.*`
				}

				return markdown
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new Error(`Failed to get user likes: ${error.message}`)
				}
				throw new Error("An unexpected error occurred while fetching user likes")
			}
		},
	)

	return server
}
