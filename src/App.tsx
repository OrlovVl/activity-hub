import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './app/providers'
import { AppRouter } from './app/router'
import { Layout } from '@widgets/layout/layout'
import { Suspense } from 'react'

// Loading component
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppProviders>
                <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                        <AppRouter />
                    </Suspense>
                </Layout>
            </AppProviders>
        </BrowserRouter>
    )
}

export { App }