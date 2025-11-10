import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s?: string) => decodeURIComponent(s ?? '').trim()

function parseBirthYear(input: unknown): number | null | undefined {
    if (input === undefined) return undefined            // no actualizar
    if (input === null || String(input).trim() === '') return null
    const n = parseInt(String(input), 10)
    return Number.isNaN(n) ? null : n
}

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
        if (!author) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }
        return NextResponse.json(author)
    } catch {
        return NextResponse.json({ error: 'Error al obtener autor' }, { status: 500 })
    }
}

// PUT – Actualizar (parcial) autor
export async function PUT(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const body = await req.json()
        const { name, email, bio, nationality, birthYear } = body ?? {}

        // Validación de email si viene y no es null
        if (email !== undefined && email !== null) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(String(email))) {
                return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
            }
        }

        const data: {
            name?: string
            email?: string
            bio?: string | null
            nationality?: string | null
            birthYear?: number | null
        } = {}

        if (name !== undefined) {
            if (name === null) return NextResponse.json({ error: 'name no puede ser null' }, { status: 400 })
            data.name = String(name)
        }

        if (email !== undefined) {
            if (email === null) return NextResponse.json({ error: 'email no puede ser null' }, { status: 400 })
            data.email = String(email)
        }

        if (bio !== undefined) data.bio = bio === null ? null : String(bio)
        if (nationality !== undefined) data.nationality = nationality === null ? null : String(nationality)

        const by = parseBirthYear(birthYear)
        if (by !== undefined) data.birthYear = by

        const author = await prisma.author.update({
            where: { id: norm(id) },
            data,
            include: { books: true, _count: { select: { books: true } } },
        })

        return NextResponse.json(author)
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
        }
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
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Error al eliminar autor' }, { status: 500 })
    }
}
