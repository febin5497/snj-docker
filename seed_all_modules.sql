-- CORRECTED SEED DATA
-- 1. CHART OF ACCOUNTS
INSERT INTO chart_of_accounts (account_code, account_name, account_type, company_id) VALUES
('1000', 'Cash', 'asset', 1), ('1010', 'Bank Account', 'asset', 1),
('1020', 'Accounts Receivable', 'asset', 1), ('1030', 'Inventory', 'asset', 1),
('1040', 'Fixed Assets', 'asset', 1), ('2000', 'Accounts Payable', 'liability', 1),
('2010', 'GST Payable', 'liability', 1), ('2020', 'TDS Payable', 'liability', 1),
('2030', 'Loans', 'liability', 1), ('3000', 'Owner Equity', 'equity', 1),
('3010', 'Retained Earnings', 'equity', 1), ('4000', 'Project Revenue', 'revenue', 1),
('4010', 'Service Revenue', 'revenue', 1), ('4020', 'Material Sales', 'revenue', 1),
('5000', 'Material Cost', 'expense', 1), ('5010', 'Labor Cost', 'expense', 1),
('5020', 'Equipment Cost', 'expense', 1), ('5030', 'Fuel Expense', 'expense', 1),
('5040', 'Office Expense', 'expense', 1), ('5050', 'Utilities', 'expense', 1),
('5060', 'Salary Expense', 'expense', 1), ('5070', 'Contractor Payment', 'expense', 1),
('5080', 'Insurance', 'expense', 1), ('5090', 'Maintenance Expense', 'expense', 1);

-- 2. BUDGETS
INSERT INTO budgets (project_id, category, budget_amount, spent_amount, company_id) VALUES
(1, 'Foundation & Structure', 500000, 320000, 1),
(1, 'Electrical', 150000, 45000, 1),
(2, 'Plumbing', 120000, 85000, 1),
(2, 'Interior', 300000, 120000, 1),
(3, 'Roofing', 200000, 180000, 1),
(4, 'Site Work', 400000, 350000, 1),
(5, 'Painting', 80000, 25000, 1),
(6, 'HVAC', 180000, 90000, 1);

-- 3. EXPENSES
INSERT INTO expenses (staff_id, project_id, category, description, amount, status, company_id) VALUES
(1, 1, 'Materials', 'Cement 500 bags @ 380', 190000, 'approved', 1),
(1, 1, 'Materials', 'Steel reinforcement bars TMT', 85000, 'approved', 1),
(2, 1, 'Labor', 'Foundation labor - 15 workers x 10 days', 75000, 'approved', 1),
(3, 1, 'Equipment', 'JCB excavator rental - 5 days', 25000, 'approved', 1),
(1, 1, 'Materials', 'Aggregate and sand delivery', 35000, 'approved', 1),
(4, 2, 'Materials', 'PVC pipes and fittings', 42000, 'approved', 1),
(4, 2, 'Materials', 'CPVC pipes for hot water', 28000, 'approved', 1),
(5, 2, 'Labor', 'Plumbing work - 8 workers x 8 days', 48000, 'approved', 1),
(5, 2, 'Equipment', 'Core cutting machine rental', 8000, 'approved', 1),
(6, 3, 'Materials', 'Roofing tiles and waterproofing', 95000, 'approved', 1),
(7, 3, 'Labor', 'Roofing installation - 12 workers x 5 days', 60000, 'approved', 1),
(7, 3, 'Equipment', 'Crane rental - 3 days', 45000, 'approved', 1),
(8, 4, 'Materials', 'Bricks and blocks - 10000 pcs', 65000, 'approved', 1),
(9, 4, 'Labor', 'Masonry work - 20 workers x 12 days', 120000, 'approved', 1),
(10, 4, 'Materials', 'Sand and mortar mix', 22000, 'pending', 1),
(11, 5, 'Materials', 'Paint primer and distemper', 35000, 'approved', 1),
(12, 5, 'Labor', 'Painting work - 6 workers x 7 days', 32000, 'approved', 1),
(13, 6, 'Materials', 'AC units and copper piping', 120000, 'approved', 1),
(14, 6, 'Equipment', 'AC installation tools', 15000, 'pending', 1),
(15, 6, 'Labor', 'HVAC installation - 4 workers x 10 days', 40000, 'approved', 1),
(1, 1, 'Utilities', 'Site electricity bill June', 8500, 'approved', 1),
(2, 2, 'Utilities', 'Site water tanker supply', 6000, 'approved', 1),
(3, 3, 'Insurance', 'Worker insurance premium', 18000, 'approved', 1),
(4, 4, 'Transport', 'Material transport charges', 32000, 'approved', 1),
(5, 5, 'Miscellaneous', 'Safety equipment and helmets', 12000, 'pending', 1);

