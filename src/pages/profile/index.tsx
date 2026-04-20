import { useState } from 'react'
import { FaEdit } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useAuth } from '@/app/providers/auth-provider'

export function ProfilePage() {
    const { user, updateUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [username, setUsername] = useState(user?.username || '')

    if (!user) return null

    const handleSave = () => {
        updateUser({ username })
        setIsEditing(false)
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar size="xl" fallback={(user.username || 'U').slice(0, 2).toUpperCase()} />
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
                                            {user.username}
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
                                    <div className="flex flex-wrap gap-2 text-sm text-stone-500 dark:text-stone-500">

                                    </div>
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
                            {user.stats?.postsCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Посты
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {user.stats?.followersCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Подписчики
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {user.stats?.followingCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Подписки
                        </div>
                    </CardContent>
                </Card>
                <Card hover>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {user.stats?.likesCount || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                            Лайки
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Posts */}
            <Card>
                <CardHeader>
                    <CardTitle>Последние посты</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="p-4 border rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                                            Пример поста #{i}
                                        </h3>
                                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                                            Краткое описание поста для демонстрации...
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-stone-500">
                                            <span>2 дня назад</span>
                                            <span>•</span>
                                            <span>24 лайка</span>
                                            <span>•</span>
                                            <span>5 комментариев</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 bg-stone-200 dark:bg-stone-700 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ProfilePage