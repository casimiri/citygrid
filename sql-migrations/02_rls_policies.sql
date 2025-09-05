-- Enable Row Level Security (RLS) on all tables
ALTER TABLE org ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_requirement ENABLE ROW LEVEL SECURITY;
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization from JWT
CREATE OR REPLACE FUNCTION public.jwt_org_id() RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'org_id')::UUID,
    (SELECT org_id FROM membership WHERE user_id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user's role in organization
CREATE OR REPLACE FUNCTION public.jwt_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    (SELECT role::TEXT FROM membership WHERE user_id = auth.uid() AND org_id = public.jwt_org_id() LIMIT 1)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organization policies
CREATE POLICY "Users can view their organizations" ON org
  FOR SELECT USING (
    id IN (SELECT org_id FROM membership WHERE user_id = auth.uid())
  );

CREATE POLICY "Organization owners can update" ON org
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM membership 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- User profile policies
CREATE POLICY "Users can view their own profile" ON user_profile
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profile
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON user_profile
  FOR INSERT WITH CHECK (id = auth.uid());

-- Membership policies
CREATE POLICY "Users can view memberships in their orgs" ON membership
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM membership WHERE user_id = auth.uid())
  );

CREATE POLICY "Organization admins can manage memberships" ON membership
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM membership 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Equipment category policies
CREATE POLICY "Users can view categories in their org" ON equipment_category
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage categories" ON equipment_category
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Equipment type policies
CREATE POLICY "Users can view equipment types in their org" ON equipment_type
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage equipment types" ON equipment_type
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Threshold policies
CREATE POLICY "Users can view thresholds in their org" ON threshold
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage thresholds" ON threshold
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Area requirement policies
CREATE POLICY "Users can view area requirements in their org" ON area_requirement
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage area requirements" ON area_requirement
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Project policies
CREATE POLICY "Users can view projects in their org" ON project
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage projects" ON project
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Equipment instance policies
CREATE POLICY "Users can view equipment instances in their org" ON equipment_instance
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage equipment instances" ON equipment_instance
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Attachment policies
CREATE POLICY "Users can view attachments in their org" ON attachment
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "Organization members can manage attachments" ON attachment
  FOR ALL USING (
    org_id = public.jwt_org_id() AND 
    public.jwt_user_role() IN ('owner', 'admin', 'member')
  );

-- Audit log policies (read-only for most users)
CREATE POLICY "Users can view audit logs in their org" ON audit_log
  FOR SELECT USING (org_id = public.jwt_org_id());

CREATE POLICY "System can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;