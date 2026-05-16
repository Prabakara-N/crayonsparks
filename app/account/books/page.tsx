import type { Metadata } from "next";
import { BooksMain } from "@/components/account/books/books-main";

export const metadata: Metadata = {
  title: "My Books",
};

export default function AccountBooksPage() {
  return <BooksMain />;
}
