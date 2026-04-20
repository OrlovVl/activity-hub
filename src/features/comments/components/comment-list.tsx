import React, { useState } from 'react'
import { FaHeart, FaRegHeart, FaReply, FaChevronDown, FaChevronRight } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Comment } from '../types'
import { formatDate } from '@/shared/utils/helpers'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '../api'

function updateCommentLikes(comments: Comment[], commentId: number, newLiked: boolean): Comment[] {
    return comments.map(comment => {
        if (comment.id === commentId) {
            return {
                ...comment,
                likesCount: newLiked ? comment.likesCount + 1 : comment.likesCount - 1,
                isLiked: newLiked
            }
        }
        if (comment.replies.length > 0) {
            return {
                ...comment,
                replies: updateCommentLikes(comment.replies, commentId, newLiked)
            }
        }
        return comment
    })
}

interface CommentItemProps {
    comment: Comment
    level?: number
    postId: number
}

export function CommentItem({ comment, level = 0, postId }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)
    const [replyContent, setReplyContent] = useState('')
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [liked, setLiked] = useState(false)

    const replyMutation = useMutation({
        mutationFn: () => commentsApi.createComment({
            content: replyContent,
            postId,
            parentId: comment.id,
        }),
        onSuccess: () => {
            setReplyContent('')
            setIsReplying(false)
            queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        },
        onError: (error) => {
            console.error('Reply error:', error)
        },
    })

    const likeMutation = useMutation({
        mutationFn: () => liked ? commentsApi.unlikeComment(comment.id) : commentsApi.likeComment(comment.id),
        onSuccess: () => {
            const newLiked = !liked
            setLiked(newLiked)
            queryClient.setQueryData(['comments', postId], (old: Comment[]) => 
                updateCommentLikes(old, comment.id, newLiked)
            )
        },
        onError: (error) => {
            console.error('Comment like error:', error)
        },
    })

    const handleReply = async () => {
        if (!replyContent.trim() || !user) return
        await replyMutation.mutateAsync()
    }

    const handleLike = () => {
        if (!user) return
        likeMutation.mutate()
    }

    const hasReplies = comment.replies && comment.replies.length > 0

    return (
        <div className="space-y-3" style={{ marginLeft: level * 20 }}>
            <div className="flex space-x-3">
                <Avatar
                    size="sm"
                    src={null}
                    fallback={`U${comment.authorId}`}
                />

                <div className="flex-1">
                    <div className="bg-stone-100 dark:bg-stone-800/50 rounded-2xl rounded-tl-none p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {comment.author?.username || `Пользователь ${comment.authorId}`}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                {formatDate(comment.createdAt)}
                            </span>
                        </div>

                        <p className="text-stone-700 dark:text-stone-300">
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 ml-3">
                        <button
                            onClick={handleLike}
                            disabled={likeMutation.isPending || !user}
                            className="flex items-center space-x-1 text-sm text-stone-600 dark:text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                            {liked ? (
                                <FaHeart className="w-4 h-4 text-red-500" />
                            ) : (
                                <FaRegHeart className="w-4 h-4" />
                            )}
                            <span>{comment.likesCount + (liked && !likeMutation.isPending ? 1 : 0)}</span>
                        </button>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center space-x-1 text-sm text-stone-600 dark:text-stone-400 hover:text-amber-500 transition-colors"
                        >
                            <FaReply className="w-4 h-4" />
                            <span>Ответить</span>
                        </button>

                        {hasReplies && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center space-x-1 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                            >
                                {isExpanded ? (
                                    <FaChevronDown className="w-4 h-4" />
                                ) : (
                                    <FaChevronRight className="w-4 h-4" />
                                )}
                                <span>
                                    {comment.replies.length} ответ{comment.replies.length === 1 ? '' : 'а'}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Reply form */}
                    {isReplying && user && (
                        <div className="mt-3 space-y-2">
                            <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Напишите ответ..."
                                className="flex-1"
                            />
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    onClick={handleReply}
                                    loading={replyMutation.isPending}
                                    disabled={!replyContent.trim()}
                                >
                                    Отправить
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsReplying(false)}
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {hasReplies && isExpanded && (
                        <div className="mt-4 space-y-4">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    level={level + 1}
                                    postId={postId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface CommentListProps {
    comments: Comment[]
    postId: number
}

export function CommentList({ comments, postId }: CommentListProps) {
    const [newComment, setNewComment] = useState('')
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: () => commentsApi.createComment({
            content: newComment,
            postId,
        }),
        onSuccess: () => {
            setNewComment('')
            queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        },
        onError: (error) => {
            console.error('Create comment error:', error)
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !user) return
        await createMutation.mutateAsync()
    }

    return (
        <div className="space-y-6">
            {/* New comment form */}
            {user && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Напишите комментарий..."
                        disabled={createMutation.isPending}
                    />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            loading={createMutation.isPending}
                            disabled={!newComment.trim()}
                        >
                            Отправить
                        </Button>
                    </div>
                </form>
            )}

            {/* Comments list */}
            <div className="space-y-6">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                    />
                ))}
            </div>
        </div>
    )
}
