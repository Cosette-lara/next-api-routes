import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }
const norm = (s: string) => decodeURIComponent(s ?? '').trim()

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params
        const authorId = norm(id)

        // Verifica autor
        const author = await prisma.author.findUnique({
            where: { id: authorId },
            select: { id: true, name: true },
        })
        if (!author) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }

        // Total de libros
        const totalBooks = await prisma.book.count({ where: { authorId } })
        if (totalBooks === 0) {
            return NextResponse.json({
                authorId: author.id,
                authorName: author.name,
                totalBooks: 0,
                firstBook: null,
                latestBook: null,
                averagePages: 0,
                genres: [],
                longestBook: null,
                shortestBook: null,
            })
        }

        // Consultas paralelas
        const [
            firstByYear,
            latestByYear,
            avgPagesAgg,
            uniqueGenres,
            longest,
            shortest,
        ] = await Promise.all([
            prisma.book.findFirst({
                where: { authorId, publishedYear: { not: null } },
                orderBy: { publishedYear: 'asc' },
                select: { title: true, publishedYear: true },
            }),
            prisma.book.findFirst({
                where: { authorId, publishedYear: { not: null } },
                orderBy: { publishedYear: 'desc' },
                select: { title: true, publishedYear: true },
            }),
            prisma.book.aggregate({
                _avg: { pages: true },
                where: { authorId, pages: { not: null } },
            }),
            prisma.book.findMany({
                where: { authorId, genre: { not: null } },
                distinct: ['genre'],
                select: { genre: true },
            }),
            prisma.book.findFirst({
                where: { authorId, pages: { not: null } },
                orderBy: { pages: 'desc' },
                select: { title: true, pages: true },
            }),
            prisma.book.findFirst({
                where: { authorId, pages: { not: null } },
                orderBy: { pages: 'asc' },
                select: { title: true, pages: true },
            }),
        ])

        // Fallbacks si no hay publishedYear válidos
        const fallbackFirst =
            firstByYear ??
            (await prisma.book.findFirst({
                where: { authorId },
                orderBy: { createdAt: 'asc' },
                select: { title: true, publishedYear: true },
            }))

        const fallbackLatest =
            latestByYear ??
            (await prisma.book.findFirst({
                where: { authorId },
                orderBy: { createdAt: 'desc' },
                select: { title: true, publishedYear: true },
            }))

        const averagePages = Math.round(Number(avgPagesAgg._avg.pages ?? 0))
        const genres = uniqueGenres.map(g => g.genre!).filter(Boolean).sort()

        return NextResponse.json({
            authorId: author.id,
            authorName: author.name,
            totalBooks,
            firstBook: fallbackFirst
                ? { title: fallbackFirst.title, year: fallbackFirst.publishedYear ?? null }
                : null,
            latestBook: fallbackLatest
                ? { title: fallbackLatest.title, year: fallbackLatest.publishedYear ?? null }
                : null,
            averagePages,
            genres,
            longestBook: longest ? { title: longest.title, pages: longest.pages } : null,
            shortestBook: shortest ? { title: shortest.title, pages: shortest.pages } : null,
        })
    } catch {
        return NextResponse.json({ error: 'Error al calcular estadísticas' }, { status: 500 })
    }
}
