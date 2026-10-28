ALTER TABLE public.customer_campers
  ADD COLUMN IF NOT EXISTS camp_id uuid,
  ADD COLUMN IF NOT EXISTS camp_role text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_3_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_3_phone text;
