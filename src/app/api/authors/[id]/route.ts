// app/api/authors/[id]/route.ts  (o src/app/… si usas src/)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s: string) => decodeURIComponent(s ?? '').trim()

// GET – Autor por ID
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const author = await prisma.author.findUnique({
            where: { id: norm(id) },
            include: {
                books: { orderBy: { publishedYear: 'desc' } },
                _count: { select: { books: true } },
            },
        })
        if (!author) return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        return NextResponse.json(author)
    } catch {
        return NextResponse.json({ error: 'Error al obtener autor' }, { status: 500 })
    }
}

// PUT – Actualizar autor
export async function PUT(request: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const body = await request.json()
        const { name, email, bio, nationality, birthYear } = body ?? {}

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (email !== null && !emailRegex.test(String(email))) {
                return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
            }
        }

        const parsedYear =
            birthYear === undefined ? undefined
                : birthYear === null ? null
                    : typeof birthYear === 'number' ? birthYear
                        : (Number.isNaN(parseInt(String(birthYear), 10)) ? null : parseInt(String(birthYear), 10))

        const data: {
            name?: string | null
            email?: string | null
            bio?: string | null
            nationality?: string | null
            birthYear?: number | null
        } = {}
        if (name !== undefined) data.name = name
        if (email !== undefined) data.email = email
        if (bio !== undefined) data.bio = bio
        if (nationality !== undefined) data.nationality = nationality
        if (parsedYear !== undefined) data.birthYear = parsedYear

        const author = await prisma.author.update({
            where: { id: norm(id) },
            data,
            include: { books: true, _count: { select: { books: true } } },
        })
        return NextResponse.json(author)
    } catch (error: any) {
        if (error?.code === 'P2025') return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        if (error?.code === 'P2002') return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
        return NextResponse.json({ error: 'Error al actualizar autor' }, { status: 500 })
    }
}

// DELETE – Eliminar autor
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        await prisma.author.delete({ where: { id: norm(id) } })
        return NextResponse.json({ message: 'Autor eliminado correctamente' })
    } catch (error: any) {
        if (error?.code === 'P2025') return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        return NextResponse.json({ error: 'Error al eliminar autor' }, { status: 500 })
    }
}
