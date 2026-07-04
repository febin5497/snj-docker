-- Vehicles (fixed column names: make, model, type - no fuel_type)
INSERT INTO vehicles (registration_number, type, make, model, year, status, company_id) VALUES
('MH-01-AB-1234', 'Truck', 'Tata', 'Prima 4040', 2024, 'active', 1),
('MH-02-CD-5678', 'Excavator', 'CAT', '320D', 2023, 'active', 1),
('MH-03-EF-9012', 'Crane', 'Liebherr', 'LTM 1100', 2024, 'active', 1),
('MH-04-GH-3456', 'Bulldozer', 'Komatsu', 'D65', 2023, 'active', 1),
('MH-05-IJ-7890', 'Dump Truck', 'Volvo', 'A30G', 2024, 'maintenance', 1),
('MH-06-KL-1234', 'Mixer', 'Schwing Stetter', 'SCH 21', 2023, 'active', 1),
('MH-07-MN-5678', 'Backhoe', 'JCB', '3DX', 2024, 'active', 1),
('MH-08-OP-9012', 'Flatbed', 'Ashok Leyland', 'Captain', 2022, 'active', 1);

-- Equipment (fixed: category instead of type, equipment_code, condition, no is_active/status)
INSERT INTO equipment (name, category, equipment_code, company_id, condition, is_active, purchase_cost) VALUES
('Concrete Mixer 500L', 'Mixer', 'EQP-001', 1, 'Good', true, 350000),
('Tower Crane 12T', 'Crane', 'EQP-002', 1, 'Good', true, 2500000),
('Excavator CAT 320', 'Excavator', 'EQP-003', 1, 'Good', true, 1800000),
('Compactor Roller', 'Roller', 'EQP-004', 1, 'Good', true, 900000),
('Pile Driver', 'Pile Driver', 'EQP-005', 1, 'Needs Repair', true, 1200000),
('Batching Plant 120', 'Batching Plant', 'EQP-006', 1, 'Good', true, 3500000),
('Welding Machine', 'Welding', 'EQP-007', 1, 'Good', true, 45000),
('Generator 500KVA', 'Generator', 'EQP-008', 1, 'Good', true, 850000);

-- Materials (fixed: unit_of_measurement, price, description instead of unit/category/cost/min_quantity)
INSERT INTO materials (name, description, quantity, unit_of_measurement, price, company_id) VALUES
('OPC 53 Cement', 'Portland Pozzolana Cement 53 grade', 5000, 'bags', 380, 1),
('TMT Steel Bar 12mm', 'Fe-500D TMT steel bars 12mm', 200, 'tons', 58000, 1),
('TMT Steel Bar 16mm', 'Fe-500D TMT steel bars 16mm', 150, 'tons', 60000, 1),
('River Sand', 'Clean river sand for construction', 500, 'tons', 1800, 1),
('Crushed Stone 20mm', 'Machine crushed aggregate 20mm', 800, 'tons', 1500, 1),
('Ready Mix Concrete M25', 'Ready mix concrete grade M25', 100, 'cubic_m', 4500, 1),
('Bricks - First Class', 'First class red clay bricks', 300, 'thousands', 5500, 1),
('Fly Ash Bricks', 'Eco-friendly fly ash bricks', 200, 'thousands', 4200, 1),
('Waterproofing Compound', 'Dr. Fixit waterproofing', 500, 'liters', 350, 1),
('Admixture - Super Plasticizer', 'Concrete admixture', 200, 'liters', 1200, 1),
('Electrical Wires 2.5sqmm', 'Havells 2.5 sqmm wire', 5000, 'meters', 45, 1),
('PVC Pipes 4 inch', 'Supreme PVC pipes 4 inch', 1000, 'meters', 280, 1),
('Ceramic Tiles 60x60', 'Kajaria ceramic floor tiles', 2000, 'sqft', 85, 1),
('Paint - Asian Paints', 'Asian Paints Apex exterior', 300, 'liters', 450, 1),
('Timber 2x4', 'Sal wood timber 2x4 feet', 500, 'cubic_ft', 120, 1);

