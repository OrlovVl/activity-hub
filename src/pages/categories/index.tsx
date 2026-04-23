import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaChevronDown, FaChevronRight, FaStar, FaRegStar, FaSearch, FaPlus } from 'react-icons/fa'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@features/categories/api'
import { postsApi } from '@features/posts/api'
import { Subcategory } from '@features/categories/types'
import { Post } from '@features/posts/types'
import { useAuth } from '@/app/providers/auth-provider'
import { cn } from '@/shared/utils/helpers'

// Цвета для главных категорий
const MAIN_CATEGORY_COLORS: Record<number, string> = {
    1: '#a16207',
    2: '#0ea5e9',
    3: '#8b5cf6',
    4: '#10b981',
    5: '#ef4444',
    6: '#ec4899',
}

const MAIN_CATEGORY_ICONS: Record<number, string> = {
    1: '🚗',
    2: '🌊',
    3: '✈️',
    4: '🥾',
    5: '⚡',
    6: '🎵',
}

// Модальное окно для предложения подкатегории
function SuggestSubcategoryModal({ 
    onClose, 
    onSuggest 
}: { 
    onClose: () => void
    onSuggest: (name: string, description: string) => Promise<void>
}) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            setIsSubmitting(true)
            await onSuggest(name.trim(), description.trim())
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-stone-800 rounded-xl p-6 w-full max-w-md m-4">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Предложить подкатегорию
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Название *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Введите название подкатегории"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Описание
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Краткое описание подкатегории"
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg transition-colors bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !name.trim()}>
                            Предложить
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function getMainCategoryColor(subcategory: Subcategory): string {
    return MAIN_CATEGORY_COLORS[subcategory.mainCategoryId] || '#6b7280'
}

function getMainCategoryIcon(subcategory: Subcategory): string {
    return MAIN_CATEGORY_ICONS[subcategory.mainCategoryId] || '📁'
}

export function CategoriesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [showSuggestModal, setShowSuggestModal] = useState(false)
    const [suggestMainCategoryId, setSuggestMainCategoryId] = useState<number>(1)

    // Получаем главную категорию из URL
    const mainCategoryIdFromUrl = searchParams.get('mainCat')
        ? parseInt(searchParams.get('mainCat')!)
        : undefined

    const { data: mainCategories } = useQuery({
        queryKey: ['mainCategories'],
        queryFn: () => categoriesApi.getMainCategories()
    })

    const { data: subcategoriesData } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories({ showAll: true })
    })

    const { data: postsData } = useQuery({
        queryKey: ['posts', selectedSubcategory?.id],
        queryFn: () => postsApi.getPosts({ subcategoryId: selectedSubcategory!.id, limit: 100 }),
        enabled: selectedSubcategory !== null
    })

    const suggestMutation = useMutation({
        mutationFn: (data: { name: string; description: string; mainCategoryId: number }) => 
            categoriesApi.createSubcategory({
                name: data.name,
                description: data.description,
                mainCategoryId: data.mainCategoryId,
                tags: []
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subcategories'] })
            setShowSuggestModal(false)
        }
    })

    const allSubcategories = subcategoriesData || []
    const allMainCategories = mainCategories || []

    const filteredSubcategories = allSubcategories.filter(sc =>
        !searchQuery ||
        sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const groupedByMainCategory = allMainCategories
        .map(mainCat => ({
            mainCategory: mainCat,
            subcategories: filteredSubcategories.filter(sc => sc.mainCategoryId === mainCat.id)
        }))
        .filter(item => item.subcategories.length > 0)

    // Если выбранная главная категория из URL и она не в сгруппированных, добавляем её
    if (mainCategoryIdFromUrl) {
        const mainCat = allMainCategories.find(c => c.id === mainCategoryIdFromUrl)
        if (mainCat && !groupedByMainCategory.find(g => g.mainCategory.id === mainCat.id)) {
            const subs = filteredSubcategories.filter(sc => sc.mainCategoryId === mainCat.id)
            if (subs.length > 0) {
                groupedByMainCategory.unshift({ mainCategory: mainCat, subcategories: subs })
            }
        }
    }

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
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
        } catch (err) {
            console.error('Failed to toggle favorite:', err)
        }
    }

    const handleSuggestClick = (mainCatId: number) => {
        setSuggestMainCategoryId(mainCatId)
        setShowSuggestModal(true)
    }

    const handleSuggestSubmit = async (name: string, description: string) => {
        suggestMutation.mutate({ name, description, mainCategoryId: suggestMainCategoryId })
    }

    // Subcategory posts view
    if (selectedSubcategory) {
        const posts = postsData?.posts || []
        const color = getMainCategoryColor(selectedSubcategory)
        const icon = getMainCategoryIcon(selectedSubcategory)

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
                                {icon} {allMainCategories.find(c => c.id === selectedSubcategory.mainCategoryId)?.name}
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

            {/* Search and Suggest */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                            <Input
                                placeholder="Поиск подкатегорий, тегов, описаний..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {user && (
                            <Button
                                onClick={() => handleSuggestClick(mainCategories?.[0]?.id || 1)}
                                variant="outline"
                            >
                                <FaPlus className="mr-2" />
                                Предложить подкатегорию
                            </Button>
                        )}
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
                                    style={{ backgroundColor: `${MAIN_CATEGORY_COLORS[mainCategory.id] || '#a16207'}20` }}
                                >
                                    <span
                                        style={{ color: MAIN_CATEGORY_COLORS[mainCategory.id] || '#a16207' }}
                                    >
                                        {MAIN_CATEGORY_ICONS[mainCategory.id] || '📁'}
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
                            {allMainCategories.length}
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

            {/* Suggest Subcategory Modal */}
            {showSuggestModal && (
                <SuggestSubcategoryModal
                    onClose={() => setShowSuggestModal(false)}
                    onSuggest={handleSuggestSubmit}
                />
            )}
        </div>
    )
}

export default CategoriesPage