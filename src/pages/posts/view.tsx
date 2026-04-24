import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaComment, FaUser, FaBookmark } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { CommentList } from '@features/comments/components/comment-list'
import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@features/posts/api'
import { commentsApi } from '@features/comments/api'
import { usersApi } from '@/features/users/api'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'

export function ViewPostPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const postId = Number(id)
    const [liked, setLiked] = useState(false)
    const [followed, setFollowed] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)
    const [likesCount, setLikesCount] = useState(0)

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

    const { data: isFollowingData } = useQuery({
        queryKey: ['isFollowing', post?.authorId],
        queryFn: () => usersApi.isFollowing(post!.authorId),
        enabled: !!post?.authorId
    })

    // Синхронизация состояния при загрузке поста
    useEffect(() => {
        if (post) {
            setLiked(post.isLiked || false)
            setBookmarked(post.isBookmarked || false)
            setLikesCount(post.likesCount || 0)
        }
        if (isFollowingData?.isFollowing !== undefined) {
            setFollowed(isFollowingData.isFollowing)
        }
    }, [post, isFollowingData])

    // Like mutation — toggle like/unlike via separate endpoints
    const likeMutation = useMutation<{ liked: boolean; likesCount: number }, Error, boolean>({
        mutationFn: (shouldLike: boolean) => 
            shouldLike 
                ? apiClient.post<{ liked: boolean; likesCount: number }>(`/posts/${post!.id}/like`, {}) 
                : apiClient.delete<{ liked: boolean; likesCount: number }>(`/posts/${post!.id}/like`),
        onMutate: async (shouldLike: boolean) => {
            // Отменяем реферч и оптимистично обновляем кэш
            await queryClient.cancelQueries({ queryKey: ['post', postId] })
            const previousPost = queryClient.getQueryData(['post', postId]) as any
            if (previousPost) {
                const newLikesCount = shouldLike 
                    ? previousPost.likesCount + 1 
                    : Math.max(0, previousPost.likesCount - 1)
                queryClient.setQueryData(['post', postId], {
                    ...previousPost,
                    likesCount: newLikesCount,
                    isLiked: shouldLike
                })
            }
            // Оптимистичное обновление локального состояния
            setLiked(shouldLike)
            setLikesCount(prev => shouldLike ? prev + 1 : Math.max(0, prev - 1))
            // Возвращаем предыдущее состояние для отката
            return { previousLiked: liked, previousLikesCount: likesCount }
        },
        onSuccess: (data) => {
            // Обновляем кэш серверным значением
            queryClient.setQueryData(['post', postId], {
                ...(queryClient.getQueryData(['post', postId]) as any),
                likesCount: data.likesCount,
                isLiked: data.liked
            })
            setLikesCount(data.likesCount)
            setLiked(data.liked)
        },
        onError: (_, shouldLike, context: any) => {
            // Откат при ошибке
            if (context && context.previousLiked !== undefined) {
                setLiked(context.previousLiked)
                setLikesCount(context.previousLikesCount)
            } else {
                setLiked(prev => !prev)
                setLikesCount(prev => prev + (shouldLike ? -1 : 1))
            }
            queryClient.invalidateQueries({ queryKey: ['post', postId] })
        },
    })

    // Follow mutation — toggle follow/unfollow
    const followMutation = useMutation({
        mutationFn: (shouldFollow: boolean) => 
            shouldFollow 
                ? usersApi.followUser(post!.authorId)
                : usersApi.unfollowUser(post!.authorId),
        onMutate: async (shouldFollow: boolean) => {
            await queryClient.cancelQueries({ queryKey: ['isFollowing', post?.authorId] })
            const previousFollowing = queryClient.getQueryData(['isFollowing', post?.authorId]) as { isFollowing: boolean } | undefined
            if (previousFollowing !== undefined) {
                queryClient.setQueryData(['isFollowing', post?.authorId], { isFollowing: shouldFollow })
            }
            setFollowed(shouldFollow)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['isFollowing', post?.authorId] })
        },
        onError: () => {
            setFollowed(prev => !prev)
        },
    })

    // Bookmark mutation — toggle bookmark via separate endpoints
    const bookmarkMutation = useMutation({
        mutationFn: (shouldBookmark: boolean) => 
            shouldBookmark 
                ? postsApi.bookmarkPost(post!.id)
                : postsApi.unbookmarkPost(post!.id),
        onMutate: async (shouldBookmark: boolean) => {
            await queryClient.cancelQueries({ queryKey: ['post', postId] })
            const previousPost = queryClient.getQueryData(['post', postId]) as any
            if (previousPost) {
                queryClient.setQueryData(['post', postId], {
                    ...previousPost,
                    isBookmarked: shouldBookmark
                })
            }
            setBookmarked(shouldBookmark)
        },
        onError: () => {
            setBookmarked(prev => !prev)
        },
    })

    const handleLike = () => {
        if (!user || !post) return
        likeMutation.mutate(!liked)
    }

    // handleFollow оставлен для будущей использования
    // const handleFollow = () => {
    //     if (!user || !post) return
    //     followMutation.mutate(!followed)
    // }

    const handleBookmark = () => {
        if (!user || !post) return
        bookmarkMutation.mutate(!bookmarked)
    }

    const handleEdit = () => {
        if (post) navigate(`/posts/${post.id}/edit`)
    }

    const handleAuthorClick = () => {
        if (author) navigate(`/users/${author.id}`)
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
                            {likesCount}
                        </span>
                    </button>
                    <button
                        onClick={handleBookmark}
                        disabled={bookmarkMutation.isPending || !user}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                        <FaBookmark className={`w-5 h-5 ${bookmarked ? 'text-amber-500' : 'text-stone-500'}`} />
                        <span className="font-medium">
                            {bookmarked ? 'В закладках' : 'В закладки'}
                        </span>
                    </button>
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
                                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={handleAuthorClick}>
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
                                     <Button
                                         variant={followed ? "outline" : "primary"}
                                         size="sm"
                                         onClick={() => followMutation.mutate(!followed)}
                                         disabled={followMutation.isPending}
                                     >
                                         <FaUser className="mr-2" />
                                         {followed ? 'Отписаться' : 'Подписаться'}
                                     </Button>
                                 )}
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

                </CardContent>
            </Card>

            {/* Comments */}
            <Card>
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 flex items-center">
                            <FaComment className="w-5 h-5 mr-2" />
                            Комментарии ({comments?.length || 0})
                        </h3>
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