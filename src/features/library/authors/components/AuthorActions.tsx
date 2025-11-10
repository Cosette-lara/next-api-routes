// src/features/library/authors/components/AuthorActions.tsx
'use client'
import { useState } from 'react'

export function AuthorActions({ author }: { author: any }) {
    const [saving, setSaving] = useState(false)
    const [creating, setCreating] = useState(false)
    const [formA, setFormA] = useState({ name: author.name as string, email: author.email as string })
    const [book, setBook] = useState({ title: '', genre: '', pages: '', publishedYear: '' })

    async function saveAuthor(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        await fetch(`/api/authors/${author.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formA),
        })
        setSaving(false)
        alert('Autor actualizado')
    }

    async function createBook(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        await fetch(`/api/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: book.title,
                genre: book.genre || null,
                pages: book.pages ? Number(book.pages) : null,
                publishedYear: book.publishedYear ? Number(book.publishedYear) : null,
                authorId: author.id,
            }),
        })
        setCreating(false)
        setBook({ title: '', genre: '', pages: '', publishedYear: '' })
        alert('Libro creado')
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-3">Editar autor</h3>
                <form onSubmit={saveAuthor} className="grid gap-3">
                    <div>
                        <label className="text-xs text-gray-500">Nombre</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={formA.name}
                            onChange={e => setFormA(v => ({ ...v, name: e.target.value }))}
                            placeholder="Nombre"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={formA.email}
                            onChange={e => setFormA(v => ({ ...v, email: e.target.value }))}
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <button disabled={saving} className="px-4 py-2 rounded-xl border hover:bg-gray-50 text-sm">
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h3 className="font-semibold mb-3">Agregar libro</h3>
                <form onSubmit={createBook} className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs text-gray-500">Título</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={book.title}
                            onChange={e => setBook(v => ({ ...v, title: e.target.value }))}
                            placeholder="Título del libro"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Género</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={book.genre}
                            onChange={e => setBook(v => ({ ...v, genre: e.target.value }))}
                            placeholder="Novela, Ensayo…"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Año</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={book.publishedYear}
                            onChange={e => setBook(v => ({ ...v, publishedYear: e.target.value }))}
                            placeholder="2020"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Páginas</label>
                        <input
                            className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                            value={book.pages}
                            onChange={e => setBook(v => ({ ...v, pages: e.target.value }))}
                            placeholder="300"
                        />
                    </div>
                    <div className="col-span-2">
                        <button disabled={creating} className="px-4 py-2 rounded-xl border hover:bg-gray-50 text-sm">
                            {creating ? 'Creando…' : 'Crear libro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
