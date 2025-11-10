import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const norm = (s: string | null) => (s ?? '').trim()

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)

        const search = norm(url.searchParams.get('search'))               // título (contains, ci)
        const genre = norm(url.searchParams.get('genre')) || undefined    // género exacto
        const authorName = norm(url.searchParams.get('authorName'))       // autor (contains, ci)

        const page = clamp(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1, 1_000_000)
        const limit = clamp(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1, 50)

        const sortByParam = norm(url.searchParams.get('sortBy'))
        const orderParam = norm(url.searchParams.get('order')).toLowerCase()

        const allowedSort: Record<string, 'title' | 'publishedYear' | 'createdAt'> = {
            title: 'title',
            publishedYear: 'publishedYear',
            createdAt: 'createdAt',
        }
        const sortBy = (allowedSort[sortByParam] ?? 'createdAt') as 'title' | 'publishedYear' | 'createdAt'
        const order = (orderParam === 'asc' || orderParam === 'desc') ? orderParam : 'desc'

        const where = {
            AND: [
                search ? { title: { contains: search, mode: 'insensitive' as const } } : {},
                genre ? { genre } : {},
                authorName ? { author: { name: { contains: authorName, mode: 'insensitive' as const } } } : {},
            ],
        }

        const [total, data] = await Promise.all([
            prisma.book.count({ where }),
            prisma.book.findMany({
                where,
                include: { author: { select: { id: true, name: true, email: true } } },
                orderBy: { [sortBy]: order as 'asc' | 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / limit))
        const pagination = {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        }

        return NextResponse.json({ data, pagination })
    } catch {
        return NextResponse.json({ error: 'Error en la búsqueda de libros' }, { status: 500 })
    }
}
