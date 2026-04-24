import { useState } from 'react'
import { FaEdit } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useAuth } from '@/app/providers/auth-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/features/users/api'
import { postsApi } from '@/features/posts/api'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const queryClient = useQueryClient()
    const [isEditing, setIsEditing] = useState(false)
    const [username, setUsername] = useState(user?.username || '')

    if (!user) return null

    // Загружаем актуальные данные пользователя
    const { data: meData } = useQuery({
        queryKey: ['users', 'me'],
        queryFn: () => usersApi.getMe()
    })

    // Загружаем посты текущего пользователя
    const { data: userPosts, isLoading: postsLoading } = useQuery({
        queryKey: ['userPosts', user.id],
        queryFn: () => postsApi.getPosts({ authorId: user.id, limit: 50 }),
        enabled: !!user.id
    })

    const handleSave = async () => {
        try {
            const updated = await usersApi.updateUser(user.id, { username })
            updateUser({ ...user, username: updated.username })
            setIsEditing(false)
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
        } catch (error) {
            console.error('Error updating profile:', error)
        }
    }

    // Используем данные из API если есть
    const currentUser: any = meData || user

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar size="xl" fallback={(currentUser.username || 'U').slice(0, 2).toUpperCase()} />
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-left">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Имя пользователя"
                                    />
                                    <div className="flex space-x-2">
                                        <Button onClick={handleSave}>Сохранить</Button>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            Отмена
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                                        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                            {currentUser.username}
                                        </h1>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                        >
                                            <FaEdit className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                                        </button>
                                    </div>
                                    <p className="text-stone-600 dark:text-stone-400 mb-4">
                                        Участник платформы
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {currentUser.stats?.postsCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Посты
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {currentUser.stats?.followersCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Подписчики
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {currentUser.stats?.followingCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Подписки
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {currentUser.stats?.likesCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Лайки
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Posts - реальные посты пользователя */}
            <Card>
                <CardHeader>
                    <CardTitle>Последние посты</CardTitle>
                </CardHeader>
                <CardContent>
                    {postsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                        </div>
                    ) : userPosts?.posts && userPosts.posts.length > 0 ? (
                        <div className="space-y-4">
                            {userPosts.posts.slice(0, 3).map((post) => (
                                <div
                                    key={post.id}
                                    className="p-4 border rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/posts/${post.id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 line-clamp-2">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center space-x-4 text-xs text-stone-500">
                                                <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                                                <span>•</span>
                                                <span>{post.likesCount} лайков</span>
                                                <span>•</span>
                                                <span>{post.commentsCount} комментариев</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-stone-500 dark:text-stone-400 py-8">
                            <p>У вас пока нет постов</p>
                            <Button 
                                className="mt-4" 
                                onClick={() => navigate('/posts/create')}
                            >
                                Создать первый пост
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ProfilePage