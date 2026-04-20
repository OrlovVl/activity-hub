import { useParams, useNavigate } from 'react-router-dom'
import { FaUser, FaArrowLeft } from 'react-icons/fa'
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

    const { data: profileUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => usersApi.getUser(userId),
        enabled: !!userId
    })

    const { data: userPosts, isLoading: postsLoading } = useQuery({
        queryKey: ['userPosts', userId],
        queryFn: () => postsApi.getPosts({ userId }),
        enabled: !!userId
    })

    const followMutation = useMutation({
        mutationFn: () => user?.id === userId ? Promise.reject('Cannot follow yourself') :
            usersApi.followUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] })
        },
    })

    const unfollowMutation = useMutation({
        mutationFn: () => usersApi.unfollowUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] })
        },
    })

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    if (!profileUser) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Пользователь не найден
                </h1>
                <Button onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </div>
        )
    }

    const isOwnProfile = user?.id === userId
    const isFollowing = false // TODO: get from API

    const stats = [
        { label: 'Посты', value: userPosts?.posts.length || 0 },
        { label: 'Подписчики', value: '1.2K' }, // TODO: get from API
        { label: 'Подписки', value: '156' }, // TODO: get from API
        { label: 'Лайки', value: '3.4K' }, // TODO: get from API
    ]

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
                            <p className="text-stone-600 dark:text-stone-400 mb-4">
                                Участник платформы
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {stats.map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                            {stat.value}
                                        </div>
                                        <div className="text-sm text-stone-600 dark:text-stone-400">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            {!isOwnProfile && (
                                <Button
                                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                                    disabled={followMutation.isPending || unfollowMutation.isPending}
                                >
                                    <FaUser className="mr-2" />
                                    {isFollowing ? 'Отписаться' : 'Подписаться'}
                                </Button>
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
                ) : userPosts?.posts.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userPosts.posts.map(post => {
                            const author = profileUser
                            const subcategory = {
                                id: post.subcategoryId,
                                name: 'Категория', // TODO: get subcategory name
                                color: '#a16207'
                            }

                            return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    author={{
                                        id: author.id,
                                        username: author.username,
                                    }}
                                    subcategory={subcategory}
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