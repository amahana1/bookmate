-- Sample data from doc 2 §7. Every row is flagged is_sample. Idempotent (fixed ids, on conflict do nothing).
-- Load with execute_sql. Remove from the admin page ("remove all sample data").

insert into public.profiles (id, first_name, postcode, neighbourhood, is_sample) values
  ('5a000000-0000-0000-0000-000000000001', 'لیلا', '12043', 'Neukölln', true),
  ('5a000000-0000-0000-0000-000000000002', 'امید', '13187', 'Pankow', true),
  ('5a000000-0000-0000-0000-000000000003', 'نسرین', '10827', 'Schöneberg', true),
  ('5a000000-0000-0000-0000-000000000004', 'آرش', '13353', 'Wedding', true),
  ('5a000000-0000-0000-0000-000000000005', 'کاوه', '10245', 'Friedrichshain', true),
  ('5a000000-0000-0000-0000-000000000006', 'سارا', '10405', 'Prenzlauer Berg', true),
  ('5a000000-0000-0000-0000-000000000007', 'بهروز', '10585', 'Charlottenburg', true),
  ('5a000000-0000-0000-0000-000000000008', 'شیرین', '10999', 'Kreuzberg', true),
  ('5a000000-0000-0000-0000-000000000009', 'پویا', '10551', 'Moabit', true),
  ('5a000000-0000-0000-0000-000000000010', 'مریم', '12163', 'Steglitz', true)
on conflict (id) do nothing;

insert into public.books (id, owner_id, title, title_latin, author, translator, publisher, language, category, year, condition, loan_months, handover_methods, status, is_sample, created_at) values
  ('5b000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000003', 'سمفونی مردگان', 'Symphony of the Dead', 'عباس معروفی', null, null, 'fa', 'novel', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '40 days'),
  ('5b000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000001', 'چراغ‌ها را من خاموش می‌کنم', 'I Turn Off the Lights', 'زویا پیرزاد', null, null, 'fa', 'novel', null, 'like_new', 1, '{meetup,in_person}', 'available', true, now() - interval '2 days'),
  ('5b000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000001', 'سووشون', 'Savushun', 'سیمین دانشور', null, null, 'fa', 'novel', null, 'worn', 2, '{meetup}', 'available', true, now() - interval '35 days'),
  ('5b000000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000001', 'شازده احتجاب', 'Prince Ehtejab', 'هوشنگ گلشیری', null, null, 'fa', 'novel', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '30 days'),
  ('5b000000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000001', 'هشت کتاب', 'Hasht Ketab', 'سهراب سپهری', null, null, 'fa', 'poetry', null, 'good', 3, '{meetup,in_person}', 'available', true, now() - interval '4 days'),
  ('5b000000-0000-0000-0000-000000000006', '5a000000-0000-0000-0000-000000000001', 'The Complete Persepolis', null, 'Marjane Satrapi', null, null, 'en', 'biography_graphic', null, 'good', 1, '{in_person}', 'paused', true, now() - interval '28 days'),
  ('5b000000-0000-0000-0000-000000000007', '5a000000-0000-0000-0000-000000000007', 'جای خالی سلوچ', 'Missing Soluch', 'محمود دولت‌آبادی', null, null, 'fa', 'novel', null, 'good', 2, '{meetup,in_person}', 'available', true, now() - interval '6 days'),
  ('5b000000-0000-0000-0000-000000000008', '5a000000-0000-0000-0000-000000000007', 'دایی جان ناپلئون', 'My Uncle Napoleon', 'ایرج پزشکزاد', null, null, 'fa', 'novel', null, 'worn', 1, '{meetup}', 'available', true, now() - interval '25 days'),
  ('5b000000-0000-0000-0000-000000000009', '5a000000-0000-0000-0000-000000000008', 'صد سال تنهایی', 'One Hundred Years of Solitude', 'گابریل گارسیا مارکز', 'بهمن فرزانه (Bahman Farzaneh)', null, 'fa', 'novel', null, 'good', 2, '{meetup,in_person}', 'available', true, now() - interval '1 day'),
  ('5b000000-0000-0000-0000-000000000010', '5a000000-0000-0000-0000-000000000008', 'ملت عشق', 'The Forty Rules of Love', 'الیف شافاک', 'ارسلان فصیحی', null, 'fa', 'novel', null, 'like_new', 1, '{meetup,in_person}', 'available', true, now() - interval '22 days'),
  ('5b000000-0000-0000-0000-000000000011', '5a000000-0000-0000-0000-000000000009', 'جنایت و مکافات', 'Crime and Punishment', 'فیودور داستایفسکی', 'مهری آهی', null, 'fa', 'novel', null, 'good', 3, '{meetup,in_person}', 'available', true, now() - interval '8 days'),
  ('5b000000-0000-0000-0000-000000000012', '5a000000-0000-0000-0000-000000000009', 'کیمیاگر', 'The Alchemist', 'پائولو کوئلیو', 'آرش حجازی', null, 'fa', 'novel', null, 'worn', 1, '{in_person}', 'available', true, now() - interval '10 days'),
  ('5b000000-0000-0000-0000-000000000013', '5a000000-0000-0000-0000-000000000010', 'ماهی سیاه کوچولو', 'The Little Black Fish', 'صمد بهرنگی', null, null, 'fa', 'children', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '3 days'),
  ('5b000000-0000-0000-0000-000000000014', '5a000000-0000-0000-0000-000000000010', 'قصه‌های مجید', 'Tales of Majid', 'هوشنگ مرادی کرمانی', null, null, 'fa', 'children', null, 'good', 2, '{meetup}', 'available', true, now() - interval '12 days'),
  ('5b000000-0000-0000-0000-000000000015', '5a000000-0000-0000-0000-000000000006', 'تولدی دیگر', 'Another Birth', 'فروغ فرخزاد', null, null, 'fa', 'poetry', null, 'like_new', 1, '{meetup,in_person}', 'available', true, now() - interval '5 days'),
  ('5b000000-0000-0000-0000-000000000016', '5a000000-0000-0000-0000-000000000004', 'کلیدر (جلد ۱ و ۲)', 'Kelidar', 'محمود دولت‌آبادی', null, null, 'fa', 'novel', null, 'good', 3, '{meetup}', 'available', true, now() - interval '14 days'),
  ('5b000000-0000-0000-0000-000000000017', '5a000000-0000-0000-0000-000000000005', 'Nachts ist es leise in Teheran', null, 'Shida Bazyar', null, null, 'de', 'novel', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '7 days'),
  ('5b000000-0000-0000-0000-000000000018', '5a000000-0000-0000-0000-000000000003', 'Reading Lolita in Tehran', null, 'Azar Nafisi', null, null, 'en', 'biography_graphic', null, 'good', 2, '{meetup,in_person}', 'available', true, now() - interval '16 days'),
  ('5b000000-0000-0000-0000-000000000019', '5a000000-0000-0000-0000-000000000007', 'رباعیات خیام (فارسی–انگلیسی)', 'Rubaiyat of Omar Khayyam', 'عمر خیام', 'ادوارد فیتزجرالد (Edward FitzGerald)', null, 'bilingual', 'poetry', null, 'like_new', 1, '{meetup,in_person}', 'available', true, now() - interval '18 days'),
  ('5b000000-0000-0000-0000-000000000020', '5a000000-0000-0000-0000-000000000005', 'همسایه‌ها', 'The Neighbours', 'احمد محمود', null, null, 'fa', 'novel', null, 'worn', 2, '{meetup}', 'available', true, now() - interval '20 days'),
  ('5b000000-0000-0000-0000-000000000021', '5a000000-0000-0000-0000-000000000004', 'بوف کور', 'The Blind Owl', 'صادق هدایت', null, null, 'fa', 'novel', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '9 days'),
  ('5b000000-0000-0000-0000-000000000022', '5a000000-0000-0000-0000-000000000006', 'The Stationery Shop', null, 'Marjan Kamali', null, null, 'en', 'novel', null, 'like_new', 1, '{meetup,in_person}', 'available', true, now() - interval '11 days'),
  ('5b000000-0000-0000-0000-000000000023', '5a000000-0000-0000-0000-000000000009', 'تاریخ مشروطه ایران', 'History of the Iranian Constitutional Revolution', 'احمد کسروی', null, null, 'fa', 'history_society', null, 'good', 3, '{meetup}', 'available', true, now() - interval '13 days'),
  ('5b000000-0000-0000-0000-000000000024', '5a000000-0000-0000-0000-000000000010', 'دیوان حافظ (قزوینی–غنی)', 'Divan of Hafez', 'حافظ', null, null, 'fa', 'poetry', null, 'good', 1, '{meetup,in_person}', 'available', true, now() - interval '24 days')
