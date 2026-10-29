ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS organization_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_contact_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_contact_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS property_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_property_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_count integer NOT NULL DEFAULT 1 CHECK (location_count > 0),
  ADD COLUMN IF NOT EXISTS current_unit_count integer NOT NULL DEFAULT 0 CHECK (current_unit_count >= 0),
  ADD COLUMN IF NOT EXISTS peak_unit_count integer NOT NULL DEFAULT 0 CHECK (peak_unit_count >= 0),
  ADD COLUMN IF NOT EXISTS current_people_count integer NOT NULL DEFAULT 0 CHECK (current_people_count >= 0),
  ADD COLUMN IF NOT EXISTS peak_people_count integer NOT NULL DEFAULT 0 CHECK (peak_people_count >= 0),
  ADD COLUMN IF NOT EXISTS requested_features text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_feature text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan_preference text NOT NULL DEFAULT 'help_me_choose'
    CHECK (plan_preference IN ('help_me_choose', 'starter', 'growth', 'portfolio', 'enterprise')),
  ADD COLUMN IF NOT EXISTS billing_preference text NOT NULL DEFAULT 'monthly_or_annual'
    CHECK (billing_preference IN ('monthly_or_annual', 'monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS desired_start_date date,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
