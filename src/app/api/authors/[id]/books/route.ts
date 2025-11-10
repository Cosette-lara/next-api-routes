// src/app/api/authors/[id]/books/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s: string) => decodeURIComponent(s ?? '').trim()

// GET – Obtener todos los libros de un autor específico
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const authorId = norm(id)

        // Verifica que el autor exista
        const author = await prisma.author.findUnique({ where: { id: authorId } })
        if (!author) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }

        // Libros del autor
        const books = await prisma.book.findMany({
            where: { authorId },
            orderBy: { publishedYear: 'desc' },
        })

        return NextResponse.json({
            author: { id: author.id, name: author.name },
            totalBooks: books.length,
            books,
        })
    } catch {
        return NextResponse.json({ error: 'Error al obtener libros del autor' }, { status: 500 })
    }
}
