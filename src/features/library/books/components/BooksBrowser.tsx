// src/features/library/books/components/BooksBrowser.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type AuthorOption = { id: string; name: string }

type Book = {
    id: string
    title: string
    description: string | null
    isbn?: string | null
    publishedYear?: number | null
    genre?: string | null
    pages?: number | null
    author: { id: string; name: string }
    createdAt?: string
}

type SearchResponse = {
    data: Book[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

type Props = {
    initialAuthors?: AuthorOption[]
}

export function BooksBrowser({ initialAuthors = [] }: Props) {
    // ---- filtros / estado UI ----
    const [search, setSearch] = useState('')
    const [genre, setGenre] = useState('')
    const [authorName, setAuthorName] = useState('')
    const [sortBy, setSortBy] = useState<'title' | 'publishedYear' | 'createdAt'>('createdAt')
    const [order, setOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)

    // ---- autores (dropdown) ----
    const [authors, setAuthors] = useState<AuthorOption[]>(Array.isArray(initialAuthors) ? initialAuthors : [])

    // Fallback (opcional): si no vino nada del server, intenta fetch al API
    useEffect(() => {
        if (initialAuthors.length > 0) return
            ; (async () => {
                try {
                    const r = await fetch('/api/authors', { cache: 'no-store' })
                    const j = await r.json()
                    const arr: AuthorOption[] = Array.isArray(j)
                        ? j.map((a: any) => ({ id: a.id, name: a.name }))
                        : Array.isArray(j?.data)
                            ? j.data.map((a: any) => ({ id: a.id, name: a.name }))
                            : []
                    setAuthors(arr)
                } catch {
                    setAuthors([])
                }
            })()
    }, [initialAuthors])

    // Asegura que siempre sea array
    const authorOptions = useMemo<AuthorOption[]>(
        () => (Array.isArray(authors) ? authors : []),
        [authors]
    )

    // ---- resultados búsqueda ----
    const [rows, setRows] = useState<Book[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Fetch a /api/books/search cuando cambian filtros
    useEffect(() => {
        let cancelled = false
            ; (async () => {
                setLoading(true)
                setErrorMsg(null)
                try {
                    const params = new URLSearchParams()
                    if (search.trim()) params.set('search', search.trim())
                    if (genre.trim()) params.set('genre', genre.trim())
                    if (authorName.trim()) params.set('authorName', authorName.trim())
                    params.set('page', String(page))
                    params.set('limit', String(limit))
                    params.set('sortBy', sortBy)
                    params.set('order', order)

                    const res = await fetch(`/api/books/search?${params.toString()}`, { cache: 'no-store' })
                    const data: SearchResponse | { error: string; detail?: string } = await res.json()

                    if (!res.ok || !('data' in data) || !Array.isArray(data.data)) {
                        const detail = (data as any)?.detail || (data as any)?.error || 'Error desconocido'
                        throw new Error(detail)
                    }

                    if (!cancelled) {
                        setRows(data.data)
                        setTotal(data.pagination.total)
                        setTotalPages(data.pagination.totalPages)
                    }
                } catch (e: any) {
                    if (!cancelled) {
                        setRows([])
                        setTotal(0)
                        setTotalPages(1)
                        setErrorMsg(e?.message ?? 'Error al buscar libros')
                    }
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => {
            cancelled = true
        }
    }, [search, genre, authorName, page, limit, sortBy, order])

    // Para cambiar limit resetea page
    const changeLimit = (n: number) => {
        setPage(1)
        setLimit(n)
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Búsqueda (título)</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ej. amor"
                        value={search}
                        onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">Género</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ej. Novela"
                        value={genre}
                        onChange={(e) => { setPage(1); setGenre(e.target.value) }}
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">Autor</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={authorName}
                        onChange={(e) => { setPage(1); setAuthorName(e.target.value) }}
                    >
                        <option value="">Todos los autores</option>
                        {authorOptions.length > 0
                            ? authorOptions.map((a) => (
                                <option key={a.id} value={a.name}>
                                    {a.name}
                                </option>
                            ))
                            : <option disabled>(sin autores)</option>
                        }
                    </select>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-sm mb-1">Ordenar por</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="createdAt">Fecha creación</option>
                            <option value="title">Título</option>
                            <option value="publishedYear">Año publicación</option>
                        </select>
                    </div>

                    <div className="w-28">
                        <label className="block text-sm mb-1">Orden</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={order}
                            onChange={(e) => setOrder(e.target.value as any)}
                        >
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Barra de total + limit */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    {loading ? 'Buscando…' : `Resultados: ${total}`}
                    {errorMsg && <span className="text-red-600 ml-2">({errorMsg})</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Por página:</span>
                    <select
                        className="border rounded px-2 py-1"
                        value={limit}
                        onChange={(e) => changeLimit(Number(e.target.value))}
                    >
                        {[5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabla / lista */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-3 py-2">Título</th>
                            <th className="text-left px-3 py-2">Autor</th>
                            <th className="text-left px-3 py-2">Género</th>
                            <th className="text-left px-3 py-2">Año</th>
                            <th className="text-left px-3 py-2">Páginas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                                    Cargando…
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                                    Sin resultados
                                </td>
                            </tr>
                        ) : (
                            rows.map((b) => (
                                <tr key={b.id} className="border-t">
                                    <td className="px-3 py-2">{b.title}</td>
                                    <td className="px-3 py-2">{b.author?.name ?? '—'}</td>
                                    <td className="px-3 py-2">{b.genre ?? '—'}</td>
                                    <td className="px-3 py-2">{b.publishedYear ?? '—'}</td>
                                    <td className="px-3 py-2">{b.pages ?? '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between">
                <button
                    disabled={page <= 1 || loading}
                    className="border rounded px-3 py-1 disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    ← Anterior
                </button>
                <div className="text-sm">
                    Página {page} de {totalPages}
                </div>
                <button
                    disabled={page >= totalPages || loading}
                    className="border rounded px-3 py-1 disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                    Siguiente →
                </button>
            </div>
        </div>
    )
}
