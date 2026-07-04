import bcrypt
import datetime

def h(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

today = datetime.date.today().isoformat()
pw_admin = h("Admin@123")
pw_erp = h("Erp@123")

sql = f"""
-- Company
INSERT INTO companies (id, name, address, phone, email, gst_number) VALUES
(1, 'SJN Constructions Pvt Ltd', 'Mumbai, Maharashtra', '+91-9876543210', 'info@sjn.in', 'GST27AABCS1234F1Z5');

-- Users
INSERT INTO users (username, password_hash, role, company_id, password_change_required, is_active) VALUES
('superadmin', '{pw_admin}', 'super_admin', 1, false, true),
('admin', '{pw_admin}', 'super_admin', 1, false, true),
('manager', '{pw_erp}', 'manager', 1, true, true);

-- Staff (15 people)
INSERT INTO staff (staff_id, first_name, last_name, phone, designation, department, role, salary, monthly_salary, user_id, company_id, status, joining_date) VALUES
('STF-2026-001', 'Rajesh', 'Kumar', '+91-9876543201', 'Project Manager', 'Projects', 'manager', 75000, 75000, NULL, 1, 'Active', '2026-01-15'),
('STF-2026-002', 'Suresh', 'Patel', '+91-9876543202', 'Site Engineer', 'Projects', 'staff', 45000, 45000, NULL, 1, 'Active', '2026-01-20'),
('STF-2026-003', 'Amit', 'Singh', '+91-9876543203', 'Safety Officer', 'Projects', 'staff', 40000, 40000, NULL, 1, 'Active', '2026-02-01'),
('STF-2026-004', 'Priya', 'Sharma', '+91-9876543204', 'HR Manager', 'HR', 'staff', 55000, 55000, NULL, 1, 'Active', '2026-01-10'),
('STF-2026-005', 'Vikram', 'Joshi', '+91-9876543205', 'Accountant', 'Finance', 'staff', 42000, 42000, NULL, 1, 'Active', '2026-01-25'),
('STF-2026-006', 'Manish', 'Gupta', '+91-9876543206', 'Procurement Lead', 'Procurement', 'staff', 48000, 48000, NULL, 1, 'Active', '2026-02-05'),
('STF-2026-007', 'Deepak', 'Yadav', '+91-9876543207', 'Site Supervisor', 'Projects', 'staff', 38000, 38000, NULL, 1, 'Active', '2026-02-10'),
('STF-2026-008', 'Rahul', 'Verma', '+91-9876543208', 'Equipment Manager', 'Inventory', 'staff', 40000, 40000, NULL, 1, 'Active', '2026-02-15'),
('STF-2026-009', 'Suresh', 'Reddy', '+91-9876543209', 'Vehicle Incharge', 'Logistics', 'staff', 35000, 35000, NULL, 1, 'Active', '2026-02-20'),
('STF-2026-010', 'Kavita', 'Desai', '+91-9876543211', 'Quality Inspector', 'Projects', 'staff', 42000, 42000, NULL, 1, 'Active', '2026-03-01'),
('STF-2026-011', 'Anil', 'Mishra', '+91-9876543212', 'Electrical Engineer', 'Projects', 'staff', 45000, 45000, NULL, 1, 'Active', '2026-03-05'),
('STF-2026-012', 'Sanjay', 'Nair', '+91-9876543213', 'Civil Engineer', 'Projects', 'staff', 50000, 50000, NULL, 1, 'Active', '2026-03-10'),
('STF-2026-013', 'Pooja', 'Rao', '+91-9876543214', 'Sales Executive', 'Sales', 'staff', 35000, 35000, NULL, 1, 'Active', '2026-03-15'),
('STF-2026-014', 'Nikhil', 'Tiwari', '+91-9876543215', 'Store Keeper', 'Inventory', 'staff', 30000, 30000, NULL, 1, 'Active', '2026-03-20'),
('STF-2026-015', 'Arjun', 'Menon', '+91-9876543216', 'Safety Inspector', 'Projects', 'staff', 38000, 38000, NULL, 1, 'Active', '2026-03-25');

-- Clients (8)
INSERT INTO clients (name, phone, email, address, company_id) VALUES
('Municipal Corporation of Mumbai', '+91-22-23456789', 'mumbai@gov.in', 'Mumbai, Maharashtra', 1),
('Reliance Infrastructure Ltd', '+91-22-34567890', 'projects@reliance.in', 'Mumbai, Maharashtra', 1),
('Tata Housing Development', '+91-22-45678901', 'projects@tata.in', 'Mumbai, Maharashtra', 1),
('L&T Construction', '+91-22-56789012', 'projects@lt.in', 'Mumbai, Maharashtra', 1),
('Adani Realty', '+91-79-67890123', 'projects@adani.in', 'Ahmedabad, Gujarat', 1),
('DLF Limited', '+91-124-7890123', 'projects@dlf.in', 'Gurgaon, Haryana', 1),
('Godrej Properties', '+91-22-89012345', 'projects@godrej.in', 'Mumbai, Maharashtra', 1),
('Brigade Enterprises', '+91-80-90123456', 'projects@brigade.in', 'Bangalore, Karnataka', 1);

-- Projects (8)
INSERT INTO projects (name, location, start_date, user_id, company_id, client_id, rate_per_sqft, square_feet, status) VALUES
('Metro Phase 2 Extension', 'Mumbai', '2026-01-01', 1, 1, 1, 2500, 500000, 'in_progress'),
('Residential Tower A', 'Navi Mumbai', '2026-02-01', 1, 1, 3, 1800, 120000, 'in_progress'),
('Tech Park Phase 1', 'Pune', '2026-01-15', 1, 1, 4, 2200, 200000, 'in_progress'),
('Highway NH-48 widening', 'Mumbai-Pune', '2026-03-01', 1, 1, 2, 1500, 800000, 'planning'),
('Water Treatment Plant', 'Thane', '2026-02-15', 1, 1, 1, 3000, 80000, 'in_progress'),
('Shopping Mall', 'Bangalore', '2026-04-01', 1, 1, 8, 2000, 300000, 'planning'),
('Bridge Flyover', 'Ahmedabad', '2026-03-15', 1, 1, 5, 3500, 50000, 'in_progress'),
('Solar Farm Phase 1', 'Rajasthan', '2026-05-01', 1, 1, 2, 1200, 1000000, 'planning');

-- Vehicles (8)
INSERT INTO vehicles (registration_number, vehicle_type, make_model, year, status, fuel_type, company_id) VALUES
('MH-01-AB-1234', 'Truck', 'Tata Prima 4040', 2024, 'active', 'Diesel', 1),
('MH-02-CD-5678', 'Excavator', 'CAT 320D', 2023, 'active', 'Diesel', 1),
('MH-03-EF-9012', 'Crane', 'Liebherr LTM 1100', 2024, 'active', 'Diesel', 1),
('MH-04-GH-3456', 'Bulldozer', 'Komatsu D65', 2023, 'active', 'Diesel', 1),
('MH-05-IJ-7890', 'Dump Truck', 'Volvo A30G', 2024, 'maintenance', 'Diesel', 1),
('MH-06-KL-1234', 'Mixer', 'Schwing Stetter', 2023, 'active', 'Diesel', 1),
('MH-07-MN-5678', 'Backhoe', 'JCB 3DX', 2024, 'active', 'Diesel', 1),
('MH-08-OP-9012', 'Flatbed', 'Ashok Leyland', 2022, 'active', 'Diesel', 1);

-- Equipment (8)
INSERT INTO equipment (name, type, status, company_id) VALUES
('Concrete Mixer 500L', 'mixer', 'active', 1),
('Tower Crane 12T', 'crane', 'active', 1),
('Excavator CAT 320', 'excavator', 'active', 1),
('Compactor Roller', 'roller', 'active', 1),
('Pile Driver', 'pile_driver', 'maintenance', 1),
('Batching Plant 120', 'batching_plant', 'active', 1),
('Welding Machine', 'welding', 'active', 1),
('Generator 500KVA', 'generator', 'active', 1);

-- Materials (15)
INSERT INTO materials (name, unit, category, quantity, min_quantity, cost, company_id) VALUES
('OPC 53 Cement', 'bags', 'Cement', 5000, 1000, 380, 1),
('TMT Steel Bar 12mm', 'tons', 'Steel', 200, 50, 58000, 1),
('TMT Steel Bar 16mm', 'tons', 'Steel', 150, 40, 60000, 1),
('River Sand', 'tons', 'Aggregates', 500, 100, 1800, 1),
('Crushed Stone 20mm', 'tons', 'Aggregates', 800, 200, 1500, 1),
('Ready Mix Concrete M25', 'cubic_m', 'Concrete', 0, 0, 4500, 1),
('Bricks - First Class', 'thousands', 'Masonry', 300, 50, 5500, 1),
('Fly Ash Bricks', 'thousands', 'Masonry', 200, 50, 4200, 1),
('Waterproofing Compound', 'liters', 'Chemical', 500, 100, 350, 1),
('Admixture - Super Plasticizer', 'liters', 'Chemical', 200, 50, 1200, 1),
('Electrical Wires 2.5sqmm', 'meters', 'Electrical', 5000, 1000, 45, 1),
('PVC Pipes 4 inch', 'meters', 'Plumbing', 1000, 200, 280, 1),
('Ceramic Tiles 60x60', 'sqft', 'Finishing', 2000, 500, 85, 1),
('Paint - Asian Paints', 'liters', 'Finishing', 300, 50, 450, 1),
('Timber 2x4', 'cubic_ft', 'Wood', 500, 100, 120, 1);

-- Suppliers (5)
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, company_id) VALUES
('UltraTech Cement Ltd', 'Ramesh', '+91-9876544001', 'sales@ultratech.in', 'Mumbai, Maharashtra', 'GST27AABCU1234F1Z5', 1),
('Tata Steel Ltd', 'Sanjay', '+91-9876544002', 'sales@tatasteel.in', 'Mumbai, Maharashtra', 'GST27AABCT1234F1Z5', 1),
('ACC Limited', 'Meena', '+91-9876544003', 'sales@acc.in', 'Mumbai, Maharashtra', 'GST27AABCA1234F1Z5', 1),
('Ambuja Cements Ltd', 'Vikram', '+91-9876544004', 'sales@ambuja.in', 'Ahmedabad, Gujarat', 'GST24AABCA1234F1Z5', 1),
('JSW Steel Ltd', 'Arun', '+91-9876544005', 'sales@jsw.in', 'Mumbai, Maharashtra', 'GST27AABCJ1234F1Z5', 1);

-- Cash Transactions (20)
INSERT INTO cash_transactions (date, description, category, type, amount, project_id, staff_id, approved_by, company_id, created_at) VALUES
('2026-01-15', 'Office Rent - January', 'Rent', 'expense', 75000, NULL, NULL, 1, 1, '2026-01-15 10:00:00'),
('2026-01-20', 'Staff Salary - January', 'Salary', 'expense', 650000, NULL, NULL, 1, 1, '2026-01-20 10:00:00'),
('2026-01-25', 'Cement Purchase - Metro Project', 'Materials', 'expense', 190000, 1, NULL, 1, 1, '2026-01-25 10:00:00'),
('2026-02-01', 'Office Rent - February', 'Rent', 'expense', 75000, NULL, NULL, 1, 1, '2026-02-01 10:00:00'),
('2026-02-05', 'Steel Purchase - Residential', 'Materials', 'expense', 348000, 2, NULL, 1, 1, '2026-02-05 10:00:00'),
('2026-02-10', 'Diesel Purchase - Vehicles', 'Fuel', 'expense', 125000, NULL, NULL, 1, 1, '2026-02-10 10:00:00'),
('2026-02-15', 'Staff Salary - February', 'Salary', 'expense', 650000, NULL, NULL, 1, 1, '2026-02-15 10:00:00'),
('2026-02-20', 'Concrete Purchase - Tech Park', 'Materials', 'expense', 225000, 3, NULL, 1, 1, '2026-02-20 10:00:00'),
('2026-03-01', 'Office Rent - March', 'Rent', 'expense', 75000, NULL, NULL, 1, 1, '2026-03-01 10:00:00'),
('2026-03-05', 'Equipment Maintenance', 'Maintenance', 'expense', 85000, NULL, NULL, 1, 1, '2026-03-05 10:00:00'),
('2026-03-10', 'Bricks Purchase - Bridge', 'Materials', 'expense', 165000, 7, NULL, 1, 1, '2026-03-10 10:00:00'),
('2026-03-15', 'Staff Salary - March', 'Salary', 'expense', 650000, NULL, NULL, 1, 1, '2026-03-15 10:00:00'),
('2026-03-20', 'Diesel Purchase - Vehicles', 'Fuel', 'expense', 130000, NULL, NULL, 1, 1, '2026-03-20 10:00:00'),
('2026-03-25', 'Sand Purchase - Water Treatment', 'Materials', 'expense', 90000, 5, NULL, 1, 1, '2026-03-25 10:00:00'),
('2026-04-01', 'Office Rent - April', 'Rent', 'expense', 75000, NULL, NULL, 1, 1, '2026-04-01 10:00:00'),
('2026-04-05', 'Client Payment - Metro Phase 2', 'Project Revenue', 'income', 2500000, 1, NULL, 1, 1, '2026-04-05 10:00:00'),
('2026-04-10', 'Staff Salary - April', 'Salary', 'expense', 650000, NULL, NULL, 1, 1, '2026-04-10 10:00:00'),
('2026-04-15', 'Client Payment - Residential Tower', 'Project Revenue', 'income', 1200000, 2, NULL, 1, 1, '2026-04-15 10:00:00'),
('2026-04-20', 'Inspection Fees', 'Miscellaneous', 'expense', 25000, NULL, NULL, 1, 1, '2026-04-20 10:00:00'),
('2026-04-25', 'Client Payment - Tech Park', 'Project Revenue', 'income', 1800000, 3, NULL, 1, 1, '2026-04-25 10:00:00');
"""

# Print the SQL
print(sql)
