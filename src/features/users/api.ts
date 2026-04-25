import { apiClient } from '@/shared/api/client'
import { User } from './types'
import { Subcategory } from '@/features/categories/types'

export const usersApi = {
    getUsers: async (params?: {
        limit?: number
        offset?: number
        search?: string
    }): Promise<{ users: User[]; total: number }> => {
        const queryParams: Record<string, string> = {}
        if (params?.limit) queryParams.limit = params.limit.toString()
        if (params?.offset) queryParams.offset = params.offset.toString()
        if (params?.search) queryParams.search = params.search

        return apiClient.get<{ users: User[]; total: number }>('/users', { params: queryParams })
    },

    getUser: async (id: number): Promise<User> => {
        return apiClient.get<User>(`/users/${id}`)
    },

    updateUser: async (id: number, data: Partial<User>): Promise<User> => {
        return apiClient.put<User>(`/users/${id}`, data)
    },

    followUser: async (id: number): Promise<{ followed: boolean }> => {
        return apiClient.post(`/users/${id}/follow`, {})
    },

    unfollowUser: async (id: number): Promise<{ followed: boolean }> => {
        return apiClient.delete(`/users/${id}/follow`)
    },

    isFollowing: async (userId: number): Promise<{ isFollowing: boolean }> => {
        return apiClient.get(`/users/me/following/${userId}`)
    },

    getMe: async (): Promise<User & { favoriteSubcategoryIds: number[]; following: number[] }> => {
        return apiClient.get('/users/me')
    },

    getFollowing: async (): Promise<{ following: number[] }> => {
        return apiClient.get('/users/me/following')
    },

    getFavoriteSubcategories: async (): Promise<Subcategory[]> => {
        return apiClient.get<Subcategory[]>('/users/me/favorites/subcategories')
    },

    addFavoriteSubcategory: async (id: number): Promise<Subcategory> => {
        return apiClient.post<Subcategory>(`/users/me/favorites/subcategories/${id}`, {})
    },

    removeFavoriteSubcategory: async (id: number): Promise<void> => {
        return apiClient.delete(`/users/me/favorites/subcategories/${id}`)
    },

    grantAdmin: async (userId: number): Promise<{ message: string; user: User }> => {
        return apiClient.post('/users/admin/grant-admin/' + userId, {})
    },

    revokeAdmin: async (userId: number): Promise<{ message: string; user: User }> => {
        return apiClient.post('/users/admin/revoke-admin/' + userId, {})
    },
}
