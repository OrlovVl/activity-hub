const API_BASE = 'http://localhost:3000/api'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
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

    return response.json()
}

export const apiClient = {
    get: <T>(endpoint: string): Promise<T> =>
        fetchAPI(endpoint, { method: 'GET' }),

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