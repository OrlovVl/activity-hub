import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@features/auth/types'
import { authApi } from '@features/auth/api'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, username: string) => Promise<void>
    logout: () => Promise<void>
    updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_STORAGE_KEY = 'auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        // Восстанавливаем пользователя из localStorage при инициализации
        const saved = localStorage.getItem(USER_STORAGE_KEY)
        return saved ? JSON.parse(saved) : null
    })
    const [isLoading, setIsLoading] = useState(true)

    const saveUser = (userData: User | null) => {
        setUser(userData)
        if (userData) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
        } else {
            localStorage.removeItem(USER_STORAGE_KEY)
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            // Если пользователь уже сохранен, не делаем запрос
            if (user) {
                setIsLoading(false)
                return
            }
            try {
                const userData = await authApi.getCurrentUser()
                saveUser(userData)
            } catch {
                saveUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        const userData = await authApi.login(email, password)
        saveUser(userData)
    }

    const register = async (email: string, password: string, username: string) => {
        const userData = await authApi.register(email, password, username)
        saveUser(userData)
    }

    const logout = async () => {
        await authApi.logout()
        saveUser(null)
    }

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
