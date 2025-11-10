// src/app/(library)/page.tsx
import Link from 'next/link'
import { AuthorsTable } from '@/features/library/authors/components/AuthorsTable'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? ''

async function getAuthors() {
    const res = await fetch(`${BASE}/api/authors`, { cache: 'no-store' })
    if (!res.ok) throw new Error('No se pudieron cargar autores')
    return res.json()
}

async function getTotalBooks(): Promise<number> {
    const res = await fetch(`${BASE}/api/books/search?limit=1`, { cache: 'no-store' })
    if (!res.ok) return 0
    const json = await res.json()
    return Number(json?.pagination?.total ?? 0)
}

export default async function DashboardPage() {
    const [authors, totalBooks] = await Promise.all([getAuthors(), getTotalBooks()])

    return (
        <main className="px-6 py-8 max-w-7xl mx-auto space-y-8">
            {/* Hero */}
            <header className="rounded-2xl border bg-gradient-to-tr from-white to-gray-50 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                Biblioteca
                            </span>
                        </h1>
                        <p className="text-sm md:text-base text-gray-600 mt-2">
                            Administra autores y libros, busca por filtros y revisa estadísticas.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/books"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-gray-900 transition"
                        >
                            🔎 Búsqueda de libros
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-5 bg-white/50">
                    <div className="text-xs uppercase tracking-wider text-gray-500">Autores</div>
                    <div className="mt-2 flex items-end gap-2">
                        <div className="text-3xl font-bold">{authors.length}</div>
                        <span className="text-gray-500 text-sm">registrados</span>
                    </div>
                </div>
                <div className="rounded-2xl border p-5 bg-white/50">
                    <div className="text-xs uppercase tracking-wider text-gray-500">Libros</div>
                    <div className="mt-2 flex items-end gap-2">
                        <div className="text-3xl font-bold">{totalBooks}</div>
                        <span className="text-gray-500 text-sm">en total</span>
                    </div>
                </div>
            </section>

            {/* Tabla autores */}
            <section className="rounded-2xl border bg-white/50">
                <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="font-semibold">Autores</h2>
                    <span className="text-xs text-gray-500">Crea, edita o elimina</span>
                </div>
                <div className="p-4 md:p-6">
                    <AuthorsTable initialAuthors={authors} />
                </div>
            </section>
        </main>
    )
}
