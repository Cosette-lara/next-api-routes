// src/features/library/authors/components/AuthorsTable.tsx
'use client'
import { useState } from 'react'

export function AuthorsTable({ initialAuthors }: { initialAuthors: any[] }) {
    const [authors, setAuthors] = useState<any[]>(initialAuthors)
    const [form, setForm] = useState({ name: '', email: '' })
    const [loading, setLoading] = useState(false)

    async function refresh() {
        const res = await fetch('/api/authors', { cache: 'no-store' })
        const data = await res.json()
        setAuthors(data)
    }

    async function createAuthor(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name || !form.email) return
        setLoading(true)
        await fetch('/api/authors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setForm({ name: '', email: '' })
        setLoading(false)
        refresh()
    }

    async function del(id: string) {
        if (!confirm('¿Eliminar autor?')) return
        await fetch(`/api/authors/${id}`, { method: 'DELETE' })
        refresh()
    }

    async function edit(a: any) {
        const name = prompt('Nombre', a.name) ?? a.name
        const email = prompt('Email', a.email) ?? a.email
        await fetch(`/api/authors/${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email }),
        })
        refresh()
    }

    return (
        <div className="space-y-5">
            {/* Form */}
            <form onSubmit={createAuthor} className="rounded-2xl border p-4 bg-white/60">
                <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-gray-500">Nombre</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Nombre del autor"
                            value={form.name}
                            onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="correo@ejemplo.com"
                            value={form.email}
                            onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-end">
                        <button disabled={loading} className="w-full sm:w-auto px-4 py-2 rounded-xl border hover:bg-gray-50">
                            {loading ? 'Creando…' : 'Crear autor'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-sm">
                    <thead className="bg-white/60">
                        <tr className="text-left border-b">
                            <th className="py-3 px-3">Nombre</th>
                            <th className="py-3 px-3">Email</th>
                            <th className="py-3 px-3">Libros</th>
                            <th className="py-3 px-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50">
                        {authors.map((a, idx) => (
                            <tr key={a.id} className={`border-b ${idx % 2 ? 'bg-white/30' : ''}`}>
                                <td className="py-2.5 px-3">{a.name}</td>
                                <td className="py-2.5 px-3 text-gray-600">{a.email}</td>
                                <td className="py-2.5 px-3">{a._count?.books ?? a.books?.length ?? 0}</td>
                                <td className="py-2.5 px-3">
                                    <div className="flex flex-wrap gap-2">
                                        <a className="px-2.5 py-1 rounded-xl border hover:bg-gray-50" href={`/authors/${a.id}`}>Ver</a>
                                        <button className="px-2.5 py-1 rounded-xl border hover:bg-gray-50" onClick={() => edit(a)}>Editar</button>
                                        <button className="px-2.5 py-1 rounded-xl border hover:bg-gray-50" onClick={() => del(a.id)}>Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {authors.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-6 text-center text-gray-500">No hay autores aún.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
