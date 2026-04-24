import { apiClient } from '@/shared/api/client'
import { MainCategory, Subcategory, CategoryTree } from './types'

export const categoriesApi = {
    getMainCategories: async (): Promise<MainCategory[]> => {
        return apiClient.get<MainCategory[]>('/categories')
    },

    getCategoryTree: async (): Promise<CategoryTree[]> => {
        return apiClient.get<CategoryTree[]>('/categories/tree')
    },

    getSubcategories: async (params?: {
        mainCategoryId?: number
        showAll?: boolean
    }): Promise<Subcategory[]> => {
        const query = new URLSearchParams()
        if (params?.mainCategoryId) query.set('mainCategoryId', params.mainCategoryId.toString())
        if (params?.showAll) query.set('showAll', params.showAll.toString())

        return apiClient.get<Subcategory[]>(`/subcategories?${query}`)
    },

    createSubcategory: async (data: Omit<Subcategory, 'id' | 'createdAt' | 'isApproved'>): Promise<Subcategory> => {
        return apiClient.post<Subcategory>('/subcategories', data)
    },

    approveSubcategory: async (id: number): Promise<Subcategory> => {
        return apiClient.patch<Subcategory>(`/subcategories/${id}/approve`, {})
    },

    updateSubcategory: async (id: number, data: Partial<Subcategory>): Promise<Subcategory> => {
        return apiClient.put<Subcategory>(`/subcategories/${id}`, data)
    },

    deleteSubcategory: async (id: number): Promise<void> => {
        return apiClient.delete(`/subcategories/${id}`)
    },

    toggleFavorite: async (subcategoryId: number): Promise<void> => {
        return apiClient.post(`/users/me/favorites/subcategories/${subcategoryId}`, {})
    },

    removeFavorite: async (subcategoryId: number): Promise<void> => {
        return apiClient.delete(`/users/me/favorites/subcategories/${subcategoryId}`)
    },

    getFavoriteSubcategories: async (): Promise<Subcategory[]> => {
        return apiClient.get<Subcategory[]>('/users/me/favorites/subcategories')
    },
}