import { Modal } from '@/shared/ui/modal'
import { PostEditor } from '@features/posts/components/post-editor'
import { MainCategory, Subcategory } from '@features/categories/types'

interface CreatePostModalProps {
    isOpen: boolean
    onClose: () => void
    mainCategories: MainCategory[]
    subcategories: Subcategory[]
    onSubmit: (data: any) => Promise<void>
}

export function CreatePostModal({ isOpen, onClose, mainCategories, subcategories, onSubmit }: CreatePostModalProps) {
    const handleSubmit = async (data: any) => {
        await onSubmit(data)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Создать пост"
            size="xl"
        >
            <PostEditor
                mainCategories={mainCategories}
                subcategories={subcategories}
                onSubmit={handleSubmit}
                onCancel={onClose}
            />
        </Modal>
    )
}