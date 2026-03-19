alter table public.efi_user_purchases
  add column if not exists payment_intent_id text;

alter table public.efi_user_purchases
  add column if not exists offer_code text;

create index if not exists idx_efi_user_purchases_payment_intent_id
  on public.efi_user_purchases(payment_intent_id);
