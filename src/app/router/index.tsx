import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../providers/auth-provider'

// Lazy-loaded pages
const HomePage = React.lazy(() => import('@pages/home').then(m => ({ default: m.HomePage })))
const LoginPage = React.lazy(() => import('@pages/auth/login').then(m => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('@pages/auth/register').then(m => ({ default: m.RegisterPage })))
const ProfilePage = React.lazy(() => import('@pages/profile').then(m => ({ default: m.ProfilePage })))
const CategoriesPage = React.lazy(() => import('@pages/categories').then(m => ({ default: m.CategoriesPage })))
const PostsPage = React.lazy(() => import('@pages/posts').then(m => ({ default: m.PostsPage })))
const CreatePostPage = React.lazy(() => import('@pages/posts/create').then(m => ({ default: m.CreatePostPage })))
const ViewPostPage = React.lazy(() => import('@pages/posts/view').then(m => ({ default: m.ViewPostPage })))
const EditPostPage = React.lazy(() => import('@pages/posts/edit').then(m => ({ default: m.EditPostPage })))
const SearchPage = React.lazy(() => import('@pages/search').then(m => ({ default: m.SearchPage })))
const SettingsPage = React.lazy(() => import('@pages/profile/settings').then(m => ({ default: m.SettingsPage })))
const AdminPage = React.lazy(() => import('@pages/admin').then(m => ({ default: m.AdminPage })))

// Loading component
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
    )
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return <LoadingFallback />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

// Public route component (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return <LoadingFallback />
    }

    if (user) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

export function AppRouter() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/posts/:id" element={<ViewPostPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
                <Route path="/posts/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    )
}