-- 4. PAYROLL RECORDS (June cycle=1, July cycle=2)
INSERT INTO payroll_records (cycle_id, staff_id, basic_salary, allowances, deductions, net_pay, status, company_id) VALUES
(1, 1, 45000, 8000, 5400, 47600, 'paid', 1),
(1, 2, 38000, 6000, 4560, 39440, 'paid', 1),
(1, 3, 42000, 7000, 5040, 43960, 'paid', 1),
(1, 4, 35000, 5500, 4200, 36300, 'paid', 1),
(1, 5, 48000, 9000, 5760, 51240, 'paid', 1),
(1, 6, 32000, 5000, 3840, 33160, 'paid', 1),
(1, 7, 40000, 6500, 4800, 41700, 'paid', 1),
(1, 8, 55000, 10000, 6600, 58400, 'paid', 1),
(1, 9, 36000, 5800, 4320, 37480, 'paid', 1),
(1, 10, 44000, 7500, 5280, 46220, 'paid', 1),
(1, 11, 30000, 4500, 3600, 30900, 'paid', 1),
(1, 12, 50000, 8500, 6000, 52500, 'paid', 1),
(1, 13, 34000, 5200, 4080, 35120, 'paid', 1),
(1, 14, 46000, 7800, 5520, 48280, 'paid', 1),
(1, 15, 37000, 5600, 4440, 38160, 'paid', 1),
(2, 1, 45000, 8000, 5400, 47600, 'pending', 1),
(2, 2, 38000, 6000, 4560, 39440, 'pending', 1),
(2, 3, 42000, 7000, 5040, 43960, 'pending', 1),
(2, 4, 35000, 5500, 4200, 36300, 'pending', 1),
(2, 5, 48000, 9000, 5760, 51240, 'pending', 1);

-- 5. PURCHASES
INSERT INTO purchases (supplier_id, project_id, total_amount, status, company_id) VALUES
(1, 1, 190000, 'received', 1),
(1, 1, 85000, 'received', 1),
(2, 2, 42000, 'received', 1),
(3, 3, 95000, 'received', 1),
(4, 4, 35000, 'received', 1),
(5, 6, 120000, 'ordered', 1),
(1, 4, 65000, 'ordered', 1),
(2, 2, 28000, 'pending', 1);

-- 6. PURCHASE ITEMS (material_name instead of material_id)
INSERT INTO purchase_items (purchase_id, material_name, quantity, unit_price, total) VALUES
(1, 'OPC Cement 53 Grade', 500, 380, 190000),
(2, 'TMT Steel Bars 12mm', 50, 1700, 85000),
(3, 'PVC Pipes 4 inch', 200, 210, 42000),
(4, 'Roofing Tiles Premium', 100, 950, 95000),
(5, 'Red Bricks A Grade', 100, 350, 35000),
(6, 'Split AC 1.5 Ton', 10, 12000, 120000),
(7, 'Sand - River Sand', 200, 325, 65000),
(8, 'CPVC Pipes 1/2 inch', 100, 280, 28000);

-- 7. SALES (client_name instead of client_id)
INSERT INTO sales (client_name, project_id, total_amount, status, company_id) VALUES
('ABC Corporation', 1, 450000, 'completed', 1),
('BuildRight Homes', 2, 320000, 'completed', 1),
('City Developers', 3, 180000, 'pending', 1),
('Metro Constructions', 4, 550000, 'completed', 1),
('Skyline Builders', 5, 275000, 'pending', 1);