-- Suppliers (fixed: no contact_person column)
INSERT INTO suppliers (name, phone, email, address, gst_number, company_id) VALUES
('UltraTech Cement Ltd', '+91-9876544001', 'sales@ultratech.in', 'Mumbai, Maharashtra', 'GST27AABCU1234F1Z5', 1),
('Tata Steel Ltd', '+91-9876544002', 'sales@tatasteel.in', 'Mumbai, Maharashtra', 'GST27AABCT1234F1Z5', 1),
('ACC Limited', '+91-9876544003', 'sales@acc.in', 'Mumbai, Maharashtra', 'GST27AABCA1234F1Z5', 1),
('Ambuja Cements Ltd', '+91-9876544004', 'sales@ambuja.in', 'Ahmedabad, Gujarat', 'GST24AABCA1234F1Z5', 1),
('JSW Steel Ltd', '+91-9876544005', 'sales@jsw.in', 'Mumbai, Maharashtra', 'GST27AABCJ1234F1Z5', 1);

-- Cash Transactions (fixed: created_by instead of approved_by)
INSERT INTO cash_transactions (date, description, category, type, amount, project_id, staff_id, created_by, company_id) VALUES
('2026-01-15', 'Office Rent - January', 'Rent', 'expense', 75000, NULL, NULL, 1, 1),
('2026-01-20', 'Staff Salary - January', 'Salary', 'expense', 650000, NULL, NULL, 1, 1),
('2026-01-25', 'Cement Purchase - Metro Project', 'Materials', 'expense', 190000, 1, NULL, 1, 1),
('2026-02-01', 'Office Rent - February', 'Rent', 'expense', 75000, NULL, NULL, 1, 1),
('2026-02-05', 'Steel Purchase - Residential', 'Materials', 'expense', 348000, 2, NULL, 1, 1),
('2026-02-10', 'Diesel Purchase - Vehicles', 'Fuel', 'expense', 125000, NULL, NULL, 1, 1),
('2026-02-15', 'Staff Salary - February', 'Salary', 'expense', 650000, NULL, NULL, 1, 1),
('2026-02-20', 'Concrete Purchase - Tech Park', 'Materials', 'expense', 225000, 3, NULL, 1, 1),
('2026-03-01', 'Office Rent - March', 'Rent', 'expense', 75000, NULL, NULL, 1, 1),
('2026-03-05', 'Equipment Maintenance', 'Maintenance', 'expense', 85000, NULL, NULL, 1, 1),
('2026-03-10', 'Bricks Purchase - Bridge', 'Materials', 'expense', 165000, 7, NULL, 1, 1),
('2026-03-15', 'Staff Salary - March', 'Salary', 'expense', 650000, NULL, NULL, 1, 1),
('2026-03-20', 'Diesel Purchase - Vehicles', 'Fuel', 'expense', 130000, NULL, NULL, 1, 1),
('2026-03-25', 'Sand Purchase - Water Treatment', 'Materials', 'expense', 90000, 5, NULL, 1, 1),
('2026-04-01', 'Office Rent - April', 'Rent', 'expense', 75000, NULL, NULL, 1, 1),
('2026-04-05', 'Client Payment - Metro Phase 2', 'Project Revenue', 'income', 2500000, 1, NULL, 1, 1),
('2026-04-10', 'Staff Salary - April', 'Salary', 'expense', 650000, NULL, NULL, 1, 1),
('2026-04-15', 'Client Payment - Residential Tower', 'Project Revenue', 'income', 1200000, 2, NULL, 1, 1),
('2026-04-20', 'Inspection Fees', 'Miscellaneous', 'expense', 25000, NULL, NULL, 1, 1),
('2026-04-25', 'Client Payment - Tech Park', 'Project Revenue', 'income', 1800000, 3, NULL, 1, 1);
