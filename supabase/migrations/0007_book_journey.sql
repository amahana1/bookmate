-- Public, aggregate-only journey of a book: when it was listed and how many loans completed. No member data.
create or replace function public.book_journey(p_book_id uuid)
returns table (listed_at timestamptz, completed_loans int)
language sql stable security definer set search_path = '' as $$
  select b.created_at,
         (select count(*)::int from public.loans l where l.book_id = b.id and l.status = 'closed')
  from public.books b
  where b.id = p_book_id
    and b.deleted_at is null
    and (not b.hidden or b.owner_id = auth.uid() or public.is_admin())
$$;

revoke execute on function public.book_journey(uuid) from public;
grant execute on function public.book_journey(uuid) to anon, authenticated;
