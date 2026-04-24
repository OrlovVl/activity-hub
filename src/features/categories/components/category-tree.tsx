import { useState } from 'react'
import { FaChevronDown, FaChevronRight, FaStar, FaRegStar } from 'react-icons/fa'
import { MainCategory, Subcategory } from '../types'
import { cn } from '@/shared/utils/helpers'
import { useAuth } from '@/app/providers/auth-provider'

interface CategoryTreeProps {
    categories: {
        mainCategory: MainCategory
        subcategories: Subcategory[]
    }[]
    onSubcategoryClick?: (subcategory: Subcategory) => void
    onFavoriteToggle?: (subcategoryId: number) => void
}

export function CategoryTree({
    categories,
    onSubcategoryClick,
    onFavoriteToggle
}: CategoryTreeProps) {
    const [expandedCategories, setExpandedCategories] = useState<number[]>([])
    const { user } = useAuth()

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const isFavorite = (subcategoryId: number) => {
        return user?.favoriteSubcategoryIds.includes(subcategoryId) || false
    }

    return (
        <div className="space-y-2">
            {categories.map(({ mainCategory, subcategories }) => (
                <div key={mainCategory.id} className="border rounded-lg">
                    <button
                        onClick={() => toggleCategory(mainCategory.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                                style={{ backgroundColor: `${mainCategory.color}20` }}>
                                <span style={{ color: mainCategory.color }} className="text-lg">
                                    {mainCategory.iconKey === 'ground-travel' && '🚗'}
                                    {mainCategory.iconKey === 'water-activities' && '🌊'}
                                    {mainCategory.iconKey === 'air-travel' && '✈️'}
                                    {mainCategory.iconKey === 'active-leisure' && '🥾'}
                                    {mainCategory.iconKey === 'extreme' && '⚡'}
                                    {mainCategory.iconKey === 'music-creative' && '🎵'}
                                </span>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                                    {mainCategory.name}
                                </h3>
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    {mainCategory.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-stone-500 dark:text-stone-500">
                                {subcategories.length}
                            </span>
                            {expandedCategories.includes(mainCategory.id) ? (
                                <FaChevronDown className="w-4 h-4 text-stone-400" />
                            ) : (
                                <FaChevronRight className="w-4 h-4 text-stone-400" />
                            )}
                        </div>
                    </button>

                    {expandedCategories.includes(mainCategory.id) && (
                        <div className="border-t p-2 space-y-1">
                            {subcategories.map(subcategory => (
                                <div
                                    key={subcategory.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors"
                                >
                                    <button
                                        onClick={() => onSubcategoryClick?.(subcategory)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className={cn(
                                                'w-2 h-2 rounded-full',
                                                subcategory.isApproved ? 'bg-green-500' : 'bg-yellow-500'
                                            )} />
                                            <span className="text-stone-700 dark:text-stone-300">
                                                {subcategory.name}
                                            </span>
                                        </div>
                                        {subcategory.description && (
                                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                                {subcategory.description}
                                            </p>
                                        )}
                                    </button>

                                    {user && onFavoriteToggle && (
                                        <button
                                            onClick={() => onFavoriteToggle(subcategory.id)}
                                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
                                        >
                                            {isFavorite(subcategory.id) ? (
                                                <FaStar className="w-4 h-4 text-amber-500" />
                                            ) : (
                                                <FaRegStar className="w-4 h-4 text-stone-400" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
