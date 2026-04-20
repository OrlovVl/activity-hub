export interface MapRoute {
    points: Array<{ lat: number; lng: number }>
    distance?: number
    duration?: number
}

export interface Post {
    id: number
    title: string
    content: string
    authorId: number
    subcategoryId: number
    tags: string[]
    likesCount: number
    commentsCount: number
    createdAt: string
    updatedAt: string
    isLiked?: boolean
    isBookmarked?: boolean
}

export interface CreatePostRequest {
    title: string
    content: string
    subcategoryId: number
    tags: string[]
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> { }
