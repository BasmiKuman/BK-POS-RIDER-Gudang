-- Fix: Add missing 'address' column to profiles table
-- This column is needed by the handle_new_user() function

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
