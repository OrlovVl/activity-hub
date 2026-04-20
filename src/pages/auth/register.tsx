import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { registerSchema } from '@features/auth/schemas'
import { useAuth } from '@/app/providers/auth-provider'
import { useNavigate } from 'react-router-dom'

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
    onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = React.useState('')

    const {
        register: registerField,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setError('')
            await register(data.email, data.password, data.username)
            onSuccess?.()
            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка регистрации')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Регистрация</CardTitle>
                <CardDescription>
                    Создайте новый аккаунт
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
                        {...registerField('email')}
                        error={errors.email?.message}
                    />

                    <Input
                        label="Имя пользователя"
                        placeholder="username"
                        {...registerField('username')}
                        error={errors.username?.message}
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        placeholder="••••••••"
                        {...registerField('password')}
                        error={errors.password?.message}
                    />

                    <Input
                        label="Подтверждение пароля"
                        type="password"
                        placeholder="••••••••"
                        {...registerField('confirmPassword')}
                        error={errors.confirmPassword?.message}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" loading={isSubmitting}>
                        Зарегистрироваться
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

export function RegisterPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md">
                <RegisterForm />
            </div>
        </div>
    )
}

export default RegisterPage
