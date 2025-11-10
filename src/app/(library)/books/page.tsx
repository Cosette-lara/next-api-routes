// src/app/(library)/books/page.tsx
import { prisma } from '@/lib/prisma'
import { BooksBrowser } from '@/features/library/books/components/BooksBrowser'

export default async function BooksPage() {
    let authors: { id: string; name: string }[] = []
    try {
        authors = await prisma.author.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    } catch (e) {
        console.error('[BooksPage] DB error:', e) // Renderiza igual con dropdown vacío
    }
    return <BooksBrowser initialAuthors={authors} />
}
