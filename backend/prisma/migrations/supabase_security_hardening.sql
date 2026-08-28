-- ============================================================================
-- PARKNEX-AI SUPABASE SECURITY HARDENING & DATABASE MIGRATION SCRIPT
-- Production-Ready, Idempotent, Transactional & Security-Compliant SQL
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 5: OPTIMAL FOREIGN KEY B-TREE INDEXING
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_department_campus_id" ON public."Department"("campusId");
CREATE INDEX IF NOT EXISTS "idx_user_department_id" ON public."User"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_parking_pass_user_id" ON public."ParkingPass"("userId");
CREATE INDEX IF NOT EXISTS "idx_vehicle_user_id" ON public."Vehicle"("userId");
CREATE INDEX IF NOT EXISTS "idx_zone_campus_id" ON public."Zone"("campusId");
CREATE INDEX IF NOT EXISTS "idx_slot_zone_id" ON public."Slot"("zoneId");
CREATE INDEX IF NOT EXISTS "idx_booking_user_id" ON public."Booking"("userId");
CREATE INDEX IF NOT EXISTS "idx_booking_slot_id" ON public."Booking"("slotId");
CREATE INDEX IF NOT EXISTS "idx_booking_vehicle_id" ON public."Booking"("vehicleId");
CREATE INDEX IF NOT EXISTS "idx_visitor_host_id" ON public."Visitor"("hostId");
CREATE INDEX IF NOT EXISTS "idx_campus_event_allocated_zone_id" ON public."CampusEvent"("allocatedZoneId");
CREATE INDEX IF NOT EXISTS "idx_notification_user_id" ON public."Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_violation_user_id" ON public."Violation"("userId");
CREATE INDEX IF NOT EXISTS "idx_event_zone_id" ON public."Event"("zoneId");
CREATE INDEX IF NOT EXISTS "idx_ai_prediction_zone_id" ON public."AIPrediction"("zoneId");
CREATE INDEX IF NOT EXISTS "idx_ai_recommendation_user_id" ON public."AIRecommendation"("userId");

-- Composite indexes for query acceleration
CREATE INDEX IF NOT EXISTS "idx_booking_user_status" ON public."Booking"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_vehicle_user_plate" ON public."Vehicle"("userId", "plateNumber");

-- ============================================================================
-- PHASE 2: ENABLE ROW LEVEL SECURITY (RLS) ON ALL 30 PUBLIC TABLES
-- ============================================================================

ALTER TABLE public."Campus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ParkingPass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Zone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Slot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Visitor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CampusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Policy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Violation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Incident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIPrediction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIRecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MaintenanceLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmergencyLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DigitalSignage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QueueMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SystemActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SystemConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DatabaseBackup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnomalyAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIModelMetadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AutomationRule" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 2 & 3: LEAST-PRIVILEGE RLS POLICIES FOR ALL ROLES
-- ============================================================================

-- Helper macro: Drop existing policies before creating (Idempotence)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 1. SERVICE ROLE BYPASS POLICIES (Backend Express API & Node client)
CREATE POLICY "service_role_campus_all" ON public."Campus" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_dept_all" ON public."Department" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_user_all" ON public."User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_pass_all" ON public."ParkingPass" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_vehicle_all" ON public."Vehicle" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_zone_all" ON public."Zone" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_slot_all" ON public."Slot" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_booking_all" ON public."Booking" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_visitor_all" ON public."Visitor" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_event_all" ON public."CampusEvent" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_policy_all" ON public."Policy" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_notif_all" ON public."Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_violation_all" ON public."Violation" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_log_event_all" ON public."Event" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_incident_all" ON public."Incident" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_prediction_all" ON public."AIPrediction" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_recommendation_all" ON public."AIRecommendation" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_insight_all" ON public."AIInsight" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_announcement_all" ON public."Announcement" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_maintenance_all" ON public."MaintenanceLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_emergency_all" ON public."EmergencyLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_signage_all" ON public."DigitalSignage" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_queue_all" ON public."QueueMetric" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_audit_all" ON public."AuditLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_activity_all" ON public."SystemActivityLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_config_all" ON public."SystemConfig" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_backup_all" ON public."DatabaseBackup" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_anomaly_all" ON public."AnomalyAlert" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_model_all" ON public."AIModelMetadata" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_automation_all" ON public."AutomationRule" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. PUBLIC & AUTHENTICATED READ-ONLY POLICIES FOR METADATA
CREATE POLICY "public_read_campus" ON public."Campus" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_department" ON public."Department" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_zone" ON public."Zone" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_slot" ON public."Slot" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_signage" ON public."DigitalSignage" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_announcements" ON public."Announcement" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_policy" ON public."Policy" FOR SELECT TO public USING (true);
CREATE POLICY "public_read_model_metadata" ON public."AIModelMetadata" FOR SELECT TO public USING (true);

-- 3. USER SELF-PROFILE ACCESS & SANITIZATION POLICIES
CREATE POLICY "user_self_select" ON public."User" FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR email = auth.jwt()->>'email' OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN', 'SECURITY'));

CREATE POLICY "user_self_update" ON public."User" FOR UPDATE TO authenticated
  USING (id = auth.uid()::text OR email = auth.jwt()->>'email')
  WITH CHECK (id = auth.uid()::text OR email = auth.jwt()->>'email');

-- 4. STUDENT & FACULTY SPECIFIC OWNERSHIP POLICIES
CREATE POLICY "user_booking_select" ON public."Booking" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN', 'SECURITY'));

CREATE POLICY "user_booking_insert" ON public."Booking" FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "user_vehicle_all" ON public."Vehicle" FOR ALL TO authenticated
  USING ("userId" = auth.uid()::text OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN', 'SECURITY'))
  WITH CHECK ("userId" = auth.uid()::text OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "user_pass_select" ON public."ParkingPass" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR auth.jwt()->>'role' IN ('ADMIN', 'SUPER_ADMIN', 'SECURITY'));

CREATE POLICY "user_notif_select" ON public."Notification" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR "userId" IS NULL);

-- 5. SECURITY OFFICERS SPECIFIC POLICIES
CREATE POLICY "security_violation_all" ON public."Violation" FOR ALL TO authenticated
  USING (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN') OR "userId" = auth.uid()::text)
  WITH CHECK (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "security_incident_all" ON public."Incident" FOR ALL TO authenticated
  USING (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN'))
  WITH CHECK (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "security_emergency_all" ON public."EmergencyLog" FOR ALL TO authenticated
  USING (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN'))
  WITH CHECK (auth.jwt()->>'role' IN ('SECURITY', 'ADMIN', 'SUPER_ADMIN'));

-- ============================================================================
-- PHASE 4: STORAGE SECURITY HARDENING
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    UPDATE storage.buckets SET public = false WHERE id IN ('parking-snapshots', 'user-avatars', 'pass-qrs');
  END IF;
END $$;

-- ============================================================================
-- PHASE 6: SECURITY HARDENING FOR FUNCTIONS
-- ============================================================================

ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
