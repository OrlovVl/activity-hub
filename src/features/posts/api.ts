import { apiClient } from '@/shared/api/client'
import { Post, CreatePostRequest, UpdatePostRequest } from './types'

export const postsApi = {
    getPosts: async (params?: {
        subcategoryId?: number
        userId?: number
        tag?: string
        limit?: number
        offset?: number
        search?: string
        sortBy?: 'date' | 'popularity'
        dateFrom?: string
        dateTo?: string
        followedByUserId?: number
    }): Promise<{ posts: Post[]; total: number }> => {
        const queryParams: Record<string, string> = {}
        if (params?.subcategoryId) queryParams.subcategoryId = params.subcategoryId.toString()
        if (params?.userId) queryParams.userId = params.userId.toString()
        if (params?.tag) queryParams.tag = params.tag
        if (params?.limit) queryParams.limit = params.limit.toString()
        if (params?.offset) queryParams.offset = params.offset.toString()
        if (params?.search) queryParams.search = params.search
        if (params?.sortBy) queryParams.sortBy = params.sortBy
        if (params?.dateFrom) queryParams.dateFrom = params.dateFrom
        if (params?.dateTo) queryParams.dateTo = params.dateTo
        if (params?.followedByUserId) queryParams.followedByUserId = params.followedByUserId.toString()

        return apiClient.get<{ posts: Post[]; total: number }>('/posts', { params: queryParams })
    },

    getPost: async (id: number): Promise<Post & { isLiked?: boolean; isBookmarked?: boolean }> => {
        return apiClient.get<Post & { isLiked?: boolean; isBookmarked?: boolean }>(`/posts/${id}`)
    },

    createPost: async (data: CreatePostRequest): Promise<Post> => {
        return apiClient.post<Post>('/posts', data)
    },

    updatePost: async (id: number, data: UpdatePostRequest): Promise<Post> => {
        return apiClient.put<Post>(`/posts/${id}`, data)
    },

    deletePost: async (id: number): Promise<void> => {
        return apiClient.delete(`/posts/${id}`)
    },

    likePost: async (id: number): Promise<{ liked: boolean; likesCount: number }> => {
        return apiClient.post(`/posts/${id}/like`, {})
    },

    bookmarkPost: async (id: number): Promise<{ isBookmarked: boolean }> => {
        return apiClient.post(`/users/me/bookmarks/${id}`, {})
    },

    unbookmarkPost: async (id: number): Promise<{ isBookmarked: boolean }> => {
        return apiClient.delete(`/users/me/bookmarks/${id}`)
    },

    toggleBookmark: async (id: number): Promise<{ isBookmarked: boolean }> => {
        // Загружаем текущее состояние, затем переключаем
        const currentBookmarks = await apiClient.get<{ posts: Array<{ id: number }> }>(`/users/me/bookmarks`)
        const isCurrentlyBookmarked = currentBookmarks.posts.some(p => p.id === id)
        if (isCurrentlyBookmarked) {
            return apiClient.delete(`/users/me/bookmarks/${id}`)
        }
        return apiClient.post(`/users/me/bookmarks/${id}`, {})
    },

    getBookmarks: async (params?: {
        limit?: number
        offset?: number
    }): Promise<{ posts: Post[]; total: number }> => {
        const queryParams: Record<string, string> = {}
        if (params?.limit) queryParams.limit = params.limit.toString()
        if (params?.offset) queryParams.offset = params.offset.toString()

        return apiClient.get<{ posts: Post[]; total: number }>('/users/me/bookmarks', { params: queryParams })
    },
}