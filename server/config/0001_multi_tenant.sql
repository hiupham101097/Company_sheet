-- Multi-tenant isolation migration
ALTER TABLE users ADD COLUMN company_id TEXT;
ALTER TABLE assets ADD COLUMN company_id TEXT;
ALTER TABLE finance ADD COLUMN company_id TEXT;
ALTER TABLE tasks ADD COLUMN company_id TEXT;
ALTER TABLE contracts ADD COLUMN company_id TEXT;
ALTER TABLE handover_protocols ADD COLUMN company_id TEXT;
ALTER TABLE attendance ADD COLUMN company_id TEXT;
ALTER TABLE categories ADD COLUMN company_id TEXT;
ALTER TABLE ai_contract_templates ADD COLUMN company_id TEXT;

-- Assign all existing data to comp_1 (OMNI ASSETS & LOGISTICS demo company)
UPDATE users SET company_id = 'comp_1' WHERE id != 'super_admin_master' AND email != 'hieupham101097@gmail.com';
UPDATE assets SET company_id = 'comp_1' WHERE company_id IS NULL;
UPDATE finance SET company_id = 'comp_1' WHERE company_id IS NULL;
UPDATE tasks SET company_id = 'comp_1' WHERE company_id IS NULL;
UPDATE contracts SET company_id = 'comp_1' WHERE company_id IS NULL;
UPDATE handover_protocols SET company_id = 'comp_1' WHERE company_id IS NULL;
UPDATE attendance SET company_id = 'comp_1' WHERE company_id IS NULL;

-- Ensure comp_bthander exists for the newly registered enterprise
INSERT OR REPLACE INTO company_tenants (id, company_name, tax_id, admin_name, admin_email, admin_phone, plan_code, license_status, start_date, expire_date, revenue, notes, created_at)
VALUES (
  'comp_bthander',
  'Công Ty TNHH BTHander',
  '',
  'Phạm Minh Hiếu',
  'hieupham101097@gmail.com',
  '',
  'TRIAL_2M',
  'ACTIVE',
  date('now'),
  date('now', '+2 months'),
  0,
  'Doanh nghiệp tự đăng ký',
  datetime('now')
);

-- Link user hieupham101097@gmail.com to comp_bthander
UPDATE users SET company_id = 'comp_bthander' WHERE email = 'hieupham101097@gmail.com';

-- Ensure super_admin_master has role SUPER_ADMIN and company_id SYSTEM
UPDATE users SET company_id = 'SYSTEM' WHERE id = 'super_admin_master';

-- Company-specific settings table for complete isolation
CREATE TABLE IF NOT EXISTS company_settings (
  company_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  category TEXT,
  description TEXT,
  updated_at TEXT,
  PRIMARY KEY (company_id, key)
);
