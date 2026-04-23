import { useState } from 'react'
import { FaKey, FaGlobe } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ThemeToggle } from '@features/ui/theme-toggle'
import { useAuth } from '@/app/providers/auth-provider'
import { authApi } from '@/features/auth/api'

export function SettingsPage() {
    const { user } = useAuth()
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    if (!user) return null

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value
        const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value
        const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Новые пароли не совпадают' })
            return
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Пароль должен быть не менее 6 символов' })
            return
        }

        setIsSubmitting(true)
        setMessage(null)

        try {
            await authApi.changePassword(currentPassword, newPassword)
            setMessage({ type: 'success', text: 'Пароль успешно изменен' })
            ;(form.elements.namedItem('currentPassword') as HTMLInputElement).value = ''
            ;(form.elements.namedItem('newPassword') as HTMLInputElement).value = ''
            ;(form.elements.namedItem('confirmPassword') as HTMLInputElement).value = ''
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ошибка при смене пароля' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                Настройки
            </h1>

            {message && (
                <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Password Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaKey className="w-5 h-5 mr-2 text-stone-500" />
                        Смена пароля
                    </CardTitle>
                    <CardDescription>
                        Измените пароль вашего аккаунта
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    label="Текущий пароль"
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="currentPassword"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-[34px] text-stone-500 hover:text-stone-700"
                                >
                                    {showCurrentPassword ? 'Скрыть' : 'Показать'}
                                </button>
                            </div>
                            <Input
                                label="Новый пароль"
                                type="password"
                                name="newPassword"
                                placeholder="••••••••"
                                required
                            />
                            <Input
                                label="Подтверждение нового пароля"
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                required
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                Изменить пароль
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaGlobe className="w-5 h-5 mr-2 text-stone-500" />
                        Внешний вид
                    </CardTitle>
                    <CardDescription>
                        Настройте внешний вид приложения
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                                Тема оформления
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                Выберите светлую или темную тему
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SettingsPage