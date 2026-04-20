import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '@features/categories/api'
import { postsApi } from '@features/posts/api'
import { usersApi } from '@/features/users/api'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useAuth } from '@/app/providers/auth-provider'
import { FaCheck, FaTrash, FaUserShield, FaBroom, FaList } from 'react-icons/fa'

type AdminTab = 'subcategories' | 'posts' | 'users'

export function AdminPage() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<AdminTab>('subcategories')

    // Admin/moderator check: user.id === 1 is admin, others are moderators
    const navigate = useNavigate()

    if (!user || user.id !== 1) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                    Доступ запрещен
                </h1>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                    У вас нет прав для доступа к панели управления
                </p>
                <Button onClick={() => navigate('/') }>
                    Вернуться на главную
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        Панель управления
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400">
                        {user.id === 1 ? 'Администратор' : 'Модератор'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-stone-200 dark:border-stone-700">
                {[
                    { id: 'subcategories' as AdminTab, label: 'Подкатегории', icon: FaList },
                    { id: 'posts' as AdminTab, label: 'Посты', icon: FaBroom },
                    { id: 'users' as AdminTab, label: 'Пользователи', icon: FaUserShield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Subcategories Tab */}
            {activeTab === 'subcategories' && <SubcategoriesTab queryClient={queryClient} />}

            {/* Posts Tab */}
            {activeTab === 'posts' && <PostsTab queryClient={queryClient} />}

            {/* Users Tab */}
            {activeTab === 'users' && <UsersTab />}
        </div>
    )
}

// Subcategories Management Component
function SubcategoriesTab({ queryClient }: { queryClient: any }) {
    const { data: subcategories } = useQuery({
        queryKey: ['subcategories', 'all'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    const approveMutation = useMutation({
        mutationFn: (id: number) => categoriesApi.approveSubcategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subcategories'] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => categoriesApi.deleteSubcategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subcategories'] })
        },
    })

    const pendingSubcategories = subcategories?.filter(s => !s.isApproved) || []
    const approvedSubcategories = subcategories?.filter(s => s.isApproved) || []

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                    Ожидают одобрения ({pendingSubcategories.length})
                </h2>
                {pendingSubcategories.length === 0 ? (
                    <p className="text-stone-500 dark:text-stone-400">Нет подкатегорий, ожидающих одобрения</p>
                ) : (
                    <div className="space-y-3">
                        {pendingSubcategories.map(sub => (
                            <Card key={sub.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">{sub.name}</h3>
                                        <p className="text-sm text-stone-600 dark:text-stone-400">{sub.description}</p>
                                        <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                                            Категория ID: {sub.mainCategoryId} | Теги: {sub.tags.join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            onClick={() => approveMutation.mutate(sub.id)}
                                            disabled={approveMutation.isPending}
                                        >
                                            <FaCheck className="mr-1" />
                                            Одобрить
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                            onClick={() => deleteMutation.mutate(sub.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <FaTrash className="mr-1" />
                                            Удалить
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                    Одобрённые ({approvedSubcategories.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {approvedSubcategories.map(sub => (
                        <Card key={sub.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">{sub.name}</h3>
                                    <p className="text-sm text-stone-600 dark:text-stone-400">{sub.description}</p>
                                </div>
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                    Одобрено
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Posts Management Component
function PostsTab({ queryClient }: { queryClient: any }) {
    const { data: postsData } = useQuery({
        queryKey: ['posts', 'admin'],
        queryFn: () => postsApi.getPosts({ limit: 50 })
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => postsApi.deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] })
        },
    })

    const posts = postsData?.posts || []

    return (
        <div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                Все посты ({posts.length})
            </h2>
            {posts.length === 0 ? (
                <p className="text-stone-500 dark:text-stone-400">Нет постов</p>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <Card key={post.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">{post.title}</h3>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-1">{post.content}</p>
                                    <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                                        ID: {post.id} | Автор ID: {post.authorId} | Лайки: {post.likesCount}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                        if (confirm(`Удалить пост "${post.title}"?`)) {
                                            deleteMutation.mutate(post.id)
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <FaTrash className="mr-1" />
                                    Удалить
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

// Users Management Component
function UsersTab() {
    const { data: usersData } = useQuery({
        queryKey: ['users', 'admin'],
        queryFn: () => usersApi.getUsers({ limit: 50 })
    })

    const users = usersData?.users || []

    return (
        <div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                Все пользователи ({users.length})
            </h2>
            {users.length === 0 ? (
                <p className="text-stone-500 dark:text-stone-400">Нет пользователей</p>
            ) : (
                <div className="overflow-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-200 dark:border-stone-700">
                                <th className="text-left p-3 text-sm font-medium text-stone-600 dark:text-stone-400">ID</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-600 dark:text-stone-400">Имя</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-600 dark:text-stone-400">Email</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-600 dark:text-stone-400">Роль</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-600 dark:text-stone-400">Дата регистрации</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-stone-100 dark:border-stone-800">
                                    <td className="p-3 text-stone-600 dark:text-stone-400">{u.id}</td>
                                    <td className="p-3 text-stone-900 dark:text-stone-100">{u.username}</td>
                                    <td className="p-3 text-stone-600 dark:text-stone-400">{u.email}</td>
                                    <td className="p-3 text-stone-600 dark:text-stone-400">
                                        Пользователь
                                    </td>
                                    <td className="p-3 text-stone-600 dark:text-stone-400">
                                        {new Date(u.id * 1000000).toLocaleDateString('ru-RU')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AdminPage