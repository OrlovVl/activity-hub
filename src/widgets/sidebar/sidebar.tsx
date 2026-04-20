import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useUIStore } from '@/app/store/ui-store'
import { cn } from '@/shared/utils/helpers'
import { Button } from '@/shared/ui/button'
import { Navigation } from '@widgets/sidebar/navigation'
import { useRef } from 'react'
import { useClickOutside } from '@/shared/hooks/use-click-outside'
import { Link } from 'react-router-dom'

export function Sidebar() {
    const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
    const sidebarRef = useRef<HTMLDivElement>(null)

    const handleNavClick = () => {
        setMobileSidebarOpen(false)
    }

    useClickOutside(sidebarRef, () => {
        if (mobileSidebarOpen) {
            setMobileSidebarOpen(false)
        }
    })

    const sidebarContent = (
        <div
            ref={sidebarRef}
            className="h-full flex flex-col bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm"
        >
            {/* Logo */}
            <div className={cn(
                'p-4 border-b border-stone-200 dark:border-stone-700 lg:hidden',
                !sidebarOpen && 'flex justify-center'
            )}>
                <Link
                    to="/"
                    className={cn(
                        'flex items-center space-x-3',
                        !sidebarOpen && 'justify-center'
                    )}
                    onClick={handleNavClick}
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ffc09e] to-amber-300 rounded-lg" />
                    <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                        ActivityHub
                    </span>
                </Link>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 p-4 overflow-y-auto">
                <Navigation
                    isCollapsed={!sidebarOpen}
                    onItemClick={handleNavClick}
                />
            </div>

            {/* Быстрый доступ удалён */}
            <div className="hidden">
                {/* Раздел быстрого доступа больше не используется */}
            </div>

            {/* Toggle Button (Desktop only) */}
            <div className="hidden lg:block p-4 border-t border-stone-200 dark:border-stone-700">
                <Button
                    variant="ghost"
                    onClick={toggleSidebar}
                    className="w-full justify-center"
                    icon={sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
                >
                    {sidebarOpen && 'Свернуть'}
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn(
                'hidden lg:block transition-all duration-300 border-r border-stone-200 dark:border-stone-700',
                sidebarOpen ? 'w-64' : 'w-20'
            )}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-64 transform transition-transform">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    )
}