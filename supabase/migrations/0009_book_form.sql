-- Book form update: seven categories and two conditions. Existing rows are mapped before the new checks.
--   history_society, biography_graphic -> history_biography;  other -> novel;  worn -> good

alter table public.books drop constraint books_category_check;
alter table public.books drop constraint books_condition_check;

update public.books set category = 'history_biography' where category in ('history_society', 'biography_graphic');
update public.books set category = 'novel' where category = 'other';
update public.books set condition = 'good' where condition = 'worn';

alter table public.books add constraint books_category_check
  check (category in ('novel', 'poetry', 'history_biography', 'psychology', 'philosophy_society', 'science_education', 'children'));
alter table public.books add constraint books_condition_check
  check (condition in ('like_new', 'good'));
