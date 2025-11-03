-- ============================================================================
-- QUICK EXECUTE: Multi-Tenant SaaS Migration - PART 1
-- ============================================================================
-- IMPORTANT: Execute this FIRST, then execute PART 2 in separate query
-- ============================================================================
-- This creates the super_admin enum value and commits it
-- ============================================================================

-- 1. Create super_admin role (extends app_role enum)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ============================================================================
-- STOP HERE! After running above, execute PART 2 in NEW SQL query window
-- File: EXECUTE-TODO-1-PART-2.sql
-- ============================================================================
