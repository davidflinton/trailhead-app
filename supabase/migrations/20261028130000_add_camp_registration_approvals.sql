CREATE TABLE public.camp_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Campground',
  organization_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  billing_contact_name text NOT NULL DEFAULT '',
  billing_contact_email text NOT NULL DEFAULT '',
  mailing_address text NOT NULL DEFAULT '',
  property_address text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  property_types text[] NOT NULL DEFAULT '{}',
  other_property_type text NOT NULL DEFAULT '',
  location_count integer NOT NULL DEFAULT 1 CHECK (location_count > 0),
  current_unit_count integer NOT NULL DEFAULT 0 CHECK (current_unit_count >= 0),
  peak_unit_count integer NOT NULL DEFAULT 0 CHECK (peak_unit_count >= 0),
  current_people_count integer NOT NULL DEFAULT 0 CHECK (current_people_count >= 0),
  peak_people_count integer NOT NULL DEFAULT 0 CHECK (peak_people_count >= 0),
  requested_features text[] NOT NULL DEFAULT '{}',
  other_feature text NOT NULL DEFAULT '',
  plan_preference text NOT NULL DEFAULT 'help_me_choose'
    CHECK (plan_preference IN ('help_me_choose', 'starter', 'growth', 'portfolio', 'enterprise')),
  billing_preference text NOT NULL DEFAULT 'monthly_or_annual'
    CHECK (billing_preference IN ('monthly_or_annual', 'monthly', 'annual')),
  desired_start_date date,
  notes text NOT NULL DEFAULT '',
  gs_restricted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.camp_registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.camp_registrations TO authenticated;

CREATE POLICY camp_registrations_admin_read
  ON public.camp_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.access_tier IN ('global_admin', 'global_superadmin')
    )
  );

CREATE POLICY camp_registrations_admin_submit
  ON public.camp_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.access_tier IN ('global_admin', 'global_superadmin')
    )
  );

CREATE OR REPLACE FUNCTION public.approve_camp_registration(registration_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  registration_row public.camp_registrations%ROWTYPE;
  new_camp_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.access_tier IN ('global_admin', 'global_superadmin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to approve camp registrations';
  END IF;

  SELECT *
  INTO registration_row
  FROM public.camp_registrations
  WHERE id = registration_id
  FOR UPDATE;

  IF NOT FOUND OR registration_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending camp registration not found';
  END IF;

  INSERT INTO public.camps (
    name,
    type,
    contact_name,
    contact_number,
    contact_email,
    mailing_address,
    property_address,
    website_url,
    gs_restricted
  )
  VALUES (
    registration_row.name,
    registration_row.type,
    registration_row.contact_name,
    registration_row.contact_number,
    registration_row.contact_email,
    registration_row.mailing_address,
    registration_row.property_address,
    registration_row.website_url,
    registration_row.gs_restricted
  )
  RETURNING id INTO new_camp_id;

  UPDATE public.camp_registrations
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = registration_id;

  RETURN new_camp_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_camp_registration(registration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.access_tier IN ('global_admin', 'global_superadmin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to reject camp registrations';
  END IF;

  UPDATE public.camp_registrations
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = registration_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending camp registration not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_camp_registration(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_camp_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_camp_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_camp_registration(uuid) TO authenticated;
