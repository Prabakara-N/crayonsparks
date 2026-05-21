import type { Metadata } from "next";
import { BookDetailMain } from "@/components/account/books/book-detail-main";

export const metadata: Metadata = { title: "My Books · Book" };

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function AccountBookDetailPage({ params }: PageProps) {
  const { bookId } = await params;
  return <BookDetailMain bookId={bookId} />;
}
