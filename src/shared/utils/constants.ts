export const GLOBAL_COLOR_SCHEME = {
    light: {
        background: 'bg-gradient-to-br from-amber-50 to-stone-50',
        card: 'bg-white/80 backdrop-blur-sm',
        accent: {
            primary: 'bg-[#ffc09e] hover:bg-[#ffb08a]',
            secondary: 'bg-amber-100 hover:bg-amber-200',
            text: 'text-amber-800',
            border: 'border-amber-300',
        },
        text: {
            primary: 'text-stone-900',
            secondary: 'text-stone-600',
            muted: 'text-stone-400',
        },
        border: 'border-stone-200',
    },
    dark: {
        background: 'bg-gradient-to-br from-stone-900 to-stone-800',
        card: 'bg-stone-800/60 backdrop-blur-sm',
        accent: {
            primary: 'bg-[#ffc09e] hover:bg-[#ffb08a]',
            secondary: 'bg-amber-900/30 hover:bg-amber-900/50',
            text: 'text-amber-300',
            border: 'border-amber-700',
        },
        text: {
            primary: 'text-stone-100',
            secondary: 'text-stone-300',
            muted: 'text-stone-500',
        },
        border: 'border-stone-700',
    }
} as const