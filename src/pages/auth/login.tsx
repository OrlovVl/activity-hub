import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { loginSchema } from '@features/auth/schemas'
import { useAuth } from '@/app/providers/auth-provider'
import { useNavigate } from 'react-router-dom'

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
    onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = React.useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError('')
            await login(data.email, data.password)
            onSuccess?.()
            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Вход в аккаунт</CardTitle>
                <CardDescription>
                    Введите свои учетные данные для входа
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        placeholder="your@email.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                </CardContent>
                <CardFooter className="flex-col space-y-4">
                    <Button type="submit" className="w-full" loading={isSubmitting}>
                        Войти
                    </Button>
                    <div className="text-center text-sm text-stone-600 dark:text-stone-400">
                        Забыли пароль?{' '}
                        <button
                            type="button"
                            className="text-amber-600 dark:text-amber-400 hover:underline"
                            onClick={() => navigate('/reset-password')}
                        >
                            Восстановить
                        </button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}

export function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md">
                <LoginForm />
            </div>
        </div>
    )
}

export default LoginPage