on conflict (id) do nothing;

-- Sample loans (between sample members only) so some books show "on loan until …" / "reserved".
insert into public.loans (id, book_id, owner_id, borrower_id, status, handover_method, created_at, respond_by, accepted_at, received_at, due_date, is_sample) values
  ('5c000000-0000-0000-0000-000000000001', '5b000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000001', 'reading', 'meetup', now() - interval '20 days', now() - interval '17 days', now() - interval '19 days', now() - interval '18 days', public.berlin_today() + 21, true),
  ('5c000000-0000-0000-0000-000000000002', '5b000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000005', 'reading', 'in_person', now() - interval '15 days', now() - interval '12 days', now() - interval '14 days', now() - interval '13 days', public.berlin_today() + 35, true),
  ('5c000000-0000-0000-0000-000000000003', '5b000000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000006', 'accepted', 'meetup', now() - interval '3 days', now(), now() - interval '2 days', null, null, true),
  ('5c000000-0000-0000-0000-000000000004', '5b000000-0000-0000-0000-000000000008', '5a000000-0000-0000-0000-000000000007', '5a000000-0000-0000-0000-000000000004', 'reading', 'meetup', now() - interval '10 days', now() - interval '7 days', now() - interval '9 days', now() - interval '8 days', public.berlin_today() + 49, true),
  ('5c000000-0000-0000-0000-000000000005', '5b000000-0000-0000-0000-000000000010', '5a000000-0000-0000-0000-000000000008', '5a000000-0000-0000-0000-000000000009', 'reading', 'in_person', now() - interval '12 days', now() - interval '9 days', now() - interval '11 days', now() - interval '10 days', public.berlin_today() + 28, true),
  ('5c000000-0000-0000-0000-000000000006', '5b000000-0000-0000-0000-000000000020', '5a000000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000010', 'reading', 'meetup', now() - interval '25 days', now() - interval '22 days', now() - interval '24 days', now() - interval '23 days', public.berlin_today() + 63, true),
  ('5c000000-0000-0000-0000-000000000007', '5b000000-0000-0000-0000-000000000024', '5a000000-0000-0000-0000-000000000010', '5a000000-0000-0000-0000-000000000002', 'reading', 'meetup', now() - interval '6 days', now() - interval '3 days', now() - interval '5 days', now() - interval '4 days', public.berlin_today() + 84, true)
on conflict (id) do nothing;
