import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { FaPlus, FaTimes } from 'react-icons/fa'
import { cn } from '@/shared/utils/helpers'
import { Subcategory } from '@features/categories/types'

const postSchema = z.object({
    title: z.string()
        .min(3, 'Заголовок должен быть не менее 3 символов')
        .max(200, 'Заголовок слишком длинный'),
    content: z.string()
        .min(10, 'Содержание должно быть не менее 10 символов')
        .max(5000, 'Содержание слишком длинное'),
    subcategoryId: z.number().min(1, 'Выберите категорию'),
    tags: z.array(z.string())
        .min(1, 'Добавьте хотя бы один тег')
        .max(10, 'Максимум 10 тегов'),
})

type PostFormData = z.infer<typeof postSchema>

interface PostEditorProps {
    subcategories: Subcategory[]
    onSubmit: (data: PostFormData) => Promise<void>
    onCancel: () => void
    initialData?: Partial<PostFormData>
    isSubmitting?: boolean
}

export function PostEditor({
    subcategories,
    onSubmit,
    onCancel,
    initialData,
    isSubmitting = false
}: PostEditorProps) {
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>(initialData?.tags || [])
    const [availableTags, setAvailableTags] = useState<string[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: initialData?.title || '',
            content: initialData?.content || '',
            subcategoryId: initialData?.subcategoryId || undefined,
            tags: initialData?.tags || [],
        },
    })

    const selectedSubcategoryId = watch('subcategoryId')

    // Загружаем теги для выбранной подкатегории
    useState(() => {
        if (selectedSubcategoryId) {
            const subcategory = subcategories.find(s => s.id === selectedSubcategoryId)
            if (subcategory) {
                setAvailableTags(subcategory.tags)
            }
        }
    })

    const addTag = () => {
        const trimmed = tagInput.trim().toLowerCase()
        if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
            const newTags = [...tags, trimmed]
            setTags(newTags)
            setValue('tags', newTags)
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove)
        setTags(newTags)
        setValue('tags', newTags)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }

    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subcategoryId = parseInt(e.target.value)
        setValue('subcategoryId', subcategoryId)

        // Обновляем доступные теги для выбранной подкатегории
        const subcategory = subcategories.find(s => s.id === subcategoryId)
        if (subcategory) {
            setAvailableTags(subcategory.tags)
        }
    }

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

            {/* Subcategory */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Категория *
                </label>
                <select
                    {...register('subcategoryId', { valueAsNumber: true })}
                    onChange={handleSubcategoryChange}
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
                    <option value="">Выберите категорию</option>
                    {subcategories
                        .filter(s => s.isApproved)
                        .map(subcategory => (
                            <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </option>
                        ))}
                </select>
                {errors.subcategoryId && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.subcategoryId.message}</p>
                )}
            </div>

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

            {/* Tags */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Теги * (максимум 10)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm"
                        >
                            #{tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 hover:text-red-500"
                                disabled={isSubmitting}
                            >
                                <FaTimes className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Предлагаемые теги */}
                {availableTags.length > 0 && (
                    <div className="mb-2">
                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                            Популярные теги для этой категории:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {availableTags
                                .filter(tag => !tags.includes(tag))
                                .slice(0, 10)
                                .map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            if (!tags.includes(tag) && tags.length < 10) {
                                                const newTags = [...tags, tag]
                                                setTags(newTags)
                                                setValue('tags', newTags)
                                            }
                                        }}
                                        className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700"
                                        disabled={isSubmitting || tags.length >= 10}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                <div className="flex space-x-2">
                    <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Введите тег и нажмите Enter"
                        className="flex-1"
                        disabled={isSubmitting || tags.length >= 10}
                    />
                    <Button
                        type="button"
                        onClick={addTag}
                        disabled={tags.length >= 10 || isSubmitting}
                    >
                        <FaPlus />
                    </Button>
                </div>
                {errors.tags && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.tags.message}</p>
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