import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import { PostEditor } from '@features/posts/components/post-editor'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@features/categories/api'
import { postsApi } from '@features/posts/api'
import { useQueryClient } from '@tanstack/react-query'

export function CreatePostPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data: mainCategories, isLoading: mainCategoriesLoading } = useQuery({
        queryKey: ['mainCategories'],
        queryFn: () => categoriesApi.getMainCategories()
    })

    const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    const handleSubmit = async (data: { title: string; content: string; subcategoryId: number }) => {
        setIsSubmitting(true)
        try {
            await postsApi.createPost({
                title: data.title,
                content: data.content,
                subcategoryId: data.subcategoryId,
            })
            queryClient.invalidateQueries({ queryKey: ['posts'] })
            navigate('/')
        } catch (error) {
            console.error('Error creating post:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        navigate('/')
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        <FaArrowLeft className="mr-2" />
                        Назад
                    </Button>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                        Создать пост
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Содержание поста</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subcategoriesLoading || mainCategoriesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                </div>
                            ) : (
                                <PostEditor
                                    mainCategories={mainCategories || []}
                                    subcategories={subcategories || []}
                                    onSubmit={handleSubmit}
                                    onCancel={handleCancel}
                                    isSubmitting={isSubmitting}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Советы</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-amber-800 dark:text-amber-300 text-sm">1</span>
                                </div>
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    Выбирайте релевантную подкатегорию для лучшего охвата
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-amber-800 dark:text-amber-300 text-sm">2</span>
                                </div>
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    Добавляйте теги для облегчения поиска
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rules */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Правила</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                • Запрещен контент 18+
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                • Уважайте других пользователей
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                • Не размещайте личную информацию
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                • Соблюдайте авторские права
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default CreatePostPage