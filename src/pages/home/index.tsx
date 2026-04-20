import { PostCard } from '@features/posts/components/post-card'
import { Button } from '@/shared/ui/button'
import { FaPlus, FaFire, FaClock, FaStar, FaCompass } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@features/posts/api'
import { categoriesApi } from '@features/categories/api'
import { usersApi } from '@/features/users/api'
import { User } from '@/features/users/types'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'
import { useState } from 'react'

export function HomePage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<string>('popular')

    const { isLoading: homeLoading } = useQuery({
        queryKey: ['home'],
        queryFn: () => postsApi.getPosts({ limit: 8 })
    })

    const { data: postsData } = useQuery({
        queryKey: ['posts', 'home', activeTab],
        queryFn: () => {
            const params: any = { limit: 8 }
            if (activeTab === 'popular') {
                params.sortBy = 'popularity'
            } else if (activeTab === 'new') {
                params.sortBy = 'date'
            } else if (activeTab === 'subscriptions' && user) {
                params.followedByUserId = user.id
            } else if (activeTab.startsWith('#')) {
                params.tag = activeTab.slice(1)
            }
            return postsApi.getPosts(params)
        }
    })

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', 'home'],
        queryFn: () => usersApi.getUsers({ limit: 20 })
    })
    
    const isLoading = homeLoading || categoriesLoading || usersLoading
    const posts = postsData?.posts || []
    const subcategories = categoriesData || []
    const users = (usersData?.users || []) || []

    const getAuthor = (authorId: number) => {
        return users.find((author: User) => author.id === authorId)
    }

    const getSubcategory = (subcategoryId: number) => {
        const subcategory = subcategories.find(s => s.id === subcategoryId)
        if (!subcategory) return null

        const mainCategory = subcategory.mainCategoryId
        const color = getCategoryColor(mainCategory)

        return {
            id: subcategory.id,
            name: subcategory.name,
            color,
        }
    }

    const getCategoryColor = (categoryId: number) => {
        const colors = [
            '#a16207', // янтарный
            '#0ea5e9', // голубой
            '#8b5cf6', // фиолетовый
            '#10b981', // зеленый
            '#ef4444', // красный
            '#ec4899', // розовый
        ]
        return colors[(categoryId - 1) % colors.length]
    }

    return (
        <div className="space-y-6">
            {isLoading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
            ) : (
                <>
                    {/* Hero Section */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#ffc09e] to-amber-300 p-8 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-amber-800 mb-4">
                            Добро пожаловать в ActivityHub!
                        </h1>
                        <p className="text-lg text-amber-800/90 mb-6 max-w-2xl mx-auto">
                            Платформа для обмена активностями, увлечениями и хобби.
                            {user ? ` Приветствуем, ${user.username}!` : ' Присоединяйтесь к сообществу единомышленников!'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-white text-amber-800 hover:bg-white/90"
                                onClick={() => navigate(user ? '/posts/create' : '/login')}
                            >
                                <FaPlus className="mr-2" />
                                {user ? 'Создать пост' : 'Начать'}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-white/20 text-amber-950 border-white hover:bg-white/30"
                                onClick={() => navigate('/categories')}
                            >
                                <FaCompass className="mr-2" />
                                Исследовать категории
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                            <Button
                                variant={activeTab === 'popular' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('popular')}
                            >
                                <FaFire className="mr-2" />
                                Популярное
                            </Button>
                            <Button
                                variant={activeTab === 'new' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('new')}
                            >
                                <FaClock className="mr-2" />
                                Новое
                            </Button>
                            {user && (
                                <Button
                                    variant={activeTab === 'subscriptions' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveTab('subscriptions')}
                                >
                                    <FaStar className="mr-2" />
                                    Подписки
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Recent Posts */}
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                            {activeTab === 'popular' ? 'Все популярные публикации' :
                                activeTab === 'new' ? 'Последние публикации' :
                                    activeTab === 'subscriptions' ? 'Ваши подписки' :
                                        `Публикации с тегом ${activeTab}`}
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {posts.map(post => {
                                const author = getAuthor(post.authorId)
                                const subcategory = getSubcategory(post.subcategoryId)

                                if (!author || !subcategory) return null

                                return (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        author={{
                                            id: author.id,
                                            username: author.username,
                                        }}
                                        subcategory={subcategory}
                                        onCommentClick={() => navigate(`/posts/${post.id}`)}
                                        onShareClick={() => console.log('Share clicked')}
                                    />
                                )
                            })}
                            {posts.length === 0 && (
                                <div className="col-span-full text-center text-stone-500 dark:text-stone-400 py-8">
                                    {activeTab === 'popular' ? 'Пока нет популярных публикаций.' :
                                        activeTab === 'new' ? 'Нет последних публикаций.' :
                                        activeTab === 'subscriptions' ? 'Вы еще ни на кого не подписаны, или у ваших подписок нет публикаций.' :
                                        `Нет публикаций с тегом ${activeTab.slice(1)}.`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories Preview - удалено */}

                    {/* Active Users */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">
                            Активные пользователи
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {users.slice(0, 8).map((user: User) => (
                                <div
                                    key={user.id}
                                    className="bg-white dark:bg-stone-800 rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/profile?id=${user.id}`)}
                                >
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-amber-800 dark:text-amber-200 font-semibold">
                                            {user.username.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">
                                        {user.username}
                                    </h3>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                                        Активный пользователь
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default HomePage