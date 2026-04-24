import { useParams, useNavigate } from 'react-router-dom'
import { FaUser, FaArrowLeft, FaCheck } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/features/users/api'
import { postsApi } from '@/features/posts/api'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PostCard } from '@/features/posts/components/post-card'

export function UserProfilePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const userId = Number(id)

    const { data: profileUser, isLoading: userLoading, error: userError } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => usersApi.getUser(userId),
        enabled: !!userId,
        retry: (failureCount: number, error: Error) => {
            // Не повторяем при 404
            if (error.message.includes('404')) return false
            return failureCount < 3
        }
    })

    const { data: userPosts, isLoading: postsLoading, error: postsError } = useQuery({
        queryKey: ['userPosts', userId],
        queryFn: () => postsApi.getPosts({ authorId: userId }),
        enabled: !!userId
    })

    const followMutation = useMutation({
        mutationFn: () => {
            if (user?.id === userId) {
                return Promise.reject('Cannot follow yourself')
            }
            return usersApi.followUser(userId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] })
            queryClient.invalidateQueries({ queryKey: ['followStatus', userId] })
        },
        onError: (error: unknown) => {
            console.error('Follow error:', error)
        },
    })

    const unfollowMutation = useMutation({
        mutationFn: () => {
            return usersApi.unfollowUser(userId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] })
            queryClient.invalidateQueries({ queryKey: ['followStatus', userId] })
        },
        onError: (error: unknown) => {
            console.error('Unfollow error:', error)
        },
    })

    const isOwnProfile = user?.id === userId

    const { data: followStatus } = useQuery({
        queryKey: ['followStatus', userId],
        queryFn: () => usersApi.isFollowing(userId),
        enabled: !!userId && !isOwnProfile,
        staleTime: 1000 * 60 * 5, // Кэшируем на 5 минут
    })

    // Обработка ошибок
    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    if (userError || !profileUser) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Пользователь не найден
                </h1>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                    {userError instanceof Error ? userError.message : 'Запрашиваемый пользователь не существует'}
                </p>
                <Button onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </div>
        )
    }

    const isFollowing = !isOwnProfile ? (followStatus?.isFollowing ?? false) : false

    // Получаем статистику из API
    const stats = [
        { label: 'Посты', value: profileUser?.stats?.postsCount || userPosts?.total || 0 },
        { label: 'Подписчики', value: profileUser?.stats?.followersCount || 0 },
        { label: 'Подписки', value: profileUser?.stats?.followingCount || 0 },
        { label: 'Лайки', value: profileUser?.stats?.likesCount || 0 },
    ]

    const formatNumber = (num: number): string => {
        if (num > 1000) {
            return `${(num / 1000).toFixed(1)}K`
        }
        return num.toString()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => navigate('/')}>
                    <FaArrowLeft className="mr-2" />
                    Назад
                </Button>
            </div>

            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                        {/* Avatar */}
                        <Avatar size="xl" fallback={(profileUser.username || 'U').slice(0, 2).toUpperCase()} />

                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                                {profileUser.username}
                            </h1>
                            {profileUser.bio && (
                                <p className="text-stone-600 dark:text-stone-400 mb-4">
                                    {profileUser.bio}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {stats.map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                            {formatNumber(stat.value)}
                                        </div>
                                        <div className="text-sm text-stone-600 dark:text-stone-400">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            {!isOwnProfile && (
                                <div className="flex gap-2">
                                    {!isFollowing && (
                                        <Button
                                            onClick={() => followMutation.mutate()}
                                            disabled={followMutation.isPending || unfollowMutation.isPending}
                                        >
                                            <FaUser className="mr-2" />
                                            {followMutation.isPending ? 'Подписка...' : 'Подписаться'}
                                        </Button>
                                    )}
                                    {isFollowing && (
                                        <Button
                                            variant="outline"
                                            onClick={() => unfollowMutation.mutate()}
                                            disabled={followMutation.isPending || unfollowMutation.isPending}
                                        >
                                            <FaCheck className="mr-2" />
                                            {unfollowMutation.isPending ? 'Отписка...' : 'Отписаться'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* User's Posts */}
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Посты пользователя
                </h2>
                {postsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                ) : postsError ? (
                    <div className="text-center text-red-600 dark:text-red-400 py-8">
                        Ошибка загрузки постов: {postsError instanceof Error ? postsError.message : 'Неизвестная ошибка'}
                    </div>
                ) : userPosts?.posts && userPosts.posts.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userPosts.posts.map(post => {
                            const author = profileUser
                            return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    author={{
                                        id: author.id,
                                        username: author.username,
                                        avatar: author.avatar,
                                    }}
                                    subcategory={post.subcategoryId ? {
                                        id: post.subcategoryId,
                                        name: 'Категория',
                                        color: '#a16207'
                                    } : {
                                        id: 0,
                                        name: 'Без категории',
                                        color: '#a16207'
                                    }}
                                    onPostClick={() => navigate(`/posts/${post.id}`)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center text-stone-500 dark:text-stone-400 py-8">
                        У пользователя пока нет постов
                    </div>
                )}
            </div>
        </div>
    )
}