import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client' // ← con tu schema actual, este es el import correcto

type Ctx = { params: Promise<{ id: string }> }
const norm = (s?: string) => decodeURIComponent(s ?? '').trim()

function parseBirthYear(input: unknown): number | null | undefined {
    if (input === undefined) return undefined
    if (input === null || String(input).trim() === '') return null
    const n = parseInt(String(input), 10)
    return Number.isNaN(n) ? null : n
}

export async function GET(_req: Request, ctx: Ctx) {
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
}

export async function PUT(req: Request, ctx: Ctx) {
    const { id } = await ctx.params
    const body = await req.json()
    const { name, email, bio, nationality, birthYear } = body ?? {}

    if (name === null) return NextResponse.json({ error: 'name no puede ser null' }, { status: 400 })
    if (email === null) return NextResponse.json({ error: 'email no puede ser null' }, { status: 400 })
    if (email !== undefined && email !== null) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(email))) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
        }
    }

    // Usa { set: ... } y tipa como Prisma.AuthorUpdateInput
    const updateData: Prisma.AuthorUpdateInput = {}
    if (name !== undefined) updateData.name = { set: String(name) }
    if (email !== undefined) updateData.email = { set: String(email) }
    if (bio !== undefined) updateData.bio = { set: bio === null ? null : String(bio) }
    if (nationality !== undefined) updateData.nationality = { set: nationality === null ? null : String(nationality) }
    const by = parseBirthYear(birthYear)
    if (by !== undefined) updateData.birthYear = { set: by } // number | null

    const author = await prisma.author.update({
        where: { id: norm(id) },
        data: updateData, // ← NUNCA uses un objeto plano "data"
        include: { books: true, _count: { select: { books: true } } },
    })
    return NextResponse.json(author)
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const { id } = await ctx.params
    await prisma.author.delete({ where: { id: norm(id) } })
    return NextResponse.json({ message: 'Autor eliminado correctamente' })
}
