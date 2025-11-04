-- ============================================================================
-- FIX: Add status column to return_history for new organizations
-- ============================================================================
-- Execute this if return_history.status column is missing
-- ============================================================================

-- 1. Add status column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'return_history' 
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.return_history 
        ADD COLUMN status TEXT DEFAULT 'approved' 
        CHECK (status IN ('pending', 'approved', 'rejected'));
        
        RAISE NOTICE '✅ Column status added to return_history';
    ELSE
        RAISE NOTICE 'ℹ️  Column status already exists';
    END IF;
END $$;

-- 2. Update existing records to have 'approved' status
UPDATE public.return_history 
SET status = 'approved' 
WHERE status IS NULL;

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_return_history_status 
ON public.return_history(product_id, rider_id, status);

-- 4. Verify the column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'return_history' 
  AND column_name = 'status';

-- 5. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ return_history.status column is ready';
  RAISE NOTICE '✅ Warehouse page should work now';
END $$;
