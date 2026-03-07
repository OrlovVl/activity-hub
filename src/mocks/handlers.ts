import { http, HttpResponse } from 'msw'
import mockData from './data'

let data = { ...mockData }

export const handlers = [
    // Auth
    http.post('/api/auth/login', async ({ request }) => {
        const { email, password } = (await request.json()) as any

        const user = data.users.find(u => u.email === email && u.password === password)
        if (!user) {
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        const { password: _, ...userWithoutPassword } = user
        const token = btoa(`${user.id}:${Date.now()}`)

        return HttpResponse.json({
            user: userWithoutPassword,
            token,
        })
    }),

    http.post('/api/auth/register', async ({ request }) => {
        const { email, password, username } = (await request.json()) as any

        if (data.users.some(u => u.email === email)) {
            return HttpResponse.json({ message: 'Email already exists' }, { status: 400 })
        }

        const newUser = {
            id: data.users.length + 1,
            email,
            password,
            username,
            avatar: '',
            bio: '',
            createdAt: new Date().toISOString(),
            favoriteSubcategoryIds: [],
            role: 'user' as const,
        }

        data.users.push(newUser)

        const { password: _, ...userWithoutPassword } = newUser
        const token = btoa(`${newUser.id}:${Date.now()}`)

        return HttpResponse.json({
            user: userWithoutPassword,
            token,
        })
    }),

    http.post('/api/auth/logout', () => {
        return HttpResponse.json({})
    }),

    // Users
    http.get('/api/users/me', async ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        try {
            const [userId] = atob(token).split(':')
            const user = data.users.find(u => u.id === parseInt(userId))

            if (!user) {
                return HttpResponse.json({ message: 'User not found' }, { status: 404 })
            }

            const { password, ...userWithoutPassword } = user

            // Добавляем статистику пользователя
            const userStats = data.userStats.find(stat => stat.userId === user.id)
            const postsCount = data.posts.filter(p => p.authorId === user.id).length
            const followersCount = data.subscriptions.filter(s => s.followingId === user.id).length
            const followingCount = data.subscriptions.filter(s => s.followerId === user.id).length

            const userWithStats = {
                ...userWithoutPassword,
                stats: {
                    postsCount,
                    followersCount,
                    followingCount,
                    likesCount: userStats?.likes || 0,
                }
            }

            return HttpResponse.json(userWithStats)
        } catch {
            return HttpResponse.json({ message: 'Invalid token' }, { status: 401 })
        }
    }),

    http.get('/api/users/:id', ({ params }) => {
        const user = data.users.find(u => u.id === parseInt(params.id as string))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const { password, ...userWithoutPassword } = user
        const postsCount = data.posts.filter(p => p.authorId === user.id).length
        const followersCount = data.subscriptions.filter(s => s.followingId === user.id).length
        const followingCount = data.subscriptions.filter(s => s.followerId === user.id).length

        const userWithStats = {
            ...userWithoutPassword,
            stats: {
                postsCount,
                followersCount,
                followingCount,
                likesCount: data.userStats.find(stat => stat.userId === user.id)?.likes || 0,
            }
        }

        return HttpResponse.json(userWithStats)
    }),

    http.put('/api/users/me', async ({ request }) => {
        const updates = (await request.json()) as any
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        try {
            const [userId] = atob(token).split(':')
            const userIndex = data.users.findIndex(u => u.id === parseInt(userId))

            if (userIndex === -1) {
                return HttpResponse.json({ message: 'User not found' }, { status: 404 })
            }

            data.users[userIndex] = { ...data.users[userIndex], ...updates }
            const { password, ...userWithoutPassword } = data.users[userIndex]

            return HttpResponse.json(userWithoutPassword)
        } catch {
            return HttpResponse.json({ message: 'Invalid token' }, { status: 401 })
        }
    }),

    // Categories
    http.get('/api/categories', () => {
        return HttpResponse.json(data.mainCategories)
    }),

    http.get('/api/categories/tree', () => {
        const tree = data.mainCategories.map(mainCategory => ({
            mainCategory,
            subcategories: data.subcategories.filter(sc => sc.mainCategoryId === mainCategory.id)
        }))

        return HttpResponse.json(tree)
    }),

    // Subcategories
    http.get('/api/subcategories', ({ request }) => {
        const url = new URL(request.url)
        const showAll = url.searchParams.get('showAll') === 'true'
        const mainCategoryId = url.searchParams.get('mainCategoryId')

        let subcategories = data.subcategories

        if (!showAll) {
            subcategories = subcategories.filter(s => s.isApproved)
        }

        if (mainCategoryId) {
            subcategories = subcategories.filter(s => s.mainCategoryId === parseInt(mainCategoryId))
        }

        return HttpResponse.json(subcategories)
    }),

    http.get('/api/categories/:id/subcategories', ({ params }) => {
        const mainCategoryId = parseInt(params.id as string)
        const subcategories = data.subcategories.filter(
            sc => sc.mainCategoryId === mainCategoryId && sc.isApproved
        )
        return HttpResponse.json(subcategories)
    }),

    http.post('/api/subcategories', async ({ request }) => {
        const body = (await request.json()) as any
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const newSubcategory = {
            id: data.subcategories.length + 1,
            ...body,
            createdByUserId: user.id,
            isApproved: user.role === 'moderator', // Модераторы могут сразу одобрять
            moderators: user.role === 'moderator' ? [user.id] : [],
            createdAt: new Date().toISOString(),
        }

        data.subcategories.push(newSubcategory)

        // Создаем уведомление для модераторов
        if (user.role !== 'moderator') {
            const moderators = data.users.filter(u => u.role === 'moderator')
            moderators.forEach(moderator => {
                const notification = {
                    id: data.notifications.length + 1,
                    type: 'moderation' as const,
                    userId: moderator.id,
                    sourceUserId: user.id,
                    sourceUserName: user.username,
                    sourceUserAvatar: user.avatar,
                    subcategoryId: newSubcategory.id,
                    message: `Новая подкатегория "${newSubcategory.name}" ожидает одобрения`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                }
                data.notifications.push(notification)
            })
        }

        return HttpResponse.json(newSubcategory)
    }),

    http.patch('/api/subcategories/:id/approve', async ({ params, request }) => {
        const subcategoryId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user || user.role !== 'moderator') {
            return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const subcategory = data.subcategories.find(sc => sc.id === subcategoryId)
        if (!subcategory) {
            return HttpResponse.json({ message: 'Subcategory not found' }, { status: 404 })
        }

        subcategory.isApproved = true
        if (!subcategory.moderators.includes(user.id)) {
            subcategory.moderators.push(user.id)
        }

        // Уведомляем создателя
        const creator = data.users.find(u => u.id === subcategory.createdByUserId)
        if (creator) {
            const notification = {
                id: data.notifications.length + 1,
                type: 'moderation' as const,
                userId: creator.id,
                sourceUserId: user.id,
                sourceUserName: user.username,
                sourceUserAvatar: user.avatar,
                subcategoryId: subcategory.id,
                message: `Ваша подкатегория "${subcategory.name}" была одобрена`,
                isRead: false,
                createdAt: new Date().toISOString(),
            }
            data.notifications.push(notification)
        }

        return HttpResponse.json(subcategory)
    }),

    // Posts
    http.get('/api/posts', ({ request }) => {
        const url = new URL(request.url)
        const subcategoryId = url.searchParams.get('subcategoryId')
        const userId = url.searchParams.get('userId')
        const tag = url.searchParams.get('tag')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const search = url.searchParams.get('search')
        const sortBy = url.searchParams.get('sortBy') || 'date'
        const dateFrom = url.searchParams.get('dateFrom')
        const dateTo = url.searchParams.get('dateTo')
        const followedByUserId = url.searchParams.get('followedByUserId')

        let filteredPosts = [...data.posts]

        if (subcategoryId) {
            filteredPosts = filteredPosts.filter(p => p.subcategoryId === parseInt(subcategoryId))
        }

        if (userId) {
            filteredPosts = filteredPosts.filter(p => p.authorId === parseInt(userId))
        }

        if (followedByUserId) {
            const followingIds = data.subscriptions
                .filter(s => s.followerId === parseInt(followedByUserId))
                .map(s => s.followingId)
            filteredPosts = filteredPosts.filter(p => followingIds.includes(p.authorId))
        }

        if (tag) {
            filteredPosts = filteredPosts.filter(p => p.tags.includes(tag))
        }

        if (search) {
            const searchLower = search.toLowerCase()
            filteredPosts = filteredPosts.filter(p =>
                p.title.toLowerCase().includes(searchLower) ||
                p.content.toLowerCase().includes(searchLower) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchLower))
            )
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom)
            filteredPosts = filteredPosts.filter(p => new Date(p.createdAt) >= fromDate)
        }

        if (dateTo) {
            const toDate = new Date(dateTo)
            filteredPosts = filteredPosts.filter(p => new Date(p.createdAt) <= toDate)
        }

        // Сортировка
        if (sortBy === 'popularity') {
            filteredPosts.sort((a, b) => b.likesCount - a.likesCount)
        } else if (sortBy === 'date') {
            filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }

        const paginatedPosts = filteredPosts.slice(offset, offset + limit)

        return HttpResponse.json({
            posts: paginatedPosts,
            total: filteredPosts.length,
        })
    }),

    http.get('/api/posts/:id', ({ request, params }) => {
        const post = data.posts.find(p => p.id === parseInt(params.id as string))

        if (!post) {
            return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
        }

        // Проверяем, лайкнул ли текущий пользователь пост
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        let isLiked = false
        let isBookmarked = false

        if (token) {
            try {
                const [userId] = atob(token).split(':')
                isLiked = data.postLikes.some(like => like.postId === post.id && like.userId === parseInt(userId))
                isBookmarked = data.bookmarks.some(bookmark => bookmark.postId === post.id && bookmark.userId === parseInt(userId))
            } catch { }
        }

        return HttpResponse.json({
            ...post,
            isLiked,
            isBookmarked,
        })
    }),

    http.post('/api/posts', async ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const body = (await request.json()) as any

        // Проверяем существование подкатегории
        const subcategory = data.subcategories.find(sc => sc.id === body.subcategoryId)
        if (!subcategory) {
            return HttpResponse.json({ message: 'Subcategory not found' }, { status: 404 })
        }

        if (!subcategory.isApproved) {
            return HttpResponse.json({ message: 'Subcategory is not approved' }, { status: 400 })
        }

        const newPost = {
            id: data.posts.length + 1,
            ...body,
            authorId: user.id,
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        data.posts.unshift(newPost)
        return HttpResponse.json(newPost)
    }),

    http.put('/api/posts/:id', async ({ request, params }) => {
        const postId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))
        const post = data.posts.find(p => p.id === postId)

        if (!user || !post) {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        }

        // Проверяем права: автор или модератор
        const isAuthor = post.authorId === user.id
        const isModerator = user.role === 'moderator'
        const isSubcategoryModerator = data.subcategories
            .find(sc => sc.id === post.subcategoryId)
            ?.moderators.includes(user.id)

        if (!isAuthor && !isModerator && !isSubcategoryModerator) {
            return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const updates = (await request.json()) as any
        Object.assign(post, updates, { updatedAt: new Date().toISOString() })

        return HttpResponse.json(post)
    }),

    http.delete('/api/posts/:id', async ({ request, params }) => {
        const postId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))
        const postIndex = data.posts.findIndex(p => p.id === postId)

        if (!user || postIndex === -1) {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        }

        const post = data.posts[postIndex]

        // Проверяем права: автор или модератор
        const isAuthor = post.authorId === user.id
        const isModerator = user.role === 'moderator'
        const isSubcategoryModerator = data.subcategories
            .find(sc => sc.id === post.subcategoryId)
            ?.moderators.includes(user.id)

        if (!isAuthor && !isModerator && !isSubcategoryModerator) {
            return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        data.posts.splice(postIndex, 1)

        // Удаляем связанные данные
        data.comments = data.comments.filter(c => c.postId !== postId)
        data.postLikes = data.postLikes.filter(like => like.postId !== postId)
        data.bookmarks = data.bookmarks.filter(bookmark => bookmark.postId !== postId)

        return HttpResponse.json({})
    }),

    // Comments
    http.get('/api/posts/:id/comments', ({ params }) => {
        const postId = parseInt(params.id as string)
        const comments = data.comments.filter(c => c.postId === postId && c.parentId === null)

        // Build nested structure
        const buildNestedComments = (parentId: number | null): any[] => {
            return data.comments
                .filter(c => c.parentId === parentId && c.postId === postId)
                .map(comment => ({
                    ...comment,
                    replies: buildNestedComments(comment.id)
                }))
        }

        const nestedComments = comments.map(comment => ({
            ...comment,
            replies: buildNestedComments(comment.id)
        }))

        return HttpResponse.json(nestedComments)
    }),

    http.post('/api/comments', async ({ request }) => {
        const body = (await request.json()) as any
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Проверяем существование поста
        const post = data.posts.find(p => p.id === body.postId)
        if (!post) {
            return HttpResponse.json({ message: 'Post not found' }, { status: 404 })
        }

        // Если есть parentId, проверяем существование родительского комментария
        if (body.parentId) {
            const parentComment = data.comments.find(c => c.id === body.parentId)
            if (!parentComment) {
                return HttpResponse.json({ message: 'Parent comment not found' }, { status: 404 })
            }
        }

        const newComment = {
            id: data.comments.length + 1,
            ...body,
            authorId: user.id,
            likesCount: 0,
            createdAt: new Date().toISOString(),
            replies: [],
        }

        data.comments.push(newComment)

        // Update post comments count
        post.commentsCount += 1

        // Создаем уведомление для автора поста (если это не он сам)
        if (post.authorId !== user.id) {
            const notification = {
                id: data.notifications.length + 1,
                type: 'comment' as const,
                userId: post.authorId,
                sourceUserId: user.id,
                sourceUserName: user.username,
                sourceUserAvatar: user.avatar,
                postId: post.id,
                commentId: newComment.id,
                message: `оставил комментарий к вашему посту "${post.title.slice(0, 30)}..."`,
                isRead: false,
                createdAt: new Date().toISOString(),
            }
            data.notifications.push(notification)
        }

        // Если это ответ на комментарий, уведомляем автора родительского комментария
        if (body.parentId) {
            const parentComment = data.comments.find(c => c.id === body.parentId)
            if (parentComment && parentComment.authorId !== user.id) {
                const notification = {
                    id: data.notifications.length + 1,
                    type: 'comment' as const,
                    userId: parentComment.authorId,
                    sourceUserId: user.id,
                    sourceUserName: user.username,
                    sourceUserAvatar: user.avatar,
                    postId: post.id,
                    commentId: newComment.id,
                    message: `ответил на ваш комментарий`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                }
                data.notifications.push(notification)
            }
        }

        return HttpResponse.json(newComment)
    }),

    // Likes
    http.post('/api/posts/:id/like', async ({ request, params }) => {
        const postId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))
        const post = data.posts.find(p => p.id === postId)

        if (!user || !post) {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        }

        // Проверяем, не лайкнул ли уже
        const existingLike = data.postLikes.find(like =>
            like.postId === postId && like.userId === user.id
        )

        if (existingLike) {
            return HttpResponse.json({ message: 'Already liked' }, { status: 400 })
        }

        data.postLikes.push({ postId, userId: user.id })
        post.likesCount += 1

        // Создаем уведомление для автора поста (если это не он сам)
        if (post.authorId !== user.id) {
            const notification = {
                id: data.notifications.length + 1,
                type: 'like' as const,
                userId: post.authorId,
                sourceUserId: user.id,
                sourceUserName: user.username,
                sourceUserAvatar: user.avatar,
                postId: post.id,
                message: `оценил ваш пост "${post.title.slice(0, 30)}..."`,
                isRead: false,
                createdAt: new Date().toISOString(),
            }
            data.notifications.push(notification)
        }

        return HttpResponse.json({})
    }),

    http.delete('/api/posts/:id/like', async ({ request, params }) => {
        const postId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))
        const post = data.posts.find(p => p.id === postId)

        if (!user || !post) {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        }

        const likeIndex = data.postLikes.findIndex(like =>
            like.postId === postId && like.userId === user.id
        )

        if (likeIndex === -1) {
            return HttpResponse.json({ message: 'Not liked' }, { status: 400 })
        }

        data.postLikes.splice(likeIndex, 1)
        post.likesCount = Math.max(0, post.likesCount - 1)

        return HttpResponse.json({})
    }),

    // Bookmarks
    http.post('/api/users/me/bookmarks/:postId', async ({ request, params }) => {
        const postId = parseInt(params.postId as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))
        const post = data.posts.find(p => p.id === postId)

        if (!user || !post) {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        }

        // Проверяем, не добавлен ли уже в закладки
        const existingBookmark = data.bookmarks.find(bookmark =>
            bookmark.postId === postId && bookmark.userId === user.id
        )

        if (existingBookmark) {
            return HttpResponse.json({ message: 'Already bookmarked' }, { status: 400 })
        }

        data.bookmarks.push({ userId: user.id, postId })
        return HttpResponse.json({})
    }),

    http.delete('/api/users/me/bookmarks/:postId', async ({ request, params }) => {
        const postId = parseInt(params.postId as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const bookmarkIndex = data.bookmarks.findIndex(bookmark =>
            bookmark.postId === postId && bookmark.userId === user.id
        )

        if (bookmarkIndex === -1) {
            return HttpResponse.json({ message: 'Not bookmarked' }, { status: 400 })
        }

        data.bookmarks.splice(bookmarkIndex, 1)
        return HttpResponse.json({})
    }),

    http.get('/api/users/me/bookmarks', async ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const userBookmarks = data.bookmarks
            .filter(bookmark => bookmark.userId === user.id)
            .map(bookmark => data.posts.find(p => p.id === bookmark.postId))
            .filter(Boolean)

        return HttpResponse.json({
            posts: userBookmarks,
            total: userBookmarks.length,
        })
    }),

    // Subscriptions
    http.post('/api/users/:id/follow', async ({ request, params }) => {
        const followingId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [followerId] = atob(token).split(':')
        const follower = data.users.find(u => u.id === parseInt(followerId))
        const following = data.users.find(u => u.id === followingId)

        if (!follower || !following) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Проверяем, не подписан ли уже
        const existingSubscription = data.subscriptions.find(sub =>
            sub.followerId === follower.id && sub.followingId === following.id
        )

        if (existingSubscription) {
            return HttpResponse.json({ message: 'Already following' }, { status: 400 })
        }

        data.subscriptions.push({ followerId: follower.id, followingId: following.id })

        // Создаем уведомление
        const notification = {
            id: data.notifications.length + 1,
            type: 'follow' as const,
            userId: following.id,
            sourceUserId: follower.id,
            sourceUserName: follower.username,
            sourceUserAvatar: follower.avatar,
            message: `подписался на вас`,
            isRead: false,
            createdAt: new Date().toISOString(),
        }
        data.notifications.push(notification)

        return HttpResponse.json({})
    }),

    http.delete('/api/users/:id/follow', async ({ request, params }) => {
        const followingId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [followerId] = atob(token).split(':')
        const follower = data.users.find(u => u.id === parseInt(followerId))

        if (!follower) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const subscriptionIndex = data.subscriptions.findIndex(sub =>
            sub.followerId === follower.id && sub.followingId === followingId
        )

        if (subscriptionIndex === -1) {
            return HttpResponse.json({ message: 'Not following' }, { status: 400 })
        }

        data.subscriptions.splice(subscriptionIndex, 1)
        return HttpResponse.json({})
    }),

    // Notifications
    http.get('/api/notifications', ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

        let notifications = data.notifications.filter(n => n.userId === user.id)

        if (unreadOnly) {
            notifications = notifications.filter(n => !n.isRead)
        }

        // Сортировка по дате (новые сначала)
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const paginatedNotifications = notifications.slice(offset, offset + limit)
        const unreadCount = data.notifications.filter(n => n.userId === user.id && !n.isRead).length

        return HttpResponse.json({
            notifications: paginatedNotifications,
            total: notifications.length,
            unreadCount,
        })
    }),

    http.patch('/api/notifications/:id/read', ({ params }) => {
        const notification = data.notifications.find(n => n.id === parseInt(params.id as string))

        if (notification) {
            notification.isRead = true
        }

        return HttpResponse.json({})
    }),

    http.patch('/api/notifications/read-all', ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')

        data.notifications
            .filter(n => n.userId === parseInt(userId) && !n.isRead)
            .forEach(n => n.isRead = true)

        return HttpResponse.json({})
    }),

    // Users (для получения списка)
    http.get('/api/users', ({ request }) => {
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const search = url.searchParams.get('search') || ''

        let filteredUsers = data.users.map(({ password, ...user }) => user)

        if (search) {
            filteredUsers = filteredUsers.filter(user =>
                user.username.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase()) ||
                user.bio.toLowerCase().includes(search.toLowerCase())
            )
        }

        const paginatedUsers = filteredUsers.slice(offset, offset + limit)

        return HttpResponse.json({
            users: paginatedUsers,
            total: filteredUsers.length,
        })
    }),

    // Search
    http.get('/api/search', ({ request }) => {
        const url = new URL(request.url)
        const query = url.searchParams.get('q') || ''
        const categoryId = url.searchParams.get('categoryId')
        const tag = url.searchParams.get('tag')
        const limit = parseInt(url.searchParams.get('limit') || '10')

        const results = {
            posts: data.posts.filter(post => {
                const matchesQuery = query === '' ||
                    post.title.toLowerCase().includes(query.toLowerCase()) ||
                    post.content.toLowerCase().includes(query.toLowerCase()) ||
                    post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))

                const matchesCategory = !categoryId || post.subcategoryId === parseInt(categoryId)
                const matchesTag = !tag || post.tags.includes(tag)

                return matchesQuery && matchesCategory && matchesTag
            }).slice(0, limit),

            users: data.users.filter(user => {
                return user.username.toLowerCase().includes(query.toLowerCase()) ||
                    user.bio.toLowerCase().includes(query.toLowerCase())
            }).map(({ password, ...user }) => user).slice(0, 5),

            subcategories: data.subcategories.filter(subcategory =>
                subcategory.name.toLowerCase().includes(query.toLowerCase()) ||
                subcategory.description.toLowerCase().includes(query.toLowerCase()) ||
                subcategory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            ).slice(0, 5),
        }

        return HttpResponse.json(results)
    }),

    // Tags
    http.get('/api/tags', ({ request }) => {
        const url = new URL(request.url)
        const subcategoryId = url.searchParams.get('subcategoryId')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        // Собираем все теги из подкатегорий
        let allTags: { tag: string, count: number }[] = []

        data.subcategories.forEach(subcategory => {
            if (!subcategoryId || subcategory.id === parseInt(subcategoryId)) {
                subcategory.tags.forEach(tag => {
                    const existing = allTags.find(t => t.tag === tag)
                    if (existing) {
                        existing.count += 1
                    } else {
                        allTags.push({ tag, count: 1 })
                    }
                })
            }
        })

        // Сортировка по популярности
        allTags.sort((a, b) => b.count - a.count)

        return HttpResponse.json(allTags.slice(0, limit))
    }),

    // Password change
    http.put('/api/users/me/password', async ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const userIndex = data.users.findIndex(u => u.id === parseInt(userId))

        if (userIndex === -1) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const { currentPassword, newPassword } = (await request.json()) as any

        if (data.users[userIndex].password !== currentPassword) {
            return HttpResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
        }

        data.users[userIndex].password = newPassword
        return HttpResponse.json({})
    }),

    // Favorites subcategories
    http.get('/api/users/me/favorites/subcategories', async ({ request }) => {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const favoriteSubcategories = data.subcategories.filter(sc =>
            user.favoriteSubcategoryIds.includes(sc.id)
        )

        return HttpResponse.json(favoriteSubcategories)
    }),

    http.post('/api/users/me/favorites/subcategories/:id', async ({ request, params }) => {
        const subcategoryId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const user = data.users.find(u => u.id === parseInt(userId))

        if (!user) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        if (!user.favoriteSubcategoryIds.includes(subcategoryId)) {
            user.favoriteSubcategoryIds.push(subcategoryId)
        }

        return HttpResponse.json({})
    }),

    http.delete('/api/users/me/favorites/subcategories/:id', async ({ request, params }) => {
        const subcategoryId = parseInt(params.id as string)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const [userId] = atob(token).split(':')
        const userIndex = data.users.findIndex(u => u.id === parseInt(userId))

        if (userIndex === -1) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        }

        data.users[userIndex].favoriteSubcategoryIds =
            data.users[userIndex].favoriteSubcategoryIds.filter(id => id !== subcategoryId)

        return HttpResponse.json({})
    }),

    // Fallback
    http.all('/api/*', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }),
]