ALTER TABLE public.camps
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  ADD COLUMN IF NOT EXISTS nightly_rate numeric(10, 2) CHECK (nightly_rate IS NULL OR nightly_rate >= 0);

UPDATE public.camps
SET name = 'Test-Campground'
WHERE lower(btrim(name)) = lower('Squirrel Hill Campground');

UPDATE public.camps
SET name = 'Test-Youth Camp'
WHERE lower(btrim(name)) = lower('Camp Whispering Pines');

INSERT INTO public.camps (name, camp_type, type, property_address, amenities, capacity, nightly_rate)
SELECT fixture.name, 'Standard Campground', fixture.type, fixture.property_address, fixture.amenities, fixture.capacity, fixture.nightly_rate
FROM (VALUES
  (
    'Test-RV Park',
    'Campground',
    'Test location - Pennsylvania',
    ARRAY['full hookups', 'laundry', 'Wi-Fi', 'dump station']::text[],
    80,
    55.00
  ),
  (
    'Test-Cabin Rental',
    'Cabins, Lodges & Resorts',
    'Test location - Pennsylvania',
    ARRAY['kitchen', 'fireplace', 'Wi-Fi', 'parking']::text[],
    24,
    145.00
  ),
  (
    'Test-Lakefront Property',
    'Standard Property',
    'Test location - Pennsylvania',
    ARRAY['lake access', 'dock', 'kayaks', 'fire pit']::text[],
    12,
    180.00
  ),
  (
    'Test-Mountain Retreat',
    'Retreat, Conference & Event Centers',
    'Test location - Pennsylvania',
    ARRAY['hiking trails', 'meeting room', 'Wi-Fi', 'fire pit']::text[],
    40,
    225.00
  )
) AS fixture(name, type, property_address, amenities, capacity, nightly_rate)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.camps existing
  WHERE existing.name = fixture.name
);
