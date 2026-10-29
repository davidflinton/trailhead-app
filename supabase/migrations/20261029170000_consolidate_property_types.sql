UPDATE public.camps
SET type = 'Campground/RV Park'
WHERE type IN ('Campground', 'RV Park');

UPDATE public.camps
SET type = 'Hotels/Motels'
WHERE type IN ('Hotels', 'Motels');

INSERT INTO public.camps (
  name,
  camp_type,
  type,
  property_address,
  amenities,
  capacity,
  nightly_rate
)
SELECT
  'Test-Hotel/Motel',
  'Standard Campground',
  'Hotels/Motels',
  'Test location - Pennsylvania',
  ARRAY['Wi-Fi', 'breakfast', 'parking', 'housekeeping']::text[],
  60,
  125.00
WHERE NOT EXISTS (
  SELECT 1
  FROM public.camps
  WHERE name = 'Test-Hotel/Motel'
);
