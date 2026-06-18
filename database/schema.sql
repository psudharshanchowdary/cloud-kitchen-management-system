-- Queen's Cloud Kitchen Management System
-- Production-Ready PostgreSQL SQL Schema for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles enum
CREATE TYPE user_role AS ENUM (
  'Owner', 
  'Operations Manager', 
  'Head Chef', 
  'Chef', 
  'Kitchen Assistant', 
  'Inventory Manager', 
  'Packing Staff',
  'Delivery Driver'
);

-- Create order statuses enum
CREATE TYPE order_status AS ENUM (
  'Pending',
  'Accepted',
  'Preparing',
  'Ready',
  'Packed',
  'Out For Delivery',
  'Delivered',
  'Cancelled'
);

-- Create order priorities enum
CREATE TYPE order_priority AS ENUM (
  'Low',
  'Normal',
  'High'
);

-- Create order item preparation statuses
CREATE TYPE item_status AS ENUM (
  'Pending',
  'Cooking',
  'Ready'
);

-- Create payment statuses
CREATE TYPE payment_status AS ENUM (
  'Pending',
  'Paid',
  'Failed',
  'Refunded'
);

-- Create payment methods
CREATE TYPE payment_method AS ENUM (
  'Cash',
  'UPI',
  'Card',
  'Net Banking'
);

-- -----------------------------------------------------
-- 1. Users Profiles
-- -----------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'Chef',
  phone VARCHAR(15),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 2. Staff Profiles
-- -----------------------------------------------------
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  salary DECIMAL(12, 2) NOT NULL CHECK (salary >= 0),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 3. Attendance Logs
-- -----------------------------------------------------
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  staff_name TEXT NOT NULL,
  role user_role NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIME NOT NULL,
  clock_out TIME,
  working_hours DECIMAL(5, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Late', 'Absent')),
  UNIQUE (staff_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 4. Menu Items
-- -----------------------------------------------------
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time INTEGER NOT NULL DEFAULT 15 CHECK (preparation_time > 0),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 5. Suppliers Directory
-- -----------------------------------------------------
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone VARCHAR(15) NOT NULL,
  email TEXT,
  address TEXT,
  payment_terms VARCHAR(50),
  lead_time INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 6. Inventory catalog
-- -----------------------------------------------------
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantity >= 0),
  unit VARCHAR(10) NOT NULL,
  min_level DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price_per_unit >= 0),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  storage_location VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 7. Menu Item Ingredients Recipe Mapping
-- -----------------------------------------------------
CREATE TABLE public.menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 8. Inventory Transactions Logs
-- -----------------------------------------------------
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  type VARCHAR(15) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 9. Orders Header
-- -----------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone VARCHAR(15) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  status order_status NOT NULL DEFAULT 'Pending',
  priority order_priority NOT NULL DEFAULT 'Normal',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  payment_method payment_method NOT NULL DEFAULT 'UPI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 10. Order Items Detail
-- -----------------------------------------------------
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  status item_status NOT NULL DEFAULT 'Pending',
  special_instructions TEXT
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 11. Procurement Purchase Orders
-- -----------------------------------------------------
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Pending', 'Ordered', 'Received', 'Cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 12. Purchase Order Items Details
-- -----------------------------------------------------
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(10) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL CHECK (price_per_unit >= 0)
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 13. Expenses
-- -----------------------------------------------------
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 14. Revenue Logs
-- -----------------------------------------------------
CREATE TABLE public.revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 15. In-App Notifications
-- -----------------------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(15) NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 16. Security Audit logs
-- -----------------------------------------------------
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT NOT NULL,
  role user_role NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 17. Kitchen Stations
-- -----------------------------------------------------
CREATE TABLE public.kitchen_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 18. Chef assignments
-- -----------------------------------------------------
CREATE TABLE public.chef_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  chef_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  chef_name TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.chef_assignments ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------
-- 19. Delivery Drivers
-- -----------------------------------------------------
CREATE TABLE public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Delivery', 'Offline'))
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 20. Deliveries
-- -----------------------------------------------------
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivery_start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivered_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'Out For Delivery',
  notes TEXT
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 21. Supplier Deliveries
-- -----------------------------------------------------
CREATE TABLE public.supplier_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  supplier_name TEXT NOT NULL,
  source_warehouse TEXT NOT NULL,
  truck_number VARCHAR(30) NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  dispatch_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  delivery_notes TEXT,
  invoice_number VARCHAR(50),
  invoice_amount DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_deliveries ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 22. Supplier Delivery Products
-- -----------------------------------------------------
CREATE TABLE public.supplier_delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES public.supplier_deliveries(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  quantity_ordered DECIMAL(12, 3) NOT NULL,
  quantity_received DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  unit VARCHAR(10) NOT NULL,
  batch_number VARCHAR(50),
  expiry_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Good'
);

ALTER TABLE public.supplier_delivery_items ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------
-- INDEXES FOR QUERY OPTIMIZATION
-- -----------------------------------------------------
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at);


-- -----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------

-- 1. Profiles Policies
CREATE POLICY "Allow public read on profiles" 
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow individual update on own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Orders Policies
CREATE POLICY "Allow authenticated read on orders" 
  ON public.orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Owners and Managers full write on orders" 
  ON public.orders FOR ALL TO authenticated 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Owner', 'Operations Manager')
  );

CREATE POLICY "Allow Chefs to update order status" 
  ON public.orders FOR UPDATE TO authenticated 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Owner', 'Operations Manager', 'Head Chef', 'Chef')
  );
  
-- 3. Inventory Policies
CREATE POLICY "Allow authenticated read on inventory" 
  ON public.inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Owners and Inventory Managers to edit stock" 
  ON public.inventory FOR ALL TO authenticated 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Owner', 'Operations Manager', 'Inventory Manager')
  );
