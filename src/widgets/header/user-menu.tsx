import { FaUser, FaCog, FaSun, FaMoon, FaSignOutAlt } from 'react-icons/fa'
import { Avatar } from '@/shared/ui/avatar'
import { Dropdown, DropdownItem } from '@features/ui/dropdown'
import { useAuth } from '@/app/providers/auth-provider'
import { useTheme } from '@/app/providers/theme-provider'
import { useNavigate } from 'react-router-dom'

export function UserMenu() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    if (!user) return null

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    return (
        <Dropdown
            trigger={
                <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                    <Avatar
                        size="sm"
                        fallback={(user.username || 'U').slice(0, 2).toUpperCase()}
                    />
                    <span className="hidden sm:inline text-sm font-medium text-stone-700 dark:text-stone-300">
                        {user.username}
                    </span>
                </button>
            }
            align="right"
        >
            <div className="py-2">
                <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-700 mb-2">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                        {user.username}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-500">
                        {user.email}
                    </p>
                </div>

                <DropdownItem onClick={() => navigate('/profile')}>
                    <div className="flex items-center space-x-3">
                        <FaUser className="w-4 h-4 text-stone-400" />
                        <span>Профиль</span>
                    </div>
                </DropdownItem>

                <DropdownItem onClick={() => navigate('/settings')}>
                    <div className="flex items-center space-x-3">
                        <FaCog className="w-4 h-4 text-stone-400" />
                        <span>Настройки</span>
                    </div>
                </DropdownItem>

                <DropdownItem onClick={toggleTheme}>
                    <div className="flex items-center space-x-3">
                        {theme === 'light' ? (
                            <FaMoon className="w-4 h-4 text-stone-400" />
                        ) : (
                            <FaSun className="w-4 h-4 text-stone-400" />
                        )}
                        <span>Сменить тему</span>
                    </div>
                </DropdownItem>

                <div className="border-t border-stone-200 dark:border-stone-700 mt-2 pt-2">
                    <DropdownItem onClick={handleLogout}>
                        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                            <FaSignOutAlt className="w-4 h-4" />
                            <span>Выйти</span>
                        </div>
                    </DropdownItem>
                </div>
            </div>
        </Dropdown>
    )
}