import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaChevronDown, FaChevronRight, FaStar, FaRegStar, FaSearch } from 'react-icons/fa'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@features/categories/api'
import { postsApi } from '@features/posts/api'
import { Subcategory } from '@features/categories/types'
import { Post } from '@features/posts/types'
import { useAuth } from '@/app/providers/auth-provider'
import { MAIN_CATEGORIES } from '@/shared/utils/constants'
import { cn } from '@/shared/utils/helpers'

function getMainCategoryInfo(subcategory: Subcategory) {
    const mainCat = MAIN_CATEGORIES.find(m => m.id === subcategory.mainCategoryId)
    return mainCat || MAIN_CATEGORIES[0]
}

function getMainCategoryColor(subcategory: Subcategory): string {
    const mainCat = getMainCategoryInfo(subcategory)
    const colorMap: Record<string, string> = {
        'ground-travel': '#a16207',
        'water-activities': '#0ea5e9',
        'air-travel': '#8b5cf6',
        'active-leisure': '#10b981',
        'extreme': '#ef4444',
        'music-creative': '#ec4899',
    }
    return colorMap[mainCat.iconKey] || '#6b7280'
}

export function CategoriesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')

    const { data: subcategoriesData } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    const { data: postsData } = useQuery({
        queryKey: ['posts', selectedSubcategory?.id],
        queryFn: () => postsApi.getPosts({ subcategoryId: selectedSubcategory!.id, limit: 100 }),
        enabled: selectedSubcategory !== null
    })

    const allSubcategories = subcategoriesData || []

    const filteredSubcategories = allSubcategories.filter(sc =>
        !searchQuery ||
        sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const groupedByMainCategory = MAIN_CATEGORIES.map(mainCat => ({
        mainCategory: mainCat,
        subcategories: filteredSubcategories.filter(sc => sc.mainCategoryId === mainCat.id)
    })).filter(item => item.subcategories.length > 0)

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }
            return next
        })
    }

    const handleSubcategoryClick = (subcategory: Subcategory) => {
        setSelectedSubcategory(subcategory)
    }

    const handlePostClick = (post: Post) => {
        navigate(`/posts/${post.id}`)
    }

    const handleBackToCategories = () => {
        setSelectedSubcategory(null)
        setSearchQuery('')
    }

    const isFavorite = (subcategoryId: number): boolean => {
        return user?.favoriteSubcategoryIds?.includes(subcategoryId) || false
    }

    const handleFavoriteToggle = async (subcategoryId: number) => {
        if (!user) return
        try {
            if (isFavorite(subcategoryId)) {
                await categoriesApi.removeFavorite(subcategoryId)
            } else {
                await categoriesApi.toggleFavorite(subcategoryId)
            }
            window.location.reload()
        } catch (err) {
            console.error('Failed to toggle favorite:', err)
        }
    }

    // Subcategory posts view
    if (selectedSubcategory) {
        const posts = postsData?.posts || []
        const mainCat = getMainCategoryInfo(selectedSubcategory)
        const color = getMainCategoryColor(selectedSubcategory)

        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={handleBackToCategories}>
                        ← Назад к категориям
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                            {selectedSubcategory.name}
                        </h1>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            {selectedSubcategory.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-stone-500">
                                {mainCat.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                        Посты в категории
                    </h2>
                    <span className="text-sm text-stone-500">
                        {posts.length} постов
                    </span>
                </div>

                {posts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-stone-500 dark:text-stone-400">
                                Пока нет постов в этой категории
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {posts.map(post => (
                            <Card
                                key={post.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => handlePostClick(post)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg line-clamp-2">
                                        {post.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 mb-4">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-stone-500">
                                        <span>❤️ {post.likesCount}</span>
                                        <span>💬 {post.commentsCount}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Main categories view
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        Категории
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400 mt-1">
                        Исследуйте активности по категориям и подкатегориям
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                        <Input
                            placeholder="Поиск подкатегорий, тегов, описаний..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Main Categories */}
            <div className="space-y-4">
                {groupedByMainCategory.map(({ mainCategory, subcategories }) => (
                    <Card key={mainCategory.id} className="overflow-hidden">
                        <CardHeader
                            className="cursor-pointer pb-4"
                            onClick={() => toggleCategory(mainCategory.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: `${mainCategory.color}20` }}
                                >
                                    <span
                                        style={{ color: mainCategory.color }}
                                    >
                                        {mainCategory.iconKey === 'ground-travel' && '🚗'}
                                        {mainCategory.iconKey === 'water-activities' && '🌊'}
                                        {mainCategory.iconKey === 'air-travel' && '✈️'}
                                        {mainCategory.iconKey === 'active-leisure' && '🥾'}
                                        {mainCategory.iconKey === 'extreme' && '⚡'}
                                        {mainCategory.iconKey === 'music-creative' && '🎵'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl text-stone-900 dark:text-stone-100">
                                                {mainCategory.name}
                                            </CardTitle>
                                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                                                {mainCategory.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-stone-500">
                                            <span>{subcategories.length} подкатегорий</span>
                                            {expandedCategories.has(mainCategory.id) ? (
                                                <FaChevronDown className="w-5 h-5" />
                                            ) : (
                                                <FaChevronRight className="w-5 h-5" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        {expandedCategories.has(mainCategory.id) && (
                            <CardContent className="pt-0 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-16">
                                    {subcategories.map(subcategory => (
                                        <div
                                            key={subcategory.id}
                                            className={cn(
                                                'p-3 rounded-lg border cursor-pointer transition-colors',
                                                'hover:bg-stone-50 dark:hover:bg-stone-800/50 border-stone-200 dark:border-stone-700'
                                            )}
                                            onClick={() => handleSubcategoryClick(subcategory)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{
                                                                backgroundColor: subcategory.isApproved
                                                                    ? '#10b981'
                                                                    : '#f59e0b'
                                                            }}
                                                        />
                                                        <h4 className="font-medium text-stone-900 dark:text-stone-100">
                                                            {subcategory.name}
                                                        </h4>
                                                    </div>
                                                    {subcategory.description && (
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                                            {subcategory.description}
                                                        </p>
                                                    )}
                                                    {subcategory.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {subcategory.tags.slice(0, 3).map(tag => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {user && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleFavoriteToggle(subcategory.id)
                                                        }}
                                                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                                                    >
                                                        {isFavorite(subcategory.id) ? (
                                                            <FaStar className="w-4 h-4 text-amber-500" />
                                                        ) : (
                                                            <FaRegStar className="w-4 h-4 text-stone-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {/* Empty state */}
            {groupedByMainCategory.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-stone-500 dark:text-stone-400 text-lg">
                            Категории не найдены
                        </p>
                        <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
                            Попробуйте изменить параметры поиска
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {groupedByMainCategory.length}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Активных категорий
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {filteredSubcategories.length}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Подкатегорий
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {filteredSubcategories.filter(s => s.isApproved).length}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Одобренных
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default CategoriesPage