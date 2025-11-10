// src/app/api/books/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const search = (url.searchParams.get('search') ?? '').trim()
        const genre = (url.searchParams.get('genre') ?? '').trim()
        const authorName = (url.searchParams.get('authorName') ?? '').trim()
        const pageParam = url.searchParams.get('page') ?? '1'
        const limitParam = url.searchParams.get('limit') ?? '10'
        const sortByParam = (url.searchParams.get('sortBy') ?? 'createdAt').trim()
        const orderParam = (url.searchParams.get('order') ?? 'desc').trim().toLowerCase()

        // Sanitización de paginación
        const page = Math.max(1, parseInt(pageParam, 10) || 1)
        let limit = parseInt(limitParam, 10) || 10
        if (limit < 1) limit = 10
        if (limit > 50) limit = 50
        const skip = (page - 1) * limit

        // Sanitización de orden
        const allowedSortBy = new Set(['title', 'publishedYear', 'createdAt'])
        const sortBy = allowedSortBy.has(sortByParam) ? sortByParam : 'createdAt'
        const order: 'asc' | 'desc' = orderParam === 'asc' ? 'asc' : 'desc'

        // Filtros
        const where: any = {}
        if (search) where.title = { contains: search, mode: 'insensitive' }
        if (genre) where.genre = genre
        if (authorName) where.author = { name: { contains: authorName, mode: 'insensitive' } }

        // Queries en paralelo
        const [total, rows] = await Promise.all([
            prisma.book.count({ where }),
            prisma.book.findMany({
                where,
                include: { author: { select: { id: true, name: true } } },
                orderBy: { [sortBy]: order } as any, // cast para clave dinámica
                skip,
                take: limit,
            }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / limit))
        const hasNext = skip + rows.length < total
        const hasPrev = page > 1

        return NextResponse.json({
            data: rows,
            pagination: { page, limit, total, totalPages, hasNext, hasPrev },
        })
    } catch (error: any) {
        console.error('[GET /api/books/search] error:', error)
        return NextResponse.json(
            { error: 'Error al buscar libros', detail: error?.message ?? String(error) },
            { status: 500 }
        )
    }
}
