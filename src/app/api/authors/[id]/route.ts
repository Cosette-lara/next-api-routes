import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import type { Prisma } from '@prisma/client'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s?: string) => decodeURIComponent(s ?? '').trim()

function parseBirthYear(input: unknown): number | null | undefined {
  if (input === undefined) return undefined          // no actualizar
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
    if (!author) return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    return NextResponse.json(author)
  } catch {
    return NextResponse.json({ error: 'Error al obtener autor' }, { status: 500 })
  }
}

// PUT – Actualizar autor (parcial)
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const { name, email, bio, nationality, birthYear } = body ?? {}

    // Validaciones mínimas
    if (name === null)  return NextResponse.json({ error: 'name no puede ser null' },  { status: 400 })
    if (email === null) return NextResponse.json({ error: 'email no puede ser null' }, { status: 400 })
    if (email !== undefined && email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(String(email))) {
        return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
      }
    }

    const updateData: Prisma.AuthorUpdateInput = {
      ...(name !== undefined ? { name: { set: String(name) } } : {}),
      ...(email !== undefined ? { email: { set: String(email) } } : {}),
      ...(bio !== undefined ? { bio: { set: bio === null ? null : String(bio) } } : {}),
      ...(nationality !== undefined ? { nationality: { set: nationality === null ? null : String(nationality) } } : {}),
    }

    const by = parseBirthYear(birthYear)
    if (by !== undefined) {
      updateData.birthYear = { set: by } // number | null
    }

    const author = await prisma.author.update({
      where: { id: norm(id) },
      data: updateData,
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
