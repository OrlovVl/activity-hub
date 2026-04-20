import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaComment, FaShare, FaCalendar, FaUser } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { CommentList } from '@features/comments/components/comment-list'
import { formatDate } from '@/shared/utils/helpers'
import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@features/posts/api'
import { commentsApi } from '@features/comments/api'
import { usersApi } from '@/features/users/api'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi as likeApi } from '@features/posts/api'

export function ViewPostPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const postId = Number(id)
    const [liked, setLiked] = useState(false)

    const { data: post, isLoading: postLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: () => postsApi.getPost(postId),
        enabled: !!postId
    })

    const { data: author, isLoading: authorLoading } = useQuery({
        queryKey: ['user', post?.authorId],
        queryFn: () => usersApi.getUser(post!.authorId),
        enabled: !!post?.authorId
    })

    const { data: comments, isLoading: commentsLoading } = useQuery({
        queryKey: ['comments', postId],
        queryFn: () => commentsApi.getPostComments(postId),
        enabled: !!postId
    })

    const likeMutation = useMutation({
        mutationFn: () => liked ? likeApi.unlikePost(post!.id) : likeApi.likePost(post!.id),
        onSuccess: () => {
            setLiked(!liked)
            queryClient.invalidateQueries({ queryKey: ['post', postId] })
        },
    })

    const handleLike = () => {
        if (!user || !post) return
        likeMutation.mutate()
    }

    const handleEdit = () => {
        if (post) navigate(`/posts/${post.id}/edit`)
    }

    if (postLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Пост не найден
                </h1>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                    Запрошенный пост не существует или был удален
                </p>
                <Button onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Post Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/')}>
                        ← Назад
                    </Button>
                    <div className="hidden md:block">
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {post.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending || !user}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                        {liked ? (
                            <FaHeart className="w-5 h-5 text-red-500" />
                        ) : (
                            <FaRegHeart className="w-5 h-5 text-stone-500" />
                        )}
                        <span className="font-medium">
                            {post.likesCount + (liked ? 1 : 0)}
                        </span>
                    </button>
                    <Button onClick={() => navigate('/posts/create')}>
                        <FaShare className="mr-2" />
                        Поделиться
                    </Button>
                    {user?.id === post.authorId && (
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                            Редактировать
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Title */}
            <div className="md:hidden">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {post.title}
                </h1>
            </div>

            {/* Author Info */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                        {authorLoading ? (
                            <Skeleton className="w-16 h-16 rounded-full" />
                        ) : (
                            <Avatar size="lg" fallback={(author?.username || 'U').slice(0, 2).toUpperCase()} />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                                        {authorLoading ? (
                                            <Skeleton className="h-6 w-32" />
                                        ) : (
                                            author?.username || 'Пользователь'
                                        )}
                                    </h2>
                                    <p className="text-stone-600 dark:text-stone-400 mt-1">
                                        {authorLoading ? (
                                            <Skeleton className="h-4 w-48 mt-2" />
                                        ) : (
                                            'Участник платформы'
                                        )}
                                    </p>
                                </div>
                                {user?.id !== post.authorId && (
                                    <Button variant="outline" size="sm">
                                        <FaUser className="mr-2" />
                                        Подписаться
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center space-x-4 mt-4 text-sm text-stone-500 dark:text-stone-500">
                                <span className="flex items-center">
                                    <FaCalendar className="w-3 h-3 mr-1" />
                                    {formatDate(post.createdAt)}
                                </span>
                                <span>•</span>
                                <span>{post.likesCount} лайков</span>
                                <span>•</span>
                                <span>{post.commentsCount} комментариев</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Post Content */}
            <Card>
                <CardContent className="p-6">
                    <div className="prose prose-stone dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line text-stone-700 dark:text-stone-300">
                            {post.content}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        {post.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Comments */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 flex items-center">
                            <FaComment className="w-5 h-5 mr-2" />
                            Комментарии ({comments?.length || 0})
                        </h3>
                        <Button variant="outline" size="sm">
                            Сначала новые
                        </Button>
                    </div>
                    {commentsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CommentList comments={comments || []} postId={post.id} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ViewPostPage