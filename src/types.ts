// @ts-ignore
import { Book as EpubBook, Rendition as EpubRendition } from "@intity/epub-js";

export type Rendition = any; // Using any due to type definition issues
export type Theme = 'light' | 'dark';

export interface BookType {
  path: string;
  title: string;
  author: string;
  cover_base64?: string;
}
