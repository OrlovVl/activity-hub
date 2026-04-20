export interface Comment {
    id: number
    content: string
    authorId: number
    author: {
        id: number
        username: string
    } | null
    postId: number
    parentId: number | null
    replies: Comment[]
    likesCount: number
    createdAt: string
    isLiked?: boolean
}

export interface CreateCommentRequest {
    content: string
    postId: number
    parentId?: number | null
}