-- 8. SALE ITEMS (material_name instead of material_id)
INSERT INTO sale_items (sale_id, material_name, quantity, unit_price, total) VALUES
(1, 'OPC Cement 53 Grade', 800, 420, 336000),
(1, 'TMT Steel Bars 12mm', 60, 1900, 114000),
(2, 'PVC Pipes 4 inch', 500, 250, 125000),
(2, 'Roofing Tiles Premium', 200, 975, 195000),
(3, 'Red Bricks A Grade', 300, 400, 120000),
(4, 'Split AC 1.5 Ton', 25, 14000, 350000),
(4, 'Sand - River Sand', 400, 500, 200000),
(5, 'OPC Cement 53 Grade', 350, 420, 147000),
(5, 'PVC Pipes 4 inch', 250, 250, 62500);

-- 9. INVOICES
INSERT INTO invoices (project_id, invoice_number, client_name, amount, tax, total, status, due_date, company_id) VALUES
(1, 'INV-2026-001', 'ABC Corporation', 396000, 54000, 450000, 'paid', '2026-07-05', 1),
(2, 'INV-2026-002', 'BuildRight Homes', 282000, 38000, 320000, 'partial', '2026-07-08', 1),
(3, 'INV-2026-003', 'City Developers', 159000, 21000, 180000, 'pending', '2026-07-10', 1),
(4, 'INV-2026-004', 'Metro Constructions', 486000, 64000, 550000, 'paid', '2026-07-12', 1),
(5, 'INV-2026-005', 'Skyline Builders', 243000, 32000, 275000, 'partial', '2026-07-15', 1),
(6, 'INV-2026-006', 'ABC Corporation', 335000, 45000, 380000, 'pending', '2026-07-20', 1),
(7, 'INV-2026-007', 'BuildRight Homes', 256000, 34000, 290000, 'paid', '2026-07-25', 1);

-- 10. CASH TRANSACTIONS (date column, no transaction_date)
INSERT INTO cash_transactions (project_id, staff_id, date, type, category, amount, description, created_by, company_id) VALUES
(1, 1, '2026-06-01', 'income', 'Project Payment', 200000, 'Advance payment from ABC Corp', 1, 1),
(1, 1, '2026-06-01', 'expense', 'Materials', 190000, 'Cement purchase', 1, 1),
(1, 2, '2026-06-10', 'expense', 'Labor', 75000, 'Foundation labor payment', 1, 1),
(2, 3, '2026-06-05', 'income', 'Project Payment', 150000, 'Milestone payment - Phase 1', 1, 1),
(2, 4, '2026-06-02', 'expense', 'Materials', 42000, 'PVC pipes purchase', 1, 1),
(3, 5, '2026-06-08', 'income', 'Project Payment', 320000, 'Full payment received', 1, 1),
(3, 6, '2026-06-04', 'expense', 'Materials', 95000, 'Roofing materials', 1, 1),
(4, 7, '2026-06-05', 'expense', 'Labor', 120000, 'Masonry workers payment', 1, 1),
(5, 8, '2026-06-10', 'expense', 'Painting', 67000, 'Paint and labor', 1, 1),
(6, 9, '2026-06-02', 'expense', 'Equipment', 120000, 'AC units purchase', 1, 1),
(NULL, 10, '2026-06-30', 'expense', 'Salary', 650600, 'June 2026 staff salaries', 1, 1),
(NULL, 11, '2026-06-30', 'expense', 'Utilities', 12000, 'Office electricity bill', 1, 1),
(NULL, 12, '2026-06-01', 'expense', 'Rent', 35000, 'Office rent June', 1, 1),
(NULL, 13, '2026-06-15', 'income', 'Other', 28000, 'Scrap material sale', 1, 1),
(1, 1, '2026-06-20', 'income', 'Project Payment', 150000, 'Second milestone', 1, 1),
(4, 7, '2026-06-25', 'income', 'Project Payment', 200000, 'Final payment', 1, 1),
(2, 4, '2026-06-12', 'expense', 'Transport', 8500, 'Material delivery charges', 1, 1),
(3, 6, '2026-06-01', 'expense', 'Insurance', 18000, 'Worker insurance', 1, 1),
(5, 8, '2026-06-15', 'income', 'Project Payment', 100000, 'Advance received', 1, 1),
(6, 9, '2026-06-20', 'income', 'Project Payment', 180000, 'First installment', 1, 1);

