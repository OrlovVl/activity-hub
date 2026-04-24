export interface UserStats {
    postsCount: number
    followersCount: number
    followingCount: number
    likesCount: number
}

export interface User {
    id: number
    email: string
    username: string
    avatar: string
    bio: string
    role: 'user' | 'admin'
    createdAt: string
    favoriteSubcategoryIds: number[]
    stats?: UserStats
}
