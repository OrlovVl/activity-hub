import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/helpers'
import { MainCategory, Subcategory } from '@features/categories/types'

const postSchema = z.object({
    title: z.string()
        .min(3, 'Заголовок должен быть не менее 3 символов')
        .max(200, 'Заголовок слишком длинный'),
    content: z.string()
        .min(10, 'Содержание должно быть не менее 10 символов')
        .max(5000, 'Содержание слишком длинное'),
    subcategoryId: z.number().min(1, 'Выберите подкатегорию'),
})

type PostFormData = z.infer<typeof postSchema>

interface PostEditorProps {
    mainCategories: MainCategory[]
    subcategories: Subcategory[]
    onSubmit: (data: PostFormData) => Promise<void>
    onCancel: () => void
    initialData?: Partial<PostFormData>
    isSubmitting?: boolean
}

export function PostEditor({
    mainCategories,
    subcategories,
    onSubmit,
    onCancel,
    initialData,
    isSubmitting = false
}: PostEditorProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined)

    // Создаем дерево категорий из mainCategories и подкатегорий с сервера
    const categoryTree = mainCategories.map((cat) => ({
        mainCategory: cat,
        subcategories: subcategories.filter(sub => sub.mainCategoryId === cat.id && sub.isApproved)
    }))

    // Устанавливаем selectedCategoryId на основе initialData
    useEffect(() => {
        if (initialData?.subcategoryId) {
            const subcategory = subcategories.find(s => s.id === initialData.subcategoryId)
            if (subcategory) {
                setSelectedCategoryId(subcategory.mainCategoryId)
            }
        }
    }, [initialData?.subcategoryId, subcategories])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: initialData?.title || '',
            content: initialData?.content || '',
            subcategoryId: initialData?.subcategoryId || undefined,
        },
    })

    // selectedSubcategoryId используется для будущей функциональности
    // const selectedSubcategoryId = watch('subcategoryId')

    // Получаем подкатегории для выбранной категории
    const filteredSubcategories = selectedCategoryId
        ? subcategories.filter(s => s.mainCategoryId === selectedCategoryId && s.isApproved)
        : []

    const onSubmitForm = async (data: PostFormData) => {
        await onSubmit(data)
    }

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            {/* Title */}
            <Input
                label="Заголовок"
                {...register('title')}
                error={errors.title?.message}
                placeholder="Введите заголовок поста"
                disabled={isSubmitting}
            />

            {/* Category */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Категория *
                </label>
                <select
                    value={selectedCategoryId || ''}
                    onChange={(e) => {
                        const categoryId = parseInt(e.target.value)
                        setSelectedCategoryId(categoryId)
                        setValue('subcategoryId', 0)
                    }}
                    className={cn(
                        'w-full px-3 py-2 border rounded-lg transition-colors',
                        'bg-white dark:bg-stone-800',
                        'border-stone-300 dark:border-stone-700',
                        'text-stone-900 dark:text-stone-100',
                        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                        !selectedCategoryId && 'border-red-500 focus:ring-red-500'
                    )}
                    disabled={isSubmitting}
                >
                    <option value="">Выберите категорию</option>
                    {categoryTree.filter(cat => cat.subcategories.length > 0).map(category => (
                        <option key={category.mainCategory.id} value={category.mainCategory.id}>
                            {category.mainCategory.name}
                        </option>
                    ))}
                </select>
                {!selectedCategoryId && (
                    <p className="text-sm text-red-600 dark:text-red-400">Выберите категорию</p>
                )}
            </div>

            {/* Subcategory */}
            {selectedCategoryId && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                        Подкатегория *
                    </label>
                    <select
                        {...register('subcategoryId', { valueAsNumber: true })}
                        onChange={(e) => {
                            const subcategoryId = parseInt(e.target.value)
                            setValue('subcategoryId', subcategoryId)
                        }}
                        className={cn(
                            'w-full px-3 py-2 border rounded-lg transition-colors',
                            'bg-white dark:bg-stone-800',
                            'border-stone-300 dark:border-stone-700',
                            'text-stone-900 dark:text-stone-100',
                            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                            errors.subcategoryId && 'border-red-500 focus:ring-red-500'
                        )}
                        disabled={isSubmitting}
                    >
                        <option value="">Выберите подкатегорию</option>
                        {filteredSubcategories.map(subcategory => (
                            <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </option>
                        ))}
                    </select>
                    {errors.subcategoryId && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.subcategoryId.message}</p>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Содержание *
                </label>
                <textarea
                    {...register('content')}
                    rows={8}
                    className={cn(
                        'w-full px-3 py-2 border rounded-lg transition-colors',
                        'bg-white dark:bg-stone-800',
                        'border-stone-300 dark:border-stone-700',
                        'text-stone-900 dark:text-stone-100',
                        'placeholder:text-stone-400 dark:placeholder:text-stone-500',
                        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                        errors.content && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Расскажите о своей активности..."
                    disabled={isSubmitting}
                />
                {errors.content && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
                )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200 dark:border-stone-700">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Отмена
                </Button>
                <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    Опубликовать
                </Button>
            </div>
        </form>
    )
}