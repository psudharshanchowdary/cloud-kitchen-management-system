-- Seed script for Queen's Cloud Kitchen Supabase database
-- Run this script inside Supabase SQL Editor after running schema.sql

-- 1. Insert Kitchen Stations
INSERT INTO public.kitchen_stations (name, status) VALUES
('Tandoor Station', 'Active'),
('Gravy & Curry Station', 'Active'),
('Rice & Biryani Station', 'Active'),
('Chinese Fryer Station', 'Active');

-- 2. Insert Menu Catalog Items
INSERT INTO public.menu_items (name, category, price, description, is_vegetarian, is_available, preparation_time) VALUES
('Chicken Biryani', 'Rice & Biryani', 280.00, 'Authentic Hyderabadi dum biryani cooked with tender chicken pieces and basmati rice.', false, true, 25),
('Paneer Butter Masala', 'Main Course', 240.00, 'Cottage cheese cubes cooked in a rich, creamy, tomato and cashew-based gravy.', true, true, 20),
('Butter Naan', 'Breads', 60.00, 'Soft and fluffy flatbread baked in tandoor and brushed with fresh butter.', true, true, 8),
('Tandoori Chicken (Half)', 'Starters', 220.00, 'Chicken marinated in yogurt and spices, roasted to perfection in a tandoor.', false, true, 18),
('Gulab Jamun (2 Pcs)', 'Desserts', 80.00, 'Soft milk-solid balls dipped in sweet cardamom flavored sugar syrup.', true, true, 5),
('Masala Chaas', 'Beverages', 50.00, 'Refreshing buttermilk spiced with ginger, green chillies, coriander and roasted cumin.', true, true, 5),
('Veg Fried Rice', 'Chinese', 180.00, 'Stir-fried rice cooked with fresh seasonal vegetables and authentic Chinese sauces.', true, true, 15),
('Chilli Chicken', 'Chinese', 240.00, 'Crispy chicken chunks tossed in spicy soy-chilli sauce with capsicum and onions.', false, true, 15);

-- 3. Insert Raw Suppliers
INSERT INTO public.suppliers (name, contact_person, phone, email, address, payment_terms, lead_time) VALUES
('Fresh Foods & Dairy Co.', 'Rajesh Kumar', '9988776655', 'rajesh@freshfoods.com', 'G-14, Koyambedu Market, Chennai, Tamil Nadu 600107', 'Net 15', 1),
('Metro Cash & Carry Bulk Hub', 'Siddharth Sen', '9988776656', 'siddharth@metrocorp.in', 'NH-4 Bypass, Poonamallee, Chennai, Tamil Nadu 600056', 'Cash on Delivery', 2);

-- 4. Insert Inventory Items (Raw Materials)
-- Note: supplier_id references suppliers table. Use subqueries to resolve IDs.
INSERT INTO public.inventory (name, category, quantity, unit, min_level, price_per_unit, supplier_id, storage_location) VALUES
('Chicken', 'Meat & Seafood', 25.000, 'kg', 10.000, 220.00, (SELECT id FROM public.suppliers WHERE name = 'Fresh Foods & Dairy Co.'), 'Deep Freezer 1'),
('Basmati Rice', 'Grains & Spices', 80.000, 'kg', 20.000, 90.00, (SELECT id FROM public.suppliers WHERE name = 'Metro Cash & Carry Bulk Hub'), 'Dry Pantry Rack A'),
('Paneer', 'Dairy', 12.000, 'kg', 5.000, 320.00, (SELECT id FROM public.suppliers WHERE name = 'Fresh Foods & Dairy Co.'), 'Walk-in Cooler 1'),
('Amul Butter', 'Dairy', 4.000, 'kg', 6.000, 480.00, (SELECT id FROM public.suppliers WHERE name = 'Fresh Foods & Dairy Co.'), 'Walk-in Cooler 2'),
('Tomatoes', 'Vegetables', 3.000, 'kg', 8.000, 40.00, (SELECT id FROM public.suppliers WHERE name = 'Fresh Foods & Dairy Co.'), 'Vegetable Crate B'),
('Maida (Flour)', 'Grains & Spices', 45.000, 'kg', 15.000, 45.00, (SELECT id FROM public.suppliers WHERE name = 'Metro Cash & Carry Bulk Hub'), 'Dry Pantry Rack B'),
('Refined Sunflower Oil', 'Oils & Condiments', 30.000, 'L', 15.000, 130.00, (SELECT id FROM public.suppliers WHERE name = 'Metro Cash & Carry Bulk Hub'), 'Dry Pantry Floor');

-- 5. Insert Recipes Ingredients Linkages
INSERT INTO public.menu_item_ingredients (menu_item_id, ingredient_id, quantity) VALUES
((SELECT id FROM public.menu_items WHERE name = 'Chicken Biryani'), (SELECT id FROM public.inventory WHERE name = 'Chicken'), 0.2500),
((SELECT id FROM public.menu_items WHERE name = 'Chicken Biryani'), (SELECT id FROM public.inventory WHERE name = 'Basmati Rice'), 0.1500),
((SELECT id FROM public.menu_items WHERE name = 'Paneer Butter Masala'), (SELECT id FROM public.inventory WHERE name = 'Paneer'), 0.2000),
((SELECT id FROM public.menu_items WHERE name = 'Paneer Butter Masala'), (SELECT id FROM public.inventory WHERE name = 'Amul Butter'), 0.0500),
((SELECT id FROM public.menu_items WHERE name = 'Paneer Butter Masala'), (SELECT id FROM public.inventory WHERE name = 'Tomatoes'), 0.1500),
((SELECT id FROM public.menu_items WHERE name = 'Butter Naan'), (SELECT id FROM public.inventory WHERE name = 'Maida (Flour)'), 0.1000),
((SELECT id FROM public.menu_items WHERE name = 'Butter Naan'), (SELECT id FROM public.inventory WHERE name = 'Amul Butter'), 0.0200);

-- 6. Insert Mock Expenses
INSERT INTO public.expenses (category, amount, description, expense_date) VALUES
('Ingredients Stock', 7600.00, 'Initial bulk purchasing from Fresh Foods Co.', '2026-06-16'),
('Rent & Utilities', 35000.00, 'Monthly kitchen rent for June 2026', '2026-06-01'),
('Marketing & Promotions', 12000.00, 'Ad campaigns on Instagram for festival seasons', '2026-06-10');
