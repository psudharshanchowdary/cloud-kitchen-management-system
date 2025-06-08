-- MySQL Schema for Cloud Kitchen Management System with 9 tables, each with at least 4 attributes

-- Create the database
CREATE DATABASE IF NOT EXISTS cloud_kitchen;
USE cloud_kitchen;

-- 1. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time INT COMMENT 'Preparation time in minutes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL,
  customer_id INT,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivery_address TEXT,
  payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status ENUM('Pending', 'Cooking', 'Ready') DEFAULT 'Pending',
  special_instructions TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  loyalty_points INT DEFAULT 0,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_order_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  min_level DECIMAL(10, 2),
  price_per_unit DECIMAL(10, 2),
  supplier_id INT,
  expiry_date DATE,
  storage_location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  payment_terms VARCHAR(100),
  lead_time INT COMMENT 'Lead time in days',
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('Admin', 'Manager', 'Chef', 'Staff', 'Delivery', 'Owner') NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  instructions TEXT,
  preparation_time INT COMMENT 'Preparation time in minutes',
  cooking_time INT COMMENT 'Cooking time in minutes',
  serving_size INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 9. Recipe Ingredients Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  inventory_item_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- Add owner user
INSERT INTO users (username, password, name, role, email, phone) VALUES
('owner', '$2a$10$XFE0DWVYAVCXVRxTYAYTNO6svhvkUG1NLz4VlEYlKVAYGGGQ9gHIe', 'Restaurant Owner', 'Owner', 'owner@cloudkitchen.com', '+91 9876543210');

-- Sample Data for Customers (All in Chennai)
INSERT INTO customers (name, phone, email, address, loyalty_points) VALUES
('Rahul Sharma', '+91 9876543210', 'rahul@example.com', '123 Anna Nagar, Chennai, Tamil Nadu 600040', 150),
('Priya Patel', '+91 8765432109', 'priya@example.com', '456 T. Nagar, Chennai, Tamil Nadu 600017', 200),
('Amit Singh', '+91 7654321098', 'amit@example.com', '789 Adyar, Chennai, Tamil Nadu 600020', 100),
('Sneha Gupta', '+91 6543210987', 'sneha@example.com', '234 Velachery, Chennai, Tamil Nadu 600042', 50),
('Vikram Reddy', '+91 5432109876', 'vikram@example.com', '567 Mylapore, Chennai, Tamil Nadu 600004', 300),
('Kavita Menon', '+91 9876543211', 'kavita@example.com', '890 Besant Nagar, Chennai, Tamil Nadu 600090', 175),
('Rajesh Kumar', '+91 8765432108', 'rajesh@example.com', '321 Nungambakkam, Chennai, Tamil Nadu 600034', 225),
('Ananya Desai', '+91 7654321097', 'ananya@example.com', '654 Guindy, Chennai, Tamil Nadu 600032', 125),
('Karthik Rajan', '+91 6543210986', 'karthik@example.com', '987 Porur, Chennai, Tamil Nadu 600116', 75),
('Meera Krishnan', '+91 5432109875', 'meera@example.com', '159 Kodambakkam, Chennai, Tamil Nadu 600024', 250);

-- Sample Data for Suppliers (All in Chennai)
INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms, lead_time, rating) VALUES
('Fresh Foods Ltd.', 'Rajesh Kumar', '+91 9876543210', 'rajesh@freshfoods.com', '123 SIDCO Industrial Estate, Chennai, Tamil Nadu 600098', 'Net 30', 2, 4),
('Grain Suppliers Inc.', 'Priya Singh', '+91 8765432109', 'priya@grainsuppliers.com', '456 Ambattur Industrial Estate, Chennai, Tamil Nadu 600058', 'Net 15', 3, 5),
('Fresh Farms', 'Amit Patel', '+91 7654321098', 'amit@freshfarms.com', '789 Koyambedu Market, Chennai, Tamil Nadu 600092', 'COD', 1, 3),
('Dairy Fresh', 'Sneha Gupta', '+91 6543210987', 'sneha@dairyfresh.com', '234 Madhavaram, Chennai, Tamil Nadu 600060', 'Net 7', 1, 4),
('Kitchen Essentials', 'Vikram Reddy', '+91 5432109876', 'vikram@kitchenessentials.com', '567 Perambur, Chennai, Tamil Nadu 600011', 'Net 30', 4, 3);

