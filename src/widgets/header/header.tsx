import { FaBars, FaPlus } from 'react-icons/fa'
import { useUIStore } from '@/app/store/ui-store'
import { useAuth } from '@/app/providers/auth-provider'
import { UserMenu } from '@widgets/header/user-menu'
import { Button } from '@/shared/ui/button'
import { ThemeToggle } from '@features/ui/theme-toggle'
import { Link, useNavigate } from 'react-router-dom'

export function Header() {
    const { setMobileSidebarOpen } = useUIStore()
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleCreatePost = () => {
        navigate('/posts/create')
    }

    return (
        <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                        <FaBars className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                    </button>

                    <div className="flex items-center space-x-2">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#ffc09e] to-amber-300 rounded-lg" />
                            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                                ActivityHub
                            </h1>
                        </Link>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-2">
                    <ThemeToggle />

                    {user ? (
                        <>
                            <Button
                                onClick={handleCreatePost}
                                icon={<FaPlus />}
                                className="hidden sm:flex"
                            >
                                Создать пост
                            </Button>

                            <UserMenu />
                        </>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login')}
                            >
                                Войти
                            </Button>
                            <Button
                                onClick={() => navigate('/register')}
                            >
                                Регистрация
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}