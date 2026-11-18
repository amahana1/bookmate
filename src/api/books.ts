import { supabase } from '../lib/supabase';
import type { Book } from '../types';
import type { BookFormValues } from '../lib/validate';
import { toAsciiDigits } from '../lib/format';

export const BOOK_COLUMNS =
  'id, owner_id, title, title_latin, author, translator, publisher, language, category, year, condition, loan_months, handover_methods, cover_path, status, hidden, is_sample, neighbourhood, loan_state, loan_due_date, created_at';

const PAGE = 1000; // Supabase's maximum rows per request

/** All books visible in the public list, newest first (fetched in pages of 1000). */
export async function listBooks(): Promise<Book[]> {
  const all: Book[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('books')
      .select(BOOK_COLUMNS)
      .is('deleted_at', null)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as Book[]));
    if (!data || data.length < PAGE) return all;
  }
}

/** The owner's other books plus a few in the same language — for the book page, without loading the whole list. */
export async function listNearby(book: Pick<Book, 'id' | 'owner_id' | 'language'>): Promise<Book[]> {
  const base = () => supabase.from('books').select(BOOK_COLUMNS).is('deleted_at', null).eq('hidden', false).neq('id', book.id);
  const [own, lang] = await Promise.all([
    base().eq('owner_id', book.owner_id).order('created_at', { ascending: false }).limit(8),
    base().eq('language', book.language).neq('owner_id', book.owner_id).order('created_at', { ascending: false }).limit(8),
  ]);
  if (own.error) throw own.error;
  if (lang.error) throw lang.error;
  return [...((own.data ?? []) as Book[]), ...((lang.data ?? []) as Book[])];
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

async function removeCover(path: string | null | undefined): Promise<void> {
  if (path) await supabase.storage.from('covers').remove([path]);
}

export async function createBook(v: BookFormValues, cover?: Blob | null): Promise<Book> {
  const cover_path = cover ? await uploadCover(cover) : null;
  const { data, error } = await supabase.from('books').insert({ ...toRow(v), cover_path }).select(BOOK_COLUMNS).single();
  if (error) {
    await removeCover(cover_path); // don't leave an orphaned photo behind
    rethrow(error);
  }
  return data as Book;
}

/** `cover`: a new image, `null` to remove the photo, `undefined` to keep it. `oldCoverPath` is deleted once replaced. */
export async function updateBook(id: string, v: BookFormValues, cover?: Blob | null, oldCoverPath?: string | null): Promise<void> {
  const patch: Record<string, unknown> = toRow(v);
  const uploaded = cover ? await uploadCover(cover) : null;
  if (uploaded) patch.cover_path = uploaded;
  if (cover === null) patch.cover_path = null;
  const { data, error } = await supabase.from('books').update(patch).eq('id', id).select('id');
  if (error || !data || data.length === 0) {
    await removeCover(uploaded);
    if (error) rethrow(error);
    throw new Error('book not updated');
  }
  if (cover !== undefined && oldCoverPath && oldCoverPath !== uploaded) await removeCover(oldCoverPath);
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
