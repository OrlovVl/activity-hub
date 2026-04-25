const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

/**
 * Нормализует роль сервера в нижний регистр.
 * Сервер может возвращать 'ADMIN', 'USER' или 'admin', 'user'.
 */
export function normalizeRole(role: string): 'admin' | 'user' {
    return role.toLowerCase() as 'admin' | 'user'
}

async function fetchAPI<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token')

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(error.message || 'Request failed')
    }

    // DELETE может вернуть 204 No Content (пустое тело)
    if (response.status === 204) {
        return null as unknown as T
    }

    return response.json() as T
}

export const apiClient = {
    get: <T>(endpoint: string, config?: { params?: Record<string, string> }): Promise<T> => {
        let url = endpoint
        if (config?.params) {
            const queryString = Object.entries(config.params)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&')
            if (queryString) {
                url += `?${queryString}`
            }
        }
        return fetchAPI(url, { method: 'GET' })
    },

    post: <T>(endpoint: string, data: unknown): Promise<T> =>
        fetchAPI(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data: unknown): Promise<T> =>
        fetchAPI(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    patch: <T>(endpoint: string, data: unknown): Promise<T> =>
        fetchAPI(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string): Promise<T> =>
        fetchAPI(endpoint, { method: 'DELETE' }),
}