const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql'

interface GraphQLResponse<T> {
    data?: T
    errors?: { message: string }[]
}

export const graphqlApi = {
    query: async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
        const token = localStorage.getItem('token')

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables }),
        })

        if (!response.ok) {
            throw new Error('GraphQL request failed')
        }

        const result: GraphQLResponse<T> = await response.json()

        if (result.errors?.length) {
            throw new Error(result.errors[0].message)
        }

        if (!result.data) {
            throw new Error('No data returned from GraphQL')
        }

        return result.data
    },

    mutate: async <T>(mutation: string, variables?: Record<string, unknown>): Promise<T> => {
        return graphqlApi.query<T>(mutation, variables)
    },
}