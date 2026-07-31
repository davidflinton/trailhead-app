import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lahzovurbugnptoszlxj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHpvdnVyYnVnbnB0b3N6bHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDM4MzksImV4cCI6MjEwMDU3OTgzOX0.a5Kc-__V4pX1prx7aHC6L45ggA6no3kJxMlALr9CYCs'

export const supabase = createClient(supabaseUrl, supabaseKey)