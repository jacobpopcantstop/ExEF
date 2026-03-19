alter table public.efi_user_purchases
  add column if not exists reviewer_decision text;

alter table public.efi_user_purchases
  add column if not exists reviewer_notes text;

alter table public.efi_user_purchases
  add column if not exists reviewed_at timestamptz;

alter table public.efi_user_purchases
  add column if not exists reviewed_by text;
