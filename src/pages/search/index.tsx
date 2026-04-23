import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaFilter, FaTimes, FaFire, FaCalendar } from 'react-icons/fa'
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
    const [showFilters, setShowFilters] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [dateRange, setDateRange] = useState({ from: '', to: '' })
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance')

    const { data: searchData, isLoading: searchLoading, refetch: performSearch } = useQuery({
        queryKey: ['search', searchQuery, selectedTags, dateRange, sortBy],
        queryFn: () => searchApi.search(searchQuery),
        enabled: false
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            performSearch()
        }
    }

    const removeTag = (tagToRemove: string) => {
        setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
    }

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedTags([])
        setDateRange({ from: '', to: '' })
        setSortBy('relevance')
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
                    <form onSubmit={handleSearch} className="space-y-4">
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

                        {/* Selected Tags */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedTags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm"
                                    >
                                        #{tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 hover:text-red-500"
                                            type="button"
                                        >
                                            <FaTimes className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                disabled={searchLoading}
                            >
                                <FaFilter className="mr-2" />
                                Фильтры {showFilters ? '↑' : '↓'}
                            </Button>
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

                        {/* Filters */}
                        {showFilters && (
                            <div className="pt-4 border-t border-stone-200 dark:border-stone-700 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                        Сортировка
                                    </label>
                                    <div className="flex space-x-2">
                                        {[
                                            { value: 'relevance', label: 'По релевантности', icon: FaSearch },
                                            { value: 'date', label: 'По дате', icon: FaCalendar },
                                            { value: 'popularity', label: 'По популярности', icon: FaFire },
                                        ].map(({ value, label, icon: Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setSortBy(value as any)}
                                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                                    sortBy === value
                                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                            От
                                        </label>
                                        <Input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                            До
                                        </label>
                                        <Input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Search Results */}
            {searchQuery && (
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
                                <p className="text-lg">Ничего не найдено по запросу "{searchQuery}"</p>
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