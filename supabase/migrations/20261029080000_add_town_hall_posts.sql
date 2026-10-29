CREATE TABLE public.town_hall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type text NOT NULL CHECK (post_type IN ('discussion', 'note')),
  project_name text,
  title text NOT NULL DEFAULT '',
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(content)) > 0),
  CHECK (
    post_type <> 'discussion'
    OR length(trim(project_name)) > 0
  )
);

ALTER TABLE public.town_hall_posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.town_hall_posts TO authenticated;

CREATE POLICY town_hall_posts_authenticated_read
  ON public.town_hall_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY town_hall_posts_authenticated_create
  ON public.town_hall_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY town_hall_posts_author_update
  ON public.town_hall_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY town_hall_posts_author_or_superadmin_delete
  ON public.town_hall_posts
  FOR DELETE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.access_tier = 'global_superadmin'
    )
  );

CREATE OR REPLACE FUNCTION public.set_town_hall_post_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER town_hall_posts_set_updated_at
  BEFORE UPDATE ON public.town_hall_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_town_hall_post_updated_at();
