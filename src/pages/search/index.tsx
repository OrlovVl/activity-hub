import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { PostCard } from '@features/posts/components/post-card'
import { Avatar } from '@/shared/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/features/search/api'
import type { Post } from '@/features/posts/types'
import type { User } from '@/features/users/types'

export function SearchPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debounce: задержка 500ms перед отправкой запроса
    const debouncedQuery = searchQuery.trim().length >= 2 ? searchQuery.trim() : ''

    const { data: searchData, isLoading: searchLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: () => searchApi.search(debouncedQuery),
        enabled: debouncedQuery.length > 0,
        refetchOnWindowFocus: false,
    })

    // Clear debounce timer on unmount or query change
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        if (searchQuery.trim().length >= 2) {
            debounceTimerRef.current = setTimeout(() => {
                // queryFn will be triggered automatically by react-query
            }, 500)
        }
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [searchQuery])

    const clearFilters = () => {
        setSearchQuery('')
    }

    const handlePostClick = (postId: number) => {
        navigate(`/posts/${postId}`)
    }

    const posts = searchData?.posts || []
    const users = searchData?.users || []
    const subcategories = searchData?.subcategories || []

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div>
                <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                    Поиск
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Найдите посты, пользователей и категории
                </p>
            </div>

            {/* Search Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                            <Input
                                placeholder="Поиск постов, пользователей, тегов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                disabled={searchLoading}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Button type="submit" loading={searchLoading}>
                                    <FaSearch className="mr-2" />
                                    Искать
                                </Button>
                                <Button type="button" variant="ghost" onClick={clearFilters}>
                                    Очистить
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Search Results */}
            {debouncedQuery && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Results */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                            Результаты поиска ({posts.length + users.length + subcategories.length})
                        </h2>

                        {/* Subcategories Results */}
                        {subcategories.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
                                    Подкатегории
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {subcategories.map((sub: any) => (
                                        <Card
                                            key={sub.id}
                                            className="cursor-pointer hover:shadow-lg transition-shadow"
                                            onClick={() => navigate(`/categories?sub=${sub.id}`)}
                                        >
                                            <CardContent className="p-3">
                                                <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                                                    {sub.name}
                                                </p>
                                                {sub.description && (
                                                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                                        {sub.description}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Posts Results */}
                        {posts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
                                    Посты
                                </h3>
                                <div className="space-y-4">
                                    {posts.map((post: Post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            author={{
                                                id: post.authorId,
                                                username: post.authorId.toString()
                                            }}
                                            subcategory={{
                                                id: post.subcategoryId,
                                                name: 'Категория',
                                                color: '#a16207'
                                            }}
                                            onPostClick={() => handlePostClick(post.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users Results */}
                        {users.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
                                    Пользователи
                                </h3>
                                <div className="space-y-4">
                                    {users.map((u: User) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center space-x-3 p-3 bg-white dark:bg-stone-800 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/users/${u.id}`)}
                                        >
                                            <Avatar size="md" fallback={(u.username || 'U').slice(0, 2).toUpperCase()} />
                                            <div className="flex-1">
                                                <p className="font-medium text-stone-900 dark:text-stone-100">
                                                    {u.username}
                                                </p>
                                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {posts.length === 0 && users.length === 0 && subcategories.length === 0 && (
                            <div className="text-center text-stone-500 dark:text-stone-400 py-12">
                                <FaSearch className="w-12 h-12 mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                                <p className="text-lg">Ничего не найдено по запросу "{debouncedQuery}"</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Related subcategories */}
                    {subcategories.length > 0 && (
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
                                        Подкатегории
                                    </h3>
                                    <div className="space-y-3">
                                        {subcategories.map((sub: any) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => navigate(`/categories?sub=${sub.id}`)}
                                                className="w-full flex items-center justify-between p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
                                            >
                                                <span className="text-stone-700 dark:text-stone-300 group-hover:text-amber-600">
                                                    {sub.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchPage