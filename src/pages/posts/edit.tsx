import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import { PostEditor } from '@features/posts/components/post-editor'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@features/categories/api'
import { postsApi } from '@features/posts/api'
import { useAuth } from '@/app/providers/auth-provider'
import { useQueryClient } from '@tanstack/react-query'

export function EditPostPage() {
    const { id } = useParams<{ id: string }>()
    const postId = Number(id)
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data: post, isLoading: postLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: () => postsApi.getPost(postId),
        enabled: !!postId
    })

    const { data: mainCategories, isLoading: mainCategoriesLoading } = useQuery({
        queryKey: ['mainCategories'],
        queryFn: () => categoriesApi.getMainCategories()
    })

    const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: () => categoriesApi.getSubcategories()
    })

    useEffect(() => {
        if (post && user && post.authorId !== user.id) {
            navigate(`/posts/${postId}`)
        }
    }, [post, user, navigate, postId])

    const handleSubmit = async (data: { title: string; content: string; subcategoryId: number }) => {
        setIsSubmitting(true)
        try {
            await postsApi.updatePost(postId, {
                title: data.title,
                content: data.content,
                subcategoryId: data.subcategoryId,
            })
            queryClient.invalidateQueries({ queryKey: ['post', postId] })
            queryClient.invalidateQueries({ queryKey: ['posts'] })
            navigate(`/posts/${postId}`)
        } catch (error) {
            console.error('Error updating post:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        navigate(`/posts/${postId}`)
    }

    if (postLoading || subcategoriesLoading || mainCategoriesLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Пост не найден
                </h1>
                <Button onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </div>
        )
    }

    if (user && post.authorId !== user.id) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                    Доступ запрещен
                </h1>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                    Вы можете редактировать только свои посты
                </p>
                <Button onClick={() => navigate(`/posts/${postId}`)}>
                    Вернуться к посту
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
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
                        Редактировать пост
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Редактирование поста</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PostEditor
                                mainCategories={mainCategories || []}
                                subcategories={subcategories || []}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                isSubmitting={isSubmitting}
                                initialData={{
                                    title: post.title,
                                    content: post.content,
                                    subcategoryId: post.subcategoryId,
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
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
                                    Обновите заголовок и содержание, если нужно
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-amber-800 dark:text-amber-300 text-sm">2</span>
                                </div>
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    Можете изменить теги для лучшего поиска
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default EditPostPage