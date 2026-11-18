export type Locale = 'fa' | 'de' | 'en';
export type LoanStatus = 'requested' | 'accepted' | 'reading' | 'return_marked' | 'closed' | 'declined' | 'cancelled' | 'expired' | 'withdrawn';
export type Handover = 'meetup' | 'in_person';
export type BookLang = 'fa' | 'de' | 'en' | 'ar' | 'tr' | 'uk' | 'ru' | 'ku' | 'bilingual' | 'other';
export type Category = 'novel' | 'poetry' | 'children' | 'history_society' | 'biography_graphic' | 'other';
export type Condition = 'like_new' | 'good' | 'worn';
export type BlockReason = 'not_logged_in' | 'no_own_book' | 'has_active_loan' | 'too_many_pending' | 'has_overdue' | 'own_book' | 'sample_book' | 'book_unavailable' | 'already_requested';
export type ReportKind = 'not_received' | 'no_show' | 'lost' | 'damaged' | 'other';

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  title_latin: string | null;
  author: string;
  translator: string | null;
  publisher: string | null;
  language: BookLang;
  category: Category;
  year: number | null;
  condition: Condition;
  loan_months: 1 | 2 | 3;
  handover_methods: Handover[];
  cover_path: string | null;
  status: 'available' | 'paused';
  hidden: boolean;
  is_sample: boolean;
  neighbourhood: string;
  loan_state: 'none' | 'reserved' | 'on_loan';
  loan_due_date: string | null;
  created_at: string;
}

export interface LoanRow {
  id: string;
  book_id: string;
  book_title: string;
  book_cover_path: string | null;
  owner_id: string;
  borrower_id: string;
  owner_first_name: string;
  borrower_first_name: string;
  status: LoanStatus;
  handover_method: Handover;
  meetup_id: string | null;
  message: string | null;
  created_at: string;
  respond_by: string;
  accepted_at: string | null;
  received_at: string | null;
  due_date: string | null;
  extensions_used: number;
  extension_pending: boolean;
  return_marked_at: string | null;
  closed_at: string | null;
  closed_by: 'owner' | 'auto' | 'admin' | null;
  end_reason: string | null;
  has_open_report: boolean;
  is_sample: boolean;
}

export interface LoanEvent {
  id: string;
  loan_id: string;
  actor_id: string | null;
  type: string;
  note: string | null;
  created_at: string;
}

export interface Meetup {
  id: string;
  starts_at: string;
  ends_at: string;
  place: string;
  neighbourhood: string;
}

export interface Profile {
  id: string;
  first_name: string;
  postcode: string;
  neighbourhood: string;
  telegram: string | null;
  locale: Locale;
  is_admin: boolean;
}
