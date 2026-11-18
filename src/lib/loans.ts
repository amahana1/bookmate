import type { TKey } from '../i18n/translate';
import type { BlockReason, LoanRow } from '../types';

export type ActionBox =
  | 'owner_respond' | 'borrower_wait' | 'arrange_handover' | 'confirm_received' | 'reading'
  | 'extension_decide' | 'extension_wait' | 'owner_confirm_return' | 'borrower_returned_wait' | 'ended';

const ACTIVE = new Set(['accepted', 'reading', 'return_marked']);

export function isActive(l: Pick<LoanRow, 'status'>): boolean {
  return ACTIVE.has(l.status);
}

/** Which "what you need to do now" box the viewer sees. `today` is the Berlin date (YYYY-MM-DD). */
export function nextAction(loan: LoanRow, viewerId: string, today: string): { box: ActionBox; overdue: boolean } {
  const owner = loan.owner_id === viewerId;
  const overdue = loan.status === 'reading' && loan.due_date !== null && loan.due_date < today;
  switch (loan.status) {
    case 'requested':
      return { box: owner ? 'owner_respond' : 'borrower_wait', overdue };
    case 'accepted':
      return { box: owner ? 'arrange_handover' : 'confirm_received', overdue };
    case 'reading':
      if (loan.extension_pending) return { box: owner ? 'extension_decide' : 'extension_wait', overdue };
      return { box: 'reading', overdue };
    case 'return_marked':
      return { box: owner ? 'owner_confirm_return' : 'borrower_returned_wait', overdue };
    default:
      return { box: 'ended', overdue };
  }
}

/** Current step of request(0) → accept(1) → handover(2) → reading(3) → return(4) → closed(5). */
export function progressStep(loan: Pick<LoanRow, 'status' | 'accepted_at'>): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (loan.status) {
    case 'accepted': return 2;
    case 'reading': return 3;
    case 'return_marked': return 4;
    case 'closed': return 5;
    case 'cancelled': return loan.accepted_at ? 2 : 1;
    default: return 1;
  }
}

/** Loans where the next step is the viewer's. */
export function waitingForMe(loans: LoanRow[], viewerId: string): LoanRow[] {
  return loans.filter((l) =>
    l.owner_id === viewerId
      ? l.status === 'requested' || l.status === 'return_marked' || (l.status === 'reading' && l.extension_pending)
      : l.borrower_id === viewerId && l.status === 'accepted',
  );
}
import { buildLoginUrl } from './auth-url';

export interface BlockMessage {
  textKey: TKey;
  action?: { labelKey: TKey; to: string };
}

/** The message for a failed loan action, by error code from the database. */
export function loanErrorMessage(code: BlockReason | 'not_allowed' | 'bad_state' | 'unknown'): TKey {
  switch (code) {
    case 'not_allowed': return 'loan.error.notAllowed';
    case 'bad_state': return 'loan.actionFailed';
    case 'unknown': return 'common.error';
    default: return blockMessage(code, '').textKey;
  }
}

/** Why a member can't request this book yet, and the button that fixes it. */
export function blockMessage(reason: BlockReason, bookId: string): BlockMessage {
  const myLoans = { labelKey: 'block.action.myLoans' as const, to: '/me?tab=loans' };
  switch (reason) {
    case 'not_logged_in':
      return { textKey: 'block.not_logged_in', action: { labelKey: 'block.action.login', to: buildLoginUrl(`/books/${bookId}?request=1`) } };
    case 'no_own_book':
      return { textKey: 'block.no_own_book', action: { labelKey: 'block.action.addFirst', to: '/add' } };
    case 'has_active_loan':
      return { textKey: 'block.has_active_loan', action: myLoans };
    case 'has_overdue':
      return { textKey: 'block.has_overdue', action: myLoans };
    case 'too_many_pending':
      return { textKey: 'block.too_many_pending', action: myLoans };
    case 'already_requested':
      return { textKey: 'block.already_requested', action: myLoans };
    case 'own_book':
      return { textKey: 'block.own_book', action: { labelKey: 'block.action.myBooks', to: '/me?tab=books' } };
    case 'sample_book':
      return { textKey: 'block.sample_book' };
    case 'book_unavailable':
      return { textKey: 'block.book_unavailable' };
  }
}
