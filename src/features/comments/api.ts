import { apiClient } from '@/shared/api/client'
import { Comment, CreateCommentRequest } from './types'

export const commentsApi = {
    getPostComments: async (postId: number, sortBy?: 'newest' | 'oldest' | 'popular'): Promise<Comment[]> => {
        const params: Record<string, string> = {}
        if (sortBy) params.sortBy = sortBy
        return apiClient.get<Comment[]>(`/posts/${postId}/comments`, { params })
    },

    createComment: async (data: CreateCommentRequest): Promise<Comment> => {
        return apiClient.post<Comment>('/comments', data)
    },

    updateComment: async (id: number, data: { content: string }): Promise<Comment> => {
        return apiClient.put<Comment>(`/comments/${id}`, data)
    },

    deleteComment: async (id: number): Promise<void> => {
        return apiClient.delete(`/comments/${id}`)
    },

    likeComment: async (id: number, shouldLike: boolean): Promise<{ liked: boolean; likesCount: number }> => {
        return shouldLike
            ? apiClient.post(`/comments/${id}/like`, {})
            : apiClient.delete(`/comments/${id}/like`)
    },

    toggleLikeComment: async (id: number, shouldLike: boolean): Promise<{ liked: boolean; likesCount: number }> => {
        return shouldLike
            ? apiClient.post(`/comments/${id}/like`, {})
            : apiClient.delete(`/comments/${id}/like`)
    },
}
