ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY global_settings_admin_announcement_read
  ON public.global_settings
  FOR SELECT
  TO authenticated
  USING (key = 'admin_announcement');

CREATE POLICY global_settings_admin_announcement_owner_insert
  ON public.global_settings
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    key = 'admin_announcement'
    AND lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );

CREATE POLICY global_settings_admin_announcement_owner_insert_guard
  ON public.global_settings
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    key <> 'admin_announcement'
    OR lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );

CREATE POLICY global_settings_admin_announcement_owner_update
  ON public.global_settings
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    key = 'admin_announcement'
    AND lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  )
  WITH CHECK (
    key = 'admin_announcement'
    AND lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );

CREATE POLICY global_settings_admin_announcement_owner_update_guard
  ON public.global_settings
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    key <> 'admin_announcement'
    OR lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  )
  WITH CHECK (
    key <> 'admin_announcement'
    OR lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );

CREATE POLICY global_settings_admin_announcement_owner_delete
  ON public.global_settings
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    key = 'admin_announcement'
    AND lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );

CREATE POLICY global_settings_admin_announcement_owner_delete_guard
  ON public.global_settings
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    key <> 'admin_announcement'
    OR lower((SELECT auth.jwt() ->> 'email')) = 'david.flinton@gmail.com'
  );
