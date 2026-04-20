import { useState } from 'react'
import { FaSearch, FaFilter, FaHistory, FaTimes, FaFire, FaStar, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { PostCard } from '@features/posts/components/post-card'
import { Avatar } from '@/shared/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@features/posts/api'
import { categoriesApi } from '@features/categories/api'
import { usersApi } from '@/features/users/api'
import { searchApi } from '@/features/search/api'
import { User } from '@/features/users/types'
import { Post } from '@/features/posts/types'

export function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [dateRange, setDateRange] = useState({ from: '', to: '' })
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance')

    const { refetch: search, isFetching } = useQuery({
        queryKey: ['search', searchQuery],
        queryFn: () => searchApi.search(searchQuery),
        enabled: false
    })

    const { data: postsData } = useQuery({
        queryKey: ['posts', 'search'],
        queryFn: () => postsApi.getPosts({ limit: 10 })
    })

    const { data: usersData } = useQuery({
        queryKey: ['users', 'search'],
        queryFn: () => usersApi.getUsers({ limit: 10 })
    })

    const { data: subcategoriesData } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            search()
        }
    }

    const handleTagClick = (tag: string) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag])
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

    const posts = postsData?.posts || []
    const users = usersData?.users || []
    const subcategories = subcategoriesData || []
    const searchHistory: string[] = []
    const popularTags: { tag: string, count: number }[] = []

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
                                disabled={isFetching}
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
                                disabled={isFetching}
                            >
                                <FaFilter className="mr-2" />
                                Фильтры {showFilters ? '↑' : '↓'}
                            </Button>
                            <div className="flex items-center space-x-3">
                                <Button type="submit" loading={isFetching}>
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
                                {/* Sort */}
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
                                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${sortBy === value
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

                                {/* Date Range */}
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

                                {/* Location */}
                                <div>
                                    <label className="flex items-center space-x-3 text-sm text-stone-500 dark:text-stone-500">
                                        <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                                        Локация
                                    </label>
                                    <Input
                                        placeholder="Введите город или регион"
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Search Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Results */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                        Результаты поиска ({posts.length})
                    </h2>

                    <div className="space-y-6">
                        {posts.map((post: Post) => {
                            const author = users.find((author: User) => author.id === post.authorId)
                            const subcategory = subcategories.find(s => s.id === post.subcategoryId)

                            if (!author || !subcategory) return null

                            return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    author={{
                                        id: author.id,
                                        username: author.username,
                                    }}
                                    subcategory={{
                                        id: subcategory.id,
                                        name: subcategory.name,
                                        color: '#a16207'
                                    }}
                                    onCommentClick={() => console.log('Comment clicked')}
                                    onShareClick={() => console.log('Share clicked')}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Search History */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center">
                                <FaHistory className="w-4 h-4 mr-2" />
                                История поиска
                            </h3>
                            <div className="space-y-2">
                                {searchHistory.map((query, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSearchQuery(query)}
                                        className="w-full text-left p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm text-stone-600 dark:text-stone-400"
                                    >
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Popular Tags */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center">
                                <FaFire className="w-4 h-4 mr-2" />
                                Популярные теги
                            </h3>
                            <div className="space-y-3">
                                {popularTags.map(({ tag, count }) => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagClick(tag)}
                                        className="w-full flex items-center justify-between p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
                                    >
                                        <span className="text-stone-700 dark:text-stone-300 group-hover:text-amber-600">
                                            #{tag}
                                        </span>
                                        <span className="text-xs text-stone-500 dark:text-stone-500">
                                            {count.toLocaleString()}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
                                Пользователи
                            </h3>
                            <div className="space-y-4">
                                {users.slice(0, 3).map((user: User) => (
                                    <div key={user.id} className="flex items-center space-x-3">
                                        <Avatar size="sm" fallback={(user.username || 'U').slice(0, 2).toUpperCase()} />
                                        <div className="flex-1">
                                            <p className="font-medium text-stone-900 dark:text-stone-100">
                                                {user.username}
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-stone-500">
                                                {user.id} постов
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            <FaStar className="w-3 h-3 mr-1" />
                                            Подписаться
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default SearchPage