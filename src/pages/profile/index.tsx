import { useState } from 'react'
import { FaEdit, FaMapMarkerAlt, FaCalendar, FaChartLine } from 'react-icons/fa'
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

    const stats = [
        { label: 'Посты', value: '42' },
        { label: 'Подписчики', value: '1.2K' },
        { label: 'Подписки', value: '156' },
        { label: 'Лайки', value: '3.4K' },
    ]

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
                                        <span className="flex items-center">
                                            <FaMapMarkerAlt className="w-3 h-3 mr-1" />
                                            Москва, Россия
                                        </span>
                                        <span className="flex items-center">
                                            <FaCalendar className="w-3 h-3 mr-1" />
                                            На платформе с {new Date(user.id * 1000000).getFullYear()}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} hover>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-stone-600 dark:text-stone-400">
                                {stat.label}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Активность</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-stone-400 dark:text-stone-600">
                        <div className="text-center">
                            <FaChartLine className="w-12 h-12 mx-auto mb-4" />
                            <p>График активности</p>
                            <p className="text-sm">(заглушка для демонстрации)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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