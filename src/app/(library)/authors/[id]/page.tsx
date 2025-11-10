// src/app/(library)/authors/[id]/page.tsx
import Link from 'next/link'
import { AuthorActions } from '@/features/library/authors/components/AuthorActions'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? ''

async function getAuthor(id: string) {
    const res = await fetch(`${BASE}/api/authors/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Autor no encontrado')
    return res.json()
}

async function getStats(id: string) {
    const res = await fetch(`${BASE}/api/authors/${id}/stats`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
}

async function getAuthorBooks(id: string) {
    const res = await fetch(`${BASE}/api/authors/${id}/books`, { cache: 'no-store' })
    if (!res.ok) return { books: [], totalBooks: 0 }
    return res.json()
}

export default async function AuthorDetailPage({ params }: { params: { id: string } }) {
    const id = params.id
    const [author, stats, booksData] = await Promise.all([
        getAuthor(id),
        getStats(id),
        getAuthorBooks(id),
    ])

    return (
        <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
            <div className="rounded-2xl border p-6 bg-gradient-to-tr from-white to-gray-50 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{author.name}</h1>
                    <p className="text-sm text-gray-600 mt-1">{author.email}</p>
                </div>
                <Link href="/books" className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50">
                    🔎 Buscar libros
                </Link>
            </div>

            {stats && (
                <section className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border p-5 bg-white/60">
                        <h2 className="font-semibold mb-3">Estadísticas</h2>
                        <ul className="text-sm space-y-2">
                            <li className="flex justify-between">
                                <span className="text-gray-600">Total de libros</span>
                                <b>{stats.totalBooks}</b>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Primer libro</span>
                                <span><b>{stats.firstBook?.title ?? '—'}</b> <span className="text-gray-500">({stats.firstBook?.year ?? 's/f'})</span></span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Último libro</span>
                                <span><b>{stats.latestBook?.title ?? '—'}</b> <span className="text-gray-500">({stats.latestBook?.year ?? 's/f'})</span></span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Promedio páginas</span>
                                <b>{stats.averagePages}</b>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Géneros</span>
                                <b>{(stats.genres || []).join(', ') || '—'}</b>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Más páginas</span>
                                <span><b>{stats.longestBook?.title ?? '—'}</b> ({stats.longestBook?.pages ?? '—'})</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-600">Menos páginas</span>
                                <span><b>{stats.shortestBook?.title ?? '—'}</b> ({stats.shortestBook?.pages ?? '—'})</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border p-5 bg-white/60">
                        <AuthorActions author={author} />
                    </div>
                </section>
            )}

            <section className="rounded-2xl border overflow-hidden">
                <div className="p-5 border-b bg-white/60">
                    <h2 className="font-semibold">Libros</h2>
                </div>
                <div className="p-5 space-y-3">
                    {(booksData?.books || []).map((b: any) => (
                        <div key={b.id} className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition">
                            <div>
                                <div className="font-medium">{b.title}</div>
                                <div className="text-sm text-gray-600">
                                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 mr-2 text-xs">
                                        {b.genre ?? '—'}
                                    </span>
                                    {b.publishedYear ?? 's/f'}
                                </div>
                            </div>
                            <div className="text-sm opacity-70">{b.pages ?? '—'} pág</div>
                        </div>
                    ))}

                    {booksData?.totalBooks === 0 && (
                        <div className="text-sm text-gray-500">Este autor no tiene libros aún.</div>
                    )}
                </div>
            </section>
        </main>
    )
}
