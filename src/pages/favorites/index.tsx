import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { Card, CardContent } from '@/shared/ui/card'
import { PostCard } from '@/features/posts/components/post-card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '@/features/posts/api'
import { usersApi } from '@/features/users/api'
import { useAuth } from '@/app/providers/auth-provider'

export function FavoritesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [activeFilter, setActiveFilter] = useState<'bookmarks' | 'favorites'>('bookmarks')

    // Закладки
    const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => postsApi.getBookmarks({ limit: 50 }),
        enabled: !!user
    })

    const bookmarkMutation = useMutation({
        mutationFn: (postId: number) => postsApi.toggleBookmark(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
        }
    })

    // Избранные подкатегории
    const { data: favoritesData, isLoading: favoritesLoading } = useQuery({
        queryKey: ['favoriteSubcategories'],
        queryFn: () => usersApi.getFavoriteSubcategories(),
        enabled: !!user
    })

    const isLoading = bookmarksLoading || favoritesLoading



    const handlePostClick = (postId: number) => {
        navigate(`/posts/${postId}`)
    }

    const handleBookmarkToggle = (postId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        bookmarkMutation.mutate(postId)
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Пожалуйста, войдите в систему
                </h1>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                    Для доступа к закладкам необходимо авторизоваться
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                    Войти
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        Избранное
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400 mt-1">
                        Ваши закладки и избранные подкатегории
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveFilter('bookmarks')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeFilter === 'bookmarks'
                                ? 'bg-amber-500 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                    >
                        <FaRegStar className="inline mr-2" />
                        Закладки
                    </button>
                    <button
                        onClick={() => setActiveFilter('favorites')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeFilter === 'favorites'
                                ? 'bg-amber-500 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                    >
                        <FaStar className="inline mr-2" />
                        Подкатегории
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
            ) : activeFilter === 'bookmarks' ? (
                <div>
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                        Посты в закладках ({bookmarksData?.total || 0})
                    </h2>
                    {bookmarksData?.posts.length ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {bookmarksData.posts.map(post => (
                                <div key={post.id} className="relative group">
                                    <button
                                        onClick={(e) => handleBookmarkToggle(post.id, e)}
                                        className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-stone-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FaStar className="w-4 h-4 text-amber-500" />
                                    </button>
                                    <PostCard
                                        post={post}
                                        author={{
                                            id: post.authorId,
                                            username: String(post.authorId)
                                        }}
                                        subcategory={{
                                            id: post.subcategoryId,
                                            name: 'Категория',
                                            color: '#a16207'
                                        }}
                                        onPostClick={() => handlePostClick(post.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-stone-500 dark:text-stone-400 py-12">
                            <FaRegStar className="w-12 h-12 mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                            <p className="text-lg">У вас пока нет закладок</p>
                            <p className="text-sm mt-2">Добавляйте посты в закладки нажав на звёздочку</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                        Избранные подкатегории ({favoritesData?.length || 0})
                    </h2>
                    {favoritesData?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {favoritesData.map((sub: any) => (
                                <Card
                                    key={sub.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => navigate(`/categories?sub=${sub.id}`)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaStar className="w-4 h-4 text-amber-500" />
                                            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                                                {sub.name}
                                            </h3>
                                        </div>
                                        {sub.description && (
                                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                                {sub.description}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-stone-500 dark:text-stone-400 py-12">
                            <FaStar className="w-12 h-12 mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                            <p className="text-lg">У вас пока нет избранных подкатегорий</p>
                            <p className="text-sm mt-2">Добавляйте подкатегории в избранное на странице категорий</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default FavoritesPage