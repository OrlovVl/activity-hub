export interface MainCategory {
    id: number
    name: string
    description: string
    iconKey?: string
    color?: string
}

export interface Subcategory {
    id: number
    name: string
    description: string
    mainCategoryId: number
    isApproved: boolean
    createdAt: string
}

export interface CategoryTree {
    mainCategory: MainCategory
    subcategories: Subcategory[]
}