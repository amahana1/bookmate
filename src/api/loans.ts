import { supabase } from '../lib/supabase';
import type { BlockReason, Handover, LoanEvent, LoanRow, ReportKind } from '../types';

export type LoanErrorCode = BlockReason | 'not_allowed' | 'bad_state' | 'unknown';

const KNOWN = new Set<string>(['not_logged_in', 'no_own_book', 'has_active_loan', 'too_many_pending', 'has_overdue', 'own_book', 'sample_book', 'book_unavailable', 'already_requested', 'not_allowed', 'bad_state']);

export class LoanError extends Error {
  constructor(public code: LoanErrorCode) {
    super(code);
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new LoanError(KNOWN.has(error.message) ? (error.message as LoanErrorCode) : 'unknown');
  return data as T;
}

export const canRequest = (bookId: string) => rpc<BlockReason | null>('can_request', { p_book_id: bookId });
export const requestLoan = (bookId: string, handover: Handover, meetupId: string | null, message: string) =>
  rpc<string>('request_loan', { p_book_id: bookId, p_handover: handover, p_meetup_id: meetupId, p_message: message });
export const respondRequest = (loanId: string, accept: boolean) => rpc<void>('respond_request', { p_loan_id: loanId, p_accept: accept });
export const cancelLoan = (loanId: string) => rpc<void>('cancel_loan', { p_loan_id: loanId });
export const confirmReceived = (loanId: string) => rpc<void>('confirm_received', { p_loan_id: loanId });
export const requestExtension = (loanId: string) => rpc<void>('request_extension', { p_loan_id: loanId });
export const respondExtension = (loanId: string, accept: boolean) => rpc<void>('respond_extension', { p_loan_id: loanId, p_accept: accept });
export const markReturned = (loanId: string) => rpc<void>('mark_returned', { p_loan_id: loanId });
export const confirmReturn = (loanId: string) => rpc<void>('confirm_return', { p_loan_id: loanId });
export const reportProblem = (loanId: string, kind: ReportKind, message: string) =>
  rpc<string>('report_problem', { p_loan_id: loanId, p_kind: kind, p_message: message });

export interface Contact { user_id: string; first_name: string; email: string | null; telegram: string | null }
export const getLoanContacts = async (loanId: string) => (await rpc<Contact[]>('get_loan_contacts', { p_loan_id: loanId })) ?? [];
export const getMyLoans = async () => (await rpc<LoanRow[]>('get_my_loans')) ?? [];
export const getLoan = async (loanId: string) => ((await rpc<LoanRow[]>('get_loan', { p_loan_id: loanId })) ?? [])[0] ?? null;
export const getLoanEvents = async (loanId: string) => (await rpc<LoanEvent[]>('get_loan_events', { p_loan_id: loanId })) ?? [];
