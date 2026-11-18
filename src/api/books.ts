import { supabase } from '../lib/supabase';
import type { Book } from '../types';
import type { BookFormValues } from '../lib/validate';
import { toAsciiDigits } from '../lib/format';

export const BOOK_COLUMNS =
  'id, owner_id, title, title_latin, author, translator, publisher, language, category, year, condition, loan_months, handover_methods, cover_path, status, hidden, is_sample, neighbourhood, loan_state, loan_due_date, created_at';

/** All books visible in the public list, newest first. */
export async function listBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .is('deleted_at', null)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as Book[];
}

export class DuplicateBookError extends Error {}

function toRow(v: BookFormValues) {
  const opt = (s: string) => (s.trim() === '' ? null : s.trim());
  const year = toAsciiDigits(v.year.trim());
  return {
    title: v.title.trim(),
    title_latin: opt(v.title_latin),
    author: v.author.trim(),
    translator: opt(v.translator),
    publisher: opt(v.publisher),
    language: v.language,
    category: v.category,
    year: year ? Number(year) : null,
    condition: v.condition,
    loan_months: Number(v.loan_months),
    handover_methods: v.handover_methods,
  };
}

async function uploadCover(cover: Blob): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('not logged in');
  const ext = cover.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('covers').upload(path, cover, { contentType: cover.type, upsert: false });
  if (error) throw error;
  return path;
}

function rethrow(error: { code?: string }): never {
  if (error.code === '23505') throw new DuplicateBookError();
  throw error;
}

export async function createBook(v: BookFormValues, cover?: Blob | null): Promise<Book> {
  const cover_path = cover ? await uploadCover(cover) : null;
  const { data, error } = await supabase.from('books').insert({ ...toRow(v), cover_path }).select(BOOK_COLUMNS).single();
  if (error) rethrow(error);
  return data as Book;
}

/** `cover`: a new image, `null` to remove the photo, `undefined` to keep it. */
export async function updateBook(id: string, v: BookFormValues, cover?: Blob | null): Promise<void> {
  const patch: Record<string, unknown> = toRow(v);
  if (cover) patch.cover_path = await uploadCover(cover);
  if (cover === null) patch.cover_path = null;
  const { error } = await supabase.from('books').update(patch).eq('id', id);
  if (error) rethrow(error);
}

export async function setBookPaused(id: string, paused: boolean): Promise<void> {
  const { error } = await supabase.from('books').update({ status: paused ? 'paused' : 'available' }).eq('id', id);
  if (error) throw error;
}

export async function deleteBook(id: string): Promise<'ok' | 'on_loan'> {
  const { error } = await supabase.rpc('delete_book', { p_book_id: id });
  if (!error) return 'ok';
  if (error.message === 'bad_state') return 'on_loan';
  throw error;
}

export async function listMyBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Book[];
}

/** Public aggregate: when the book was listed and how many loans have completed. */
export async function bookJourney(id: string): Promise<{ listed_at: string; completed_loans: number } | null> {
  const { data, error } = await supabase.rpc('book_journey', { p_book_id: id });
  if (error) return null;
  return ((data as { listed_at: string; completed_loans: number }[] | null) ?? [])[0] ?? null;
}

/** One book; null when it doesn't exist, was deleted, or is hidden from the caller. */
export async function getBook(id: string): Promise<Book | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from('books').select(BOOK_COLUMNS).eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return (data as Book | null) ?? null;
}
