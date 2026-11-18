import { describe, expect, it } from 'vitest';
import { fa } from '../i18n/fa';
import type { BlockReason } from '../types';
import { blockMessage, loanErrorMessage, nextAction, progressStep, waitingForMe } from './loans';

describe('loanErrorMessage', () => {
  it('explains a book that was lent to someone else', () => {
    expect(loanErrorMessage('book_unavailable')).toBe('block.book_unavailable');
  });
  it('explains a borrower who already has a book out', () => {
    expect(loanErrorMessage('has_active_loan')).toBe('block.has_active_loan');
  });
  it('explains a missing permission separately from a changed loan', () => {
    expect(loanErrorMessage('not_allowed')).toBe('loan.error.notAllowed');
    expect(loanErrorMessage('bad_state')).toBe('loan.actionFailed');
  });
  it('falls back to the generic message', () => {
    expect(loanErrorMessage('unknown')).toBe('common.error');
  });
});
import type { LoanRow } from '../types';

const OWNER = 'owner';
const BORROWER = 'borrower';
function loan(p: Partial<LoanRow>): LoanRow {
  return {
    id: p.id ?? Math.random().toString(36).slice(2), book_id: 'b', book_title: 't', book_cover_path: null,
    owner_id: OWNER, borrower_id: BORROWER, owner_first_name: 'O', borrower_first_name: 'B',
    status: 'requested', handover_method: 'meetup', meetup_id: null, message: null, created_at: '2026-11-01T10:00:00Z',
    respond_by: '2026-11-04T10:00:00Z', accepted_at: null, received_at: null, due_date: null, extensions_used: 0,
    extension_pending: false, return_marked_at: null, closed_at: null, closed_by: null, end_reason: null,
    has_open_report: false, is_sample: false, ...p,
  };
}
const TODAY = '2026-11-18';

describe('nextAction', () => {
  it('asks the owner to answer a new request', () => {
    expect(nextAction(loan({ status: 'requested' }), OWNER, TODAY).box).toBe('owner_respond');
  });
  it('tells the borrower to wait for the owner', () => {
    expect(nextAction(loan({ status: 'requested' }), BORROWER, TODAY).box).toBe('borrower_wait');
  });
  it('asks the borrower to confirm the handover once accepted', () => {
    expect(nextAction(loan({ status: 'accepted' }), BORROWER, TODAY).box).toBe('confirm_received');
    expect(nextAction(loan({ status: 'accepted' }), OWNER, TODAY).box).toBe('arrange_handover');
  });
  it('asks the owner to decide on a pending extension', () => {
    expect(nextAction(loan({ status: 'reading', extension_pending: true, due_date: '2026-12-01' }), OWNER, TODAY).box).toBe('extension_decide');
    expect(nextAction(loan({ status: 'reading', extension_pending: true, due_date: '2026-12-01' }), BORROWER, TODAY).box).toBe('extension_wait');
  });
  it('flags an overdue loan', () => {
    const a = nextAction(loan({ status: 'reading', due_date: '2026-11-17' }), BORROWER, TODAY);
    expect(a).toEqual({ box: 'reading', overdue: true });
  });
  it('is not overdue on the due date itself', () => {
    expect(nextAction(loan({ status: 'reading', due_date: TODAY }), BORROWER, TODAY).overdue).toBe(false);
  });
  it('asks the owner to confirm a marked return', () => {
    expect(nextAction(loan({ status: 'return_marked' }), OWNER, TODAY).box).toBe('owner_confirm_return');
    expect(nextAction(loan({ status: 'return_marked' }), BORROWER, TODAY).box).toBe('borrower_returned_wait');
  });
  it('shows ended states as ended', () => {
    for (const s of ['closed', 'declined', 'cancelled', 'expired', 'withdrawn'] as const) {
      expect(nextAction(loan({ status: s }), OWNER, TODAY).box).toBe('ended');
    }
  });
});

describe('progressStep', () => {
  it('maps statuses to the six steps (request, accept, handover, reading, return, closed)', () => {
    expect(progressStep(loan({ status: 'requested' }))).toBe(1);
    expect(progressStep(loan({ status: 'accepted' }))).toBe(2);
    expect(progressStep(loan({ status: 'reading' }))).toBe(3);
    expect(progressStep(loan({ status: 'return_marked' }))).toBe(4);
    expect(progressStep(loan({ status: 'closed' }))).toBe(5);
  });
  it('keeps a cancelled accepted loan at the handover step', () => {
    expect(progressStep(loan({ status: 'cancelled', accepted_at: '2026-11-02T00:00:00Z' }))).toBe(2);
    expect(progressStep(loan({ status: 'declined' }))).toBe(1);
  });
});

describe('waitingForMe', () => {
  it('lists what needs the viewer: requests and returns to confirm as owner, handovers to confirm as borrower', () => {
    const list = [
      loan({ id: 'req', status: 'requested' }),
      loan({ id: 'ret', status: 'return_marked' }),
      loan({ id: 'acc-mine', status: 'accepted', owner_id: 'someone', borrower_id: OWNER }),
      loan({ id: 'acc-theirs', status: 'accepted' }),
      loan({ id: 'read', status: 'reading', due_date: '2026-12-01' }),
      loan({ id: 'closed', status: 'closed' }),
    ];
    expect(waitingForMe(list, OWNER).map((l) => l.id).sort()).toEqual(['acc-mine', 'req', 'ret']);
  });
  it('includes an extension the owner must decide', () => {
    expect(waitingForMe([loan({ id: 'ext', status: 'reading', extension_pending: true })], OWNER).map((l) => l.id)).toEqual(['ext']);
  });
});

const ALL: BlockReason[] = ['not_logged_in', 'no_own_book', 'has_active_loan', 'too_many_pending', 'has_overdue', 'own_book', 'sample_book', 'book_unavailable', 'already_requested'];

describe('blockMessage', () => {
  it('has Persian copy for every block reason and its action', () => {
    for (const r of ALL) {
      const m = blockMessage(r, 'b1');
      expect(Object.keys(fa), r).toContain(m.textKey);
      if (m.action) expect(Object.keys(fa), r).toContain(m.action.labelKey);
    }
  });
  it('sends members without a book to add one', () => {
    expect(blockMessage('no_own_book', 'b1').action?.to).toBe('/add');
  });
  it('sends logged-out visitors to log in and back with the form open', () => {
    expect(blockMessage('not_logged_in', 'b1').action?.to).toBe('/login?next=%2Fbooks%2Fb1%3Frequest%3D1');
  });
  it('offers no action for sample books', () => {
    expect(blockMessage('sample_book', 'b1').action).toBeUndefined();
  });
  it('points to current loans when a book is already out', () => {
    expect(blockMessage('has_active_loan', 'b1').action?.to).toBe('/me?tab=loans');
  });
});
