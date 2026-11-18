import { supabase } from '../lib/supabase';
import type { Book, Meetup } from '../types';
import { BOOK_COLUMNS } from './books';

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export interface AdminStats {
  members: number; books: number; requests: number; acceptance_rate: number | null;
  completed_loans: number; return_rate: number | null; active_members_30d: number;
}
export interface AdminReport {
  report_id: string; loan_id: string; book_title: string; owner_first_name: string; borrower_first_name: string;
  reporter_first_name: string; kind: string; message: string | null; created_at: string;
}
export interface AdminOverdue { loan_id: string; book_title: string; owner_first_name: string; borrower_first_name: string; due_date: string }

export const adminStats = () => rpc<AdminStats>('admin_stats');
export const adminListReports = async () => (await rpc<AdminReport[]>('admin_list_reports')) ?? [];
export const adminListOverdue = async () => (await rpc<AdminOverdue[]>('admin_list_overdue')) ?? [];
export const adminResolveReport = (id: string) => rpc<void>('admin_resolve_report', { p_report_id: id });
export const adminCloseLoan = (id: string) => rpc<void>('admin_close_loan', { p_loan_id: id });
export const adminSetBookHidden = (id: string, hidden: boolean) => rpc<void>('admin_set_book_hidden', { p_book_id: id, p_hidden: hidden });
export const adminRemoveSampleData = () => rpc<number>('admin_remove_sample_data');

/** Every non-deleted book, hidden ones included (admins see them through RLS). */
export async function adminListBooks(): Promise<Book[]> {
  const { data, error } = await supabase.from('books').select(BOOK_COLUMNS).is('deleted_at', null).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Book[];
}

export type MeetupInput = Omit<Meetup, 'id'>;
export async function createMeetup(m: MeetupInput): Promise<void> {
  const { error } = await supabase.from('meetups').insert(m);
  if (error) throw error;
}
export async function updateMeetup(id: string, m: MeetupInput): Promise<void> {
  const { error } = await supabase.from('meetups').update(m).eq('id', id);
  if (error) throw error;
}
export async function deleteMeetup(id: string): Promise<void> {
  const { error } = await supabase.from('meetups').delete().eq('id', id);
  if (error) throw error;
}
