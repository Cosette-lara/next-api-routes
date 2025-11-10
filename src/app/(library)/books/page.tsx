// src/app/(library)/books/page.tsx
import { BooksBrowser } from '@/features/library/books/components/BooksBrowser'

export default function BooksPage() {
    return (
        <main className="px-6 py-8 max-w-7xl mx-auto space-y-6">
            <header className="rounded-2xl border p-6 bg-gradient-to-tr from-gray to-black-100">
                <h1 className="text-2xl md:text-3xl font-bold">Búsqueda de libros</h1>
                <p className="text-sm text-gray-600 mt-2">
                    Usa búsqueda, filtros y orden para encontrar rápidamente.
                </p>
            </header>
            <BooksBrowser />
        </main>
    )
}
