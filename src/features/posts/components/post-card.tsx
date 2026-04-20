import React from 'react'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Post } from '../types'
import { formatDate, truncateText } from '@/shared/utils/helpers'
import { useAuth } from '@/app/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../api'

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
}

export function PostCard({
    post,
    author,
    subcategory,
    onPostClick
}: PostCardProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

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

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
        </div>
    )
}