-- 150 Menu Items (Organized by Category)
-- STARTERS (25 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Paneer Tikka', 'Starters', 250.00, 'Grilled cottage cheese marinated in spices', TRUE, 15),
('Chicken Tikka', 'Starters', 290.00, 'Boneless chicken pieces marinated and grilled to perfection', FALSE, 20),
('Samosa', 'Starters', 80.00, 'Crispy pastry filled with spiced potatoes and peas', TRUE, 20),
('Pani Puri', 'Starters', 120.00, 'Hollow crispy balls filled with spiced water and potatoes', TRUE, 10),
('Onion Bhaji', 'Starters', 150.00, 'Crispy onion fritters with Indian spices', TRUE, 15),
('Chicken 65', 'Starters', 280.00, 'Spicy deep-fried chicken with curry leaves', FALSE, 20),
('Veg Spring Rolls', 'Starters', 180.00, 'Crispy rolls filled with vegetables', TRUE, 15),
('Chilli Paneer', 'Starters', 260.00, 'Cottage cheese tossed with bell peppers in spicy sauce', TRUE, 15),
('Gobi Manchurian', 'Starters', 220.00, 'Cauliflower florets in a spicy Indo-Chinese sauce', TRUE, 20),
('Fish Amritsari', 'Starters', 320.00, 'Fish fillets marinated with spices and deep fried', FALSE, 20),
('Dahi Puri', 'Starters', 140.00, 'Crispy puris topped with yogurt, chutneys and sev', TRUE, 10),
('Chicken Lollipop', 'Starters', 290.00, 'Spicy chicken winglets shaped like lollipops', FALSE, 25),
('Hara Bhara Kebab', 'Starters', 200.00, 'Spinach and pea patties with Indian spices', TRUE, 20),
('Papdi Chaat', 'Starters', 160.00, 'Crispy wafers topped with potatoes, yogurt and chutneys', TRUE, 10),
('Prawn Koliwada', 'Starters', 350.00, 'Spicy battered and fried prawns', FALSE, 20),
('Aloo Tikki', 'Starters', 140.00, 'Spiced potato patties served with chutneys', TRUE, 15),
('Mushroom 65', 'Starters', 230.00, 'Spicy fried mushrooms with curry leaves', TRUE, 15),
('Chicken Seekh Kebab', 'Starters', 280.00, 'Minced chicken skewers cooked in tandoor', FALSE, 20),
('Dahi Vada', 'Starters', 150.00, 'Lentil dumplings soaked in yogurt with spices', TRUE, 15),
('Veg Manchurian', 'Starters', 220.00, 'Mixed vegetable balls in a spicy Indo-Chinese sauce', TRUE, 20),
('Tandoori Mushroom', 'Starters', 240.00, 'Mushrooms marinated in spices and cooked in tandoor', TRUE, 15),
('Chicken Pakora', 'Starters', 260.00, 'Chicken fritters with Indian spices', FALSE, 20),
('Bhel Puri', 'Starters', 130.00, 'Puffed rice mixed with vegetables and tangy chutneys', TRUE, 10),
('Mutton Seekh Kebab', 'Starters', 320.00, 'Minced mutton skewers cooked in tandoor', FALSE, 25),
('Corn Tikki', 'Starters', 160.00, 'Sweet corn patties with spices', TRUE, 15);

-- MAIN COURSE (30 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Butter Chicken', 'Main Course', 350.00, 'Tender chicken cooked in a rich buttery tomato sauce', FALSE, 25),
('Palak Paneer', 'Main Course', 280.00, 'Cottage cheese cubes in a creamy spinach gravy', TRUE, 20),
('Chole Bhature', 'Main Course', 220.00, 'Spicy chickpea curry served with fried bread', TRUE, 25),
('Dal Makhani', 'Main Course', 240.00, 'Creamy black lentils slow-cooked with butter and spices', TRUE, 30),
('Chicken Curry', 'Main Course', 320.00, 'Traditional chicken curry with aromatic spices', FALSE, 25),
('Malai Kofta', 'Main Course', 290.00, 'Fried vegetable dumplings in a creamy sauce', TRUE, 25),
('Mutton Rogan Josh', 'Main Course', 380.00, 'Aromatic mutton curry with Kashmiri spices', FALSE, 35),
('Paneer Butter Masala', 'Main Course', 290.00, 'Cottage cheese in a rich tomato and butter gravy', TRUE, 20),
('Fish Curry', 'Main Course', 340.00, 'Fish cooked in a tangy and spicy curry', FALSE, 25),
('Chana Masala', 'Main Course', 220.00, 'Spicy chickpea curry with Indian spices', TRUE, 20),
('Kadai Chicken', 'Main Course', 330.00, 'Chicken cooked with bell peppers in a spicy masala', FALSE, 25),
('Baingan Bharta', 'Main Course', 240.00, 'Smoky mashed eggplant cooked with spices', TRUE, 20),
('Prawn Masala', 'Main Course', 370.00, 'Prawns cooked in a spicy onion-tomato gravy', FALSE, 25),
('Rajma Masala', 'Main Course', 230.00, 'Kidney beans in a thick spiced gravy', TRUE, 25),
('Chicken Korma', 'Main Course', 340.00, 'Chicken in a rich, creamy and mildly spiced gravy', FALSE, 30),
('Aloo Gobi', 'Main Course', 220.00, 'Potatoes and cauliflower cooked with Indian spices', TRUE, 20),
('Mutton Curry', 'Main Course', 370.00, 'Traditional spicy mutton curry', FALSE, 35),
('Kadai Paneer', 'Main Course', 280.00, 'Cottage cheese with bell peppers in a spicy masala', TRUE, 20),
('Chicken Tikka Masala', 'Main Course', 350.00, 'Grilled chicken pieces in a spicy tomato sauce', FALSE, 25),
('Pav Bhaji', 'Main Course', 200.00, 'Mashed vegetables in a spicy gravy served with buttered rolls', TRUE, 20),
('Goan Fish Curry', 'Main Course', 350.00, 'Fish in a tangy coconut-based curry', FALSE, 25),
('Shahi Paneer', 'Main Course', 290.00, 'Cottage cheese in a rich and creamy gravy', TRUE, 20),
('Chicken Chettinad', 'Main Course', 340.00, 'Spicy chicken curry from Tamil Nadu', FALSE, 25),
('Vegetable Kolhapuri', 'Main Course', 250.00, 'Mixed vegetables in a spicy Kolhapuri masala', TRUE, 20),
('Lamb Vindaloo', 'Main Course', 380.00, 'Spicy and tangy lamb curry with potatoes', FALSE, 30),
('Matar Paneer', 'Main Course', 270.00, 'Cottage cheese and peas in a tomato-based gravy', TRUE, 20),
('Chicken Biryani', 'Main Course', 320.00, 'Fragrant rice cooked with chicken and aromatic spices', FALSE, 35),
('Vegetable Jalfrezi', 'Main Course', 240.00, 'Mixed vegetables in a spicy tomato sauce', TRUE, 20),
('Butter Prawns', 'Main Course', 370.00, 'Prawns cooked in a rich buttery tomato sauce', FALSE, 25),
('Paneer Tikka Masala', 'Main Course', 290.00, 'Grilled cottage cheese in a spicy tomato sauce', TRUE, 25);

-- RICE & BIRYANI (20 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Veg Biryani', 'Rice', 280.00, 'Fragrant rice cooked with mixed vegetables and spices', TRUE, 30),
('Chicken Biryani', 'Rice', 320.00, 'Fragrant rice cooked with chicken and aromatic spices', FALSE, 35),
('Jeera Rice', 'Rice', 180.00, 'Basmati rice tempered with cumin seeds', TRUE, 15),
('Mutton Biryani', 'Rice', 360.00, 'Fragrant rice cooked with mutton and aromatic spices', FALSE, 40),
('Veg Pulao', 'Rice', 220.00, 'Rice cooked with mixed vegetables and mild spices', TRUE, 25),
('Prawn Biryani', 'Rice', 350.00, 'Fragrant rice cooked with prawns and aromatic spices', FALSE, 35),
('Steamed Rice', 'Rice', 150.00, 'Plain steamed basmati rice', TRUE, 15),
('Egg Biryani', 'Rice', 280.00, 'Fragrant rice cooked with eggs and aromatic spices', FALSE, 30),
('Kashmiri Pulao', 'Rice', 240.00, 'Sweet rice pulao with dry fruits and saffron', TRUE, 25),
('Fish Biryani', 'Rice', 340.00, 'Fragrant rice cooked with fish and aromatic spices', FALSE, 35),
('Lemon Rice', 'Rice', 190.00, 'Rice tempered with lemon juice, mustard seeds and peanuts', TRUE, 20),
('Hyderabadi Biryani', 'Rice', 340.00, 'Spicy layered rice and meat dish from Hyderabad', FALSE, 40),
('Curd Rice', 'Rice', 180.00, 'Rice mixed with yogurt and tempered with spices', TRUE, 15),
('Keema Biryani', 'Rice', 330.00, 'Fragrant rice cooked with minced meat and spices', FALSE, 35),
('Coconut Rice', 'Rice', 200.00, 'Rice cooked with coconut and tempered with spices', TRUE, 20),
('Lucknowi Biryani', 'Rice', 350.00, 'Mild and aromatic rice and meat dish from Lucknow', FALSE, 40),
('Tomato Rice', 'Rice', 190.00, 'Rice cooked with tomatoes and tempered with spices', TRUE, 20),
('Bombay Biryani', 'Rice', 330.00, 'Spicy rice and meat dish with potatoes', FALSE, 35),
('Ghee Rice', 'Rice', 210.00, 'Basmati rice cooked with ghee and mild spices', TRUE, 20),
('Special Dum Biryani', 'Rice', 370.00, 'Slow-cooked layered rice and meat dish', FALSE, 45);

-- BREADS (15 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Tandoori Roti', 'Breads', 40.00, 'Whole wheat flatbread baked in a tandoor', TRUE, 8),
('Garlic Naan', 'Breads', 60.00, 'Leavened flatbread topped with garlic and butter', TRUE, 10),
('Plain Naan', 'Breads', 50.00, 'Leavened flatbread baked in a tandoor', TRUE, 10),
('Butter Roti', 'Breads', 45.00, 'Whole wheat flatbread with butter', TRUE, 8),
('Cheese Naan', 'Breads', 70.00, 'Leavened flatbread stuffed with cheese', TRUE, 12),
('Laccha Paratha', 'Breads', 60.00, 'Layered whole wheat flatbread', TRUE, 10),
('Kulcha', 'Breads', 55.00, 'Leavened flatbread with a crispy exterior', TRUE, 10),
('Missi Roti', 'Breads', 50.00, 'Flatbread made with gram flour and spices', TRUE, 10),
('Butter Naan', 'Breads', 55.00, 'Leavened flatbread with butter', TRUE, 10),
('Aloo Paratha', 'Breads', 70.00, 'Whole wheat flatbread stuffed with spiced potatoes', TRUE, 15),
('Pudina Paratha', 'Breads', 60.00, 'Whole wheat flatbread with mint', TRUE, 10),
('Paneer Kulcha', 'Breads', 75.00, 'Leavened flatbread stuffed with spiced cottage cheese', TRUE, 15),
('Roomali Roti', 'Breads', 50.00, 'Thin handkerchief-like flatbread', TRUE, 10),
('Keema Naan', 'Breads', 80.00, 'Leavened flatbread stuffed with spiced minced meat', FALSE, 15),
('Bhatura', 'Breads', 60.00, 'Deep-fried leavened bread', TRUE, 15);

-- BREAKFAST (15 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Masala Dosa', 'Breakfast', 180.00, 'Crispy rice crepe filled with spiced potato filling', TRUE, 15),
('Idli Sambar', 'Breakfast', 160.00, 'Steamed rice cakes served with lentil soup and chutney', TRUE, 20),
('Aloo Paratha', 'Breakfast', 120.00, 'Whole wheat flatbread stuffed with spiced potatoes', TRUE, 15),
('Poha', 'Breakfast', 100.00, 'Flattened rice cooked with spices and vegetables', TRUE, 15),
('Upma', 'Breakfast', 110.00, 'Savory semolina porridge with vegetables', TRUE, 15),
('Medu Vada', 'Breakfast', 120.00, 'Savory lentil doughnuts served with sambar and chutney', TRUE, 20),
('Puri Bhaji', 'Breakfast', 140.00, 'Deep-fried bread served with potato curry', TRUE, 20),
('Rava Dosa', 'Breakfast', 170.00, 'Crispy semolina crepe served with chutney', TRUE, 15),
('Chole Bhature', 'Breakfast', 180.00, 'Spicy chickpea curry served with fried bread', TRUE, 25),
('Uttapam', 'Breakfast', 160.00, 'Thick rice pancake topped with vegetables', TRUE, 20),
('Bread Omelette', 'Breakfast', 120.00, 'Bread slices with spiced egg omelette', FALSE, 10),
('Paneer Paratha', 'Breakfast', 140.00, 'Whole wheat flatbread stuffed with spiced cottage cheese', TRUE, 15),
('Appam with Stew', 'Breakfast', 190.00, 'Fermented rice pancake with coconut stew', TRUE, 25),
('Egg Bhurji', 'Breakfast', 130.00, 'Spiced scrambled eggs', FALSE, 10),
('Misal Pav', 'Breakfast', 150.00, 'Spicy sprouted lentil curry with bread rolls', TRUE, 20);

-- DESSERTS (15 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Gulab Jamun', 'Desserts', 120.00, 'Sweet milk solids balls soaked in sugar syrup', TRUE, 10),
('Rasmalai', 'Desserts', 150.00, 'Soft cottage cheese dumplings soaked in sweetened milk', TRUE, 15),
('Gajar Ka Halwa', 'Desserts', 140.00, 'Sweet carrot pudding with nuts', TRUE, 30),
('Jalebi', 'Desserts', 100.00, 'Crispy deep-fried sweets soaked in sugar syrup', TRUE, 20),
('Kulfi', 'Desserts', 130.00, 'Traditional Indian ice cream', TRUE, 15),
('Rasgulla', 'Desserts', 130.00,   'Desserts', 130.00, 'Traditional Indian ice cream', TRUE, 15),
('Rasgulla', 'Desserts', 130.00, 'Soft cheese balls soaked in sugar syrup', TRUE, 15),
('Kheer', 'Desserts', 140.00, 'Rice pudding with nuts and cardamom', TRUE, 25),
('Mysore Pak', 'Desserts', 150.00, 'Sweet made from gram flour, ghee and sugar', TRUE, 20),
('Shrikhand', 'Desserts', 140.00, 'Sweetened strained yogurt with saffron and cardamom', TRUE, 15),
('Phirni', 'Desserts', 150.00, 'Ground rice pudding with nuts and cardamom', TRUE, 20),
('Malpua', 'Desserts', 130.00, 'Sweet pancakes soaked in sugar syrup', TRUE, 20),
('Sandesh', 'Desserts', 160.00, 'Bengali sweet made from cottage cheese', TRUE, 20),
('Payasam', 'Desserts', 140.00, 'South Indian sweet pudding', TRUE, 25),
('Rabri', 'Desserts', 150.00, 'Sweet condensed milk dessert with nuts', TRUE, 30),
('Ladoo', 'Desserts', 120.00, 'Sweet ball-shaped dessert made from various ingredients', TRUE, 20),
('Imarti', 'Desserts', 130.00, 'Pretzel-shaped sweet soaked in sugar syrup', TRUE, 25);

-- BEVERAGES (15 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Mango Lassi', 'Beverages', 120.00, 'Refreshing yogurt drink blended with mango pulp', TRUE, 5),
('Masala Chai', 'Beverages', 60.00, 'Spiced Indian tea with milk', TRUE, 8),
('Sweet Lassi', 'Beverages', 100.00, 'Sweetened yogurt drink', TRUE, 5),
('Fresh Lime Soda', 'Beverages', 80.00, 'Refreshing lime and soda drink', TRUE, 5),
('Buttermilk', 'Beverages', 70.00, 'Spiced yogurt-based drink', TRUE, 5),
('Cold Coffee', 'Beverages', 130.00, 'Chilled coffee with ice cream', TRUE, 10),
('Watermelon Juice', 'Beverages', 110.00, 'Fresh watermelon juice', TRUE, 8),
('Pineapple Juice', 'Beverages', 110.00, 'Fresh pineapple juice', TRUE, 8),
('Strawberry Milkshake', 'Beverages', 140.00, 'Creamy strawberry flavored milkshake', TRUE, 10),
('Mint Mojito', 'Beverages', 120.00, 'Refreshing mint and lime drink', TRUE, 8),
('Rose Milk', 'Beverages', 100.00, 'Chilled milk flavored with rose syrup', TRUE, 5),
('Badam Milk', 'Beverages', 120.00, 'Almond flavored milk', TRUE, 10),
('Coconut Water', 'Beverages', 90.00, 'Fresh coconut water', TRUE, 3),
('Mango Milkshake', 'Beverages', 140.00, 'Creamy mango flavored milkshake', TRUE, 10),
('Ginger Lemon Tea', 'Beverages', 70.00, 'Tea infused with ginger and lemon', TRUE, 8);

-- CHINESE (15 items)
INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES
('Veg Hakka Noodles', 'Chinese', 220.00, 'Stir-fried noodles with vegetables', TRUE, 15),
('Chicken Fried Rice', 'Chinese', 250.00, 'Stir-fried rice with chicken and vegetables', FALSE, 15),
('Veg Manchurian', 'Chinese', 230.00, 'Vegetable balls in a spicy sauce', TRUE, 20),
('Chilli Chicken', 'Chinese', 280.00, 'Spicy chicken with bell peppers and onions', FALSE, 20),
('Veg Spring Rolls', 'Chinese', 180.00, 'Crispy rolls filled with vegetables', TRUE, 15),
('Sweet and Sour Prawns', 'Chinese', 320.00, 'Prawns in a sweet and sour sauce', FALSE, 20),
('Veg Fried Rice', 'Chinese', 220.00, 'Stir-fried rice with vegetables', TRUE, 15),
('Kung Pao Chicken', 'Chinese', 290.00, 'Spicy chicken with peanuts and vegetables', FALSE, 20),
('Schezwan Noodles', 'Chinese', 240.00, 'Spicy noodles with vegetables', TRUE, 15),
('Honey Chilli Potato', 'Chinese', 200.00, 'Crispy potatoes in a sweet and spicy sauce', TRUE, 15),
('Egg Fried Rice', 'Chinese', 230.00, 'Stir-fried rice with eggs and vegetables', FALSE, 15),
('Chilli Paneer', 'Chinese', 260.00, 'Cottage cheese with bell peppers in a spicy sauce', TRUE, 15),
('Chicken Manchurian', 'Chinese', 280.00, 'Chicken balls in a spicy sauce', FALSE, 20),
('Veg Dumplings', 'Chinese', 200.00, 'Steamed dumplings filled with vegetables', TRUE, 20),
('Singapore Noodles', 'Chinese', 250.00, 'Stir-fried rice noodles with curry flavor', TRUE, 15);

-- Update the app/page.tsx to include a login button