-- 11. FUEL LOGS (date column, no driver_id/odometer)
INSERT INTO fuel_logs (vehicle_id, date, liters, amount, company_id) VALUES
(1, '2026-06-01', 45, 4500, 1),
(1, '2026-06-08', 42, 4200, 1),
(1, '2026-06-15', 48, 4800, 1),
(2, '2026-06-02', 38, 3800, 1),
(2, '2026-06-09', 35, 3500, 1),
(3, '2026-06-03', 52, 5200, 1),
(3, '2026-06-10', 50, 5000, 1),
(4, '2026-06-04', 30, 3000, 1),
(5, '2026-06-05', 55, 5500, 1),
(5, '2026-06-12', 53, 5300, 1),
(6, '2026-06-06', 40, 4000, 1),
(7, '2026-06-07', 28, 2800, 1),
(8, '2026-06-08', 60, 6000, 1);

-- 12. MAINTENANCE LOGS (date column, no next_service_date)
INSERT INTO maintenance_logs (vehicle_id, date, description, cost, status, company_id) VALUES
(1, '2026-06-01', 'Regular service - oil change, filter replacement', 8500, 'completed', 1),
(2, '2026-06-05', 'Brake pad replacement front and rear', 12000, 'completed', 1),
(3, '2026-06-03', 'Engine tune-up and belt replacement', 15000, 'completed', 1),
(4, '2026-06-07', 'AC compressor repair', 22000, 'completed', 1),
(5, '2026-06-10', 'Full service - all fluids replaced', 18000, 'completed', 1),
(6, '2026-06-12', 'Suspension overhaul', 25000, 'in_progress', 1),
(7, '2026-06-15', 'Battery replacement', 8000, 'completed', 1),
(8, '2026-06-08', 'Tire replacement all 6', 36000, 'pending', 1);

-- 13. PURCHASE INDENTS
INSERT INTO purchase_indents (project_id, status, company_id) VALUES
(1, 'approved', 1), (2, 'pending', 1), (3, 'approved', 1), (4, 'pending', 1);

-- 14. QUOTES (client_name, project_id)
INSERT INTO quotes (client_name, project_id, total_amount, status, company_id) VALUES
('ABC Corporation', 1, 500000, 'accepted', 1),
('BuildRight Homes', 2, 350000, 'sent', 1),
('City Developers', 3, 280000, 'draft', 1),
('Metro Constructions', 4, 620000, 'accepted', 1),
('Skyline Builders', 5, 190000, 'rejected', 1);

-- 15. QUOTE ITEMS (no company_id column)
INSERT INTO quote_items (quote_id, description, quantity, unit_price, total) VALUES
(1, 'Foundation construction', 1, 250000, 250000),
(1, 'Plumbing work', 1, 120000, 120000),
(1, 'Electrical work', 1, 130000, 130000),
(2, 'Interior designing', 1, 200000, 200000),
(2, 'Furniture supply', 1, 150000, 150000),
(3, 'Roofing work', 1, 180000, 180000),
(3, 'Waterproofing', 1, 100000, 100000),
(4, 'Complete building construction', 1, 420000, 420000),
(4, 'Landscaping', 1, 200000, 200000),
(5, 'Painting work', 1, 120000, 120000),
(5, 'Woodwork', 1, 70000, 70000);

-- 16. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, is_read, company_id) VALUES
(1, 'New Purchase Indent', 'Staff #1 raised a purchase indent for Project 1', 'info', false, 1),
(1, 'Payroll Pending', 'July 2026 payroll needs approval', 'warning', false, 1),
(1, 'Invoice Overdue', 'Invoice #3 payment is overdue', 'danger', false, 1),
(1, 'Budget Alert', 'Project 3 roofing budget 90% utilized', 'warning', true, 1),
(1, 'New Sale Created', 'Sale #5 created for Skyline Builders', 'info', true, 1),
(2, 'Attendance Reminder', 'Please mark your attendance for today', 'info', false, 1),
(2, 'Salary Credited', 'June 2026 salary has been credited', 'success', true, 1),
(3, 'Project Update', 'Project 1 foundation work completed', 'info', false, 1),
(4, 'Leave Approved', 'Your leave request for June 5 has been approved', 'success', true, 1),
(5, 'Task Assigned', 'You have been assigned to Project 4', 'info', false, 1);

SELECT 'All seed data inserted!' as result;
