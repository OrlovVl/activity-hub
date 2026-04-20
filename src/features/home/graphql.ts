import { graphqlApi } from '@/shared/api/graphql'

// GraphQL types
export interface GraphQLUser {
    id: number
    username: string
    email: string
    role: 'user' | 'moderator' | 'admin'
    createdAt: string
    favoriteSubcategoryIds: number[]
    stats?: {
        postsCount: number
        followersCount: number
        followingCount: number
        likesCount: number
    }
}

export interface GraphQLPost {
    id: number
    title: string
    content: string
    createdAt: string
    likesCount: number
    author: GraphQLUser
}

export interface GraphQLCategory {
    id: number
    name: string
    description?: string
    icon?: string
}

export interface HomePageData {
    categories: GraphQLCategory[]
    me: GraphQLUser | null
    trendingPosts: GraphQLPost[]
}

// GraphQL queries
const GET_HOME_PAGE_QUERY = `
    query getHomePage {
        getHomePage {
            categories {
                id
                name
                description
                icon
            }
            me {
                id
                username
                email
                role
                createdAt
                favoriteSubcategoryIds
                stats {
                    postsCount
                    followersCount
                    followingCount
                    likesCount
                }
            }
            trendingPosts {
                id
                title
                content
                createdAt
                likesCount
                author {
                    id
                    username
                    email
                }
            }
        }
    }
`

const GET_POSTS_QUERY = `
    query posts($subcategoryId: Int, $limit: Int) {
        posts(subcategoryId: $subcategoryId, limit: $limit) {
            id
            title
            content
            createdAt
            likesCount
            author {
                id
                username
            }
        }
    }
`

const GET_POST_QUERY = `
    query post($id: Int!) {
        post(id: $id) {
            id
            title
            content
            createdAt
            likesCount
            author {
                id
                username
            }
        }
    }
`

export const homeGraphQL = {
    getHomePage: async (): Promise<HomePageData> => {
        return graphqlApi.query<HomePageData>(GET_HOME_PAGE_QUERY)
    },

    getPosts: async (params?: { subcategoryId?: number; limit?: number }): Promise<{ posts: GraphQLPost[]; total: number }> => {
        const variables: Record<string, unknown> = {}
        if (params?.subcategoryId) variables.subcategoryId = params.subcategoryId
        if (params?.limit) variables.limit = params.limit

        const result = await graphqlApi.query<{ posts: GraphQLPost[] }>(GET_POSTS_QUERY, variables)
        return { posts: result.posts, total: result.posts.length }
    },

    getPost: async (id: number): Promise<GraphQLPost> => {
        return graphqlApi.query<GraphQLPost>(GET_POST_QUERY, { id })
    },
}