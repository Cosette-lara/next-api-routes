// src/features/library/books/components/BooksBrowser.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'

const useDebounced = (value: string, delay = 400) => {
    const [v, setV] = useState(value)
    useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
    return v
}

export function BooksBrowser() {
    const [search, setSearch] = useState('')
    const [genre, setGenre] = useState('')
    const [authorName, setAuthorName] = useState('')
    const [sortBy, setSortBy] = useState<'title' | 'publishedYear' | 'createdAt'>('createdAt')
    const [order, setOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [data, setData] = useState<any[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [authors, setAuthors] = useState<any[]>([])
    const [genres, setGenres] = useState<string[]>([])

    const dSearch = useDebounced(search)
    const qs = useMemo(() => {
        const p = new URLSearchParams()
        if (dSearch) p.set('search', dSearch)
        if (genre) p.set('genre', genre)
        if (authorName) p.set('authorName', authorName)
        p.set('page', String(page))
        p.set('limit', String(limit))
        p.set('sortBy', sortBy)
        p.set('order', order)
        return p.toString()
    }, [dSearch, genre, authorName, page, limit, sortBy, order])

    async function load() {
        setLoading(true)
        const res = await fetch(`/api/books/search?${qs}`)
        const json = await res.json()
        setData(json.data ?? [])
        setPagination(json.pagination ?? null)
        setLoading(false)
    }

    async function loadAux() {
        const aRes = await fetch('/api/authors')
        const a = await aRes.json()
        setAuthors(a)

        const gRes = await fetch('/api/books/search?limit=50&page=1&sortBy=createdAt&order=desc')
        const gj = await gRes.json()
        const uniq = Array.from(new Set((gj?.data ?? []).map((x: any) => x.genre).filter(Boolean))).sort()
        setGenres(uniq as string[])
    }

    useEffect(() => { load() }, [qs])
    useEffect(() => { loadAux() }, [])

    function onDelete(id: string) {
        if (!confirm('¿Eliminar libro?')) return
        fetch(`/api/books/${id}`, { method: 'DELETE' }).then(load)
    }

    function onEdit(b: any) {
        const title = prompt('Título', b.title) ?? b.title
        fetch(`/api/books/${b.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        }).then(load)
    }

    const hasActiveFilters = !!(dSearch || genre || authorName)

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="rounded-2xl border bg-white/60 p-4 md:p-5">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <input
                            className="w-full border rounded-xl px-3 py-2 pl-9 outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Buscar por título…"
                            value={search}
                            onChange={e => { setPage(1); setSearch(e.target.value) }}
                            aria-label="Buscar por título"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
                    </div>

                    <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-200"
                        value={genre} onChange={e => { setPage(1); setGenre(e.target.value) }}>
                        <option value="">Todos los géneros</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-200"
                        value={authorName} onChange={e => { setPage(1); setAuthorName(e.target.value) }}>
                        <option value="">Todos los autores</option>
                        {authors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>

                    <div className="flex gap-2">
                        <select className="border rounded-xl px-3 py-2 flex-1 focus:ring-2 focus:ring-gray-200"
                            value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                            <option value="createdAt">Fecha de creación</option>
                            <option value="title">Título</option>
                            <option value="publishedYear">Año de publicación</option>
                        </select>
                        <select className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-200"
                            value={order} onChange={e => setOrder(e.target.value as any)}>
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                        </select>
                    </div>
                </div>

                {/* Filtros activos */}
                {hasActiveFilters && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {dSearch && <span className="inline-flex items-center rounded-full border px-2 py-1">Título: “{dSearch}”</span>}
                        {genre && <span className="inline-flex items-center rounded-full border px-2 py-1">Género: {genre}</span>}
                        {authorName && <span className="inline-flex items-center rounded-full border px-2 py-1">Autor: {authorName}</span>}
                        <button
                            className="ml-auto text-gray-600 hover:underline"
                            onClick={() => { setSearch(''); setGenre(''); setAuthorName(''); setPage(1) }}
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Header resultados */}
            <div className="flex items-center gap-3 text-sm">
                <span className="opacity-70">Resultados: {pagination?.total ?? 0}</span>
                <div className="ml-auto flex items-center gap-2">
                    <label className="opacity-70">por página</label>
                    <select className="border rounded-xl px-2 py-1"
                        value={limit} onChange={e => { setPage(1); setLimit(parseInt(e.target.value, 10)) }}>
                        {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border rounded-2xl p-4 animate-pulse bg-white/50">
                            <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
                            <div className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-1/4 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.map((b: any) => (
                        <div key={b.id} className="border rounded-2xl p-4 bg-white/60 hover:bg-gray-50 transition">
                            <div className="font-semibold">{b.title}</div>
                            <div className="mt-1 text-sm text-gray-600">
                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 mr-2 text-xs">
                                    {b.genre ?? '—'}
                                </span>
                                {b.publishedYear ?? 's/f'} • {b.author?.name}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button className="px-2 py-1 rounded-xl border text-sm hover:bg-gray-50" onClick={() => onEdit(b)}>
                                    Editar
                                </button>
                                <button className="px-2 py-1 rounded-xl border text-sm hover:bg-gray-50" onClick={() => onDelete(b.id)}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <div className="col-span-full text-sm text-gray-500">No se encontraron resultados.</div>
                    )}
                </div>
            )}

            {/* Paginación */}
            <div className="flex items-center gap-2 justify-center">
                <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                    disabled={!pagination?.hasPrev}
                    onClick={() => setPage(p => Math.max(1, p - 1))}>
                    ← Anterior
                </button>
                <span className="text-sm opacity-70">
                    Página {pagination?.page ?? 1} / {pagination?.totalPages ?? 1}
                </span>
                <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                    disabled={!pagination?.hasNext}
                    onClick={() => setPage(p => p + 1)}>
                    Siguiente →
                </button>
            </div>
        </div>
    )
}
