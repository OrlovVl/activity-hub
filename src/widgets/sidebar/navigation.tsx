import React from 'react'
import {
    FaHome,
    FaTags,
    FaSearch,
    FaStar,
    FaPlusCircle,
    FaUsers,
    FaCompass,
} from 'react-icons/fa'
import { cn } from '@/shared/utils/helpers'
import { useAuth } from '@/app/providers/auth-provider'
import { Link, useLocation } from 'react-router-dom'

interface NavigationItem {
    icon: React.ElementType
    label: string
    path: string
    requiresAuth?: boolean
    highlight?: boolean
}

interface NavigationProps {
    isCollapsed: boolean
    onItemClick?: () => void
}

export function Navigation({ isCollapsed, onItemClick }: NavigationProps) {
    const { user } = useAuth()
    const location = useLocation()

    const mainNavigation: NavigationItem[] = [
        { icon: FaHome, label: 'Главная', path: '/' },
        { icon: FaTags, label: 'Категории', path: '/categories' },
        { icon: FaSearch, label: 'Поиск', path: '/search' },
        { icon: FaCompass, label: 'Исследовать', path: '/explore' },
        { icon: FaUsers, label: 'Сообщество', path: '/community' },
        { icon: FaStar, label: 'Избранное', path: '/favorites', requiresAuth: true },
    ]

    const actionNavigation: NavigationItem[] = user ? [
        { icon: FaPlusCircle, label: 'Создать пост', path: '/posts/create', highlight: true },
    ] : []

    const handleClick = () => {
        if (onItemClick) {
            onItemClick()
        }
    }

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === path
        }
        return location.pathname.startsWith(path)
    }

    return (
        <div className="space-y-6">
            {/* Основная навигация */}
            <div>
                <h3 className={cn(
                    'px-3 mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider',
                    isCollapsed && 'sr-only'
                )}>
                    Навигация
                </h3>
                <nav className="space-y-1">
                    {mainNavigation.map((item) => {
                        if (item.requiresAuth && !user) return null

                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={handleClick}
                                className={cn(
                                    'flex items-center px-3 py-2 rounded-lg transition-colors',
                                    'hover:bg-stone-100 dark:hover:bg-stone-800',
                                    'text-stone-700 dark:text-stone-300',
                                    isActive(item.path) && 'bg-stone-100 dark:bg-stone-800',
                                    isCollapsed ? 'justify-center' : 'justify-start space-x-3'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium truncate">{item.label}</span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Действия */}
            {actionNavigation.length > 0 && (
                <div>
                    <h3 className={cn(
                        'px-3 mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider',
                        isCollapsed && 'sr-only'
                    )}>
                        Действия
                    </h3>
                    <nav className="space-y-1">
                        {actionNavigation.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={handleClick}
                                className={cn(
                                    'flex items-center px-3 py-2 rounded-lg transition-colors',
                                    item.highlight
                                        ? 'bg-[#ffc09e] hover:bg-[#ffb08a] text-amber-800'
                                        : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300',
                                    isCollapsed ? 'justify-center' : 'justify-start space-x-3'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium truncate">{item.label}</span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    )
}