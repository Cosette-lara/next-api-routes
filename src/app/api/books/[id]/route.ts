// src/app/api/books/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s: string) => decodeURIComponent(s ?? '').trim()

// GET – Obtener un libro específico por ID
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const book = await prisma.book.findUnique({
            where: { id: norm(id) },
            include: { author: true },
        })

        if (!book) {
            return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
        }

        return NextResponse.json(book)
    } catch {
        return NextResponse.json({ error: 'Error al obtener libro' }, { status: 500 })
    }
}

// PUT – Actualizar un libro
export async function PUT(request: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const body = await request.json()
        const { title, description, isbn, publishedYear, genre, pages, authorId } = body ?? {}

        // Validaciones
        if (title && String(title).trim().length < 3) {
            return NextResponse.json({ error: 'El título debe tener al menos 3 caracteres' }, { status: 400 })
        }
        if (pages && Number(pages) < 1) {
            return NextResponse.json({ error: 'El número de páginas debe ser mayor a 0' }, { status: 400 })
        }

        // Si se cambia el autor, verifica que existe
        if (authorId) {
            const authorExists = await prisma.author.findUnique({ where: { id: String(authorId) } })
            if (!authorExists) {
                return NextResponse.json({ error: 'El autor especificado no existe' }, { status: 404 })
            }
        }

        const book = await prisma.book.update({
            where: { id: norm(id) },
            data: {
                title,
                description,
                isbn,
                publishedYear:
                    publishedYear == null ? undefined : parseInt(String(publishedYear), 10),
                genre,
                pages: pages == null ? undefined : parseInt(String(pages), 10),
                authorId,
            },
            include: { author: true },
        })

        return NextResponse.json(book)
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
        }
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'El ISBN ya existe' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Error al actualizar libro' }, { status: 500 })
    }
}

// DELETE – Eliminar un libro
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        await prisma.book.delete({ where: { id: norm(id) } })
        return NextResponse.json({ message: 'Libro eliminado correctamente' })
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Error al eliminar libro' }, { status: 500 })
    }
}
