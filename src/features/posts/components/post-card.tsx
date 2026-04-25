import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Post } from '../types'
import { formatDate, truncateText } from '@/shared/utils/helpers'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '@features/posts/api'
import { FaHeart, FaRegHeart } from 'react-icons/fa'

interface PostCardProps {
    post: Post
    author: {
        id: number
        username: string
        avatar?: string
    }
    subcategory: {
        id: number
        name: string
        color: string
    }
    onPostClick?: () => void
    onCommentClick?: () => void | Promise<void>
    onShareClick?: () => void
}

export function PostCard({
    post,
    author,
    subcategory,
    onPostClick,
    onCommentClick: _onCommentClick,
    onShareClick: _onShareClick
}: PostCardProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Like mutation
    const likeMutation = useMutation({
        mutationFn: (shouldLike: boolean) =>
            shouldLike
                ? postsApi.likePost(post.id)
                : postsApi.unlikePost(post.id),
        onMutate: async (shouldLike) => {
            await queryClient.cancelQueries({ queryKey: ['post', post.id] })
            const previousPost = queryClient.getQueryData(['post', post.id]) as any
            if (previousPost) {
                queryClient.setQueryData(['post', post.id], {
                    ...previousPost,
                    likesCount: shouldLike ? previousPost.likesCount + 1 : Math.max(0, previousPost.likesCount - 1),
                    isLiked: shouldLike
                })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['post', post.id] })
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ['post', post.id] })
        }
    })

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            onPostClick?.()
            return
        }
        likeMutation.mutate(!post.isLiked)
    }

    return (
        <div 
            className="border rounded-xl overflow-hidden bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-shadow"
            onClick={onPostClick}
        >
            {/* Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-700">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar size="md" fallback={author.username.slice(0, 2).toUpperCase()} />
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                                    {author.username}
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full"
                                    style={{ backgroundColor: `${subcategory.color}20`, color: subcategory.color }}>
                                    {subcategory.name}
                                </span>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </div>

                    {user?.id === post.authorId && (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `/posts/${post.id}/edit`}
                            >
                                Редактировать
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    {post.title}
                </h2>

                <p className="text-stone-700 dark:text-stone-300 mb-4">
                    {truncateText(post.content, 300)}
                </p>
            </div>

            {/* Footer */}
            <div className="p-4 pt-0 flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                <button
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
                        post.isLiked
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-700'
                    } disabled:opacity-50`}
                >
                    {post.isLiked ? (
                        <FaHeart className="w-4 h-4" />
                    ) : (
                        <FaRegHeart className="w-4 h-4" />
                    )}
                    <span>{post.likesCount}</span>
                </button>
            </div>
        </div>
    )
}
