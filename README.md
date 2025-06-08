# Cloud Kitchen Management System

A web-based application to streamline cloud kitchen operations, including order management, kitchen workflows, and inventory tracking. Built with a focus on efficient order processing, real-time kitchen updates, and inventory monitoring.

## Features

- **Login Page**: Secure access for kitchen staff with credentials (e.g., username: owner, password: cloudkitchen123).
- **Home Page**: Overview of key operations like menu management, order processing, kitchen workflows, and inventory tracking.
- **Order Management**: Track orders with statuses (Pending, Preparing, Ready, Delivered, Cancelled) and manage them in real-time.
- **Kitchen Dashboard**: Monitor kitchen orders with details like order items, cooking times, and priority levels.
- **Dashboard**: Visualize key metrics such as total revenue (₹2,485,000), total orders (7), and monthly sales trends.
- **Inventory Management**: Track inventory items, stock levels, and supplier details, with alerts for low stock.

## Technologies Used

### Languages
- **TypeScript (TS)**: For frontend development (e.g., `page.tsx` files in `dashboard`, `kitchen`, `menu`, `orders`).
- **JavaScript (JS)**: For routing and utilities (e.g., `route.js`, `db.js`, `utils.ts`).
- **SQL**: For database schema and queries (e.g., `schema.sql`).

### Frameworks & Libraries
- **Next.js**: For building the frontend (`next.config.mjs`, `package.json`).
- **React**: For UI components (inferred from Next.js usage).
- **Tailwind CSS**: For styling (`tailwind.config.ts`).
- **Java (Spring Boot)**: For backend API (e.g., `GlobalExceptionHandler.java` in `src/main/java/com/cloudkitchen`).

### Database
- **MySQL**: For storing data like orders, inventory, and menu items (`schema.sql`).

### Tools
- **Git**: For version control.
- **npm**: For package management (`npm-lock.yaml`).
- **UI Libraries**: Custom components and hooks (`use-mobile.tsx`, `use-toast.ts`).

## Screenshots

### Login Page
![Login Page]
![image](https://github.com/user-attachments/assets/2812bf8d-10fe-4fca-9701-6af5bde53d47)
### Home Page
![Home Page]
![image](https://github.com/user-attachments/assets/d0f258bd-4d0c-46e6-ab5b-06f2539fae57)

### Order Management
![Order Management]
![image](https://github.com/user-attachments/assets/e2f7cb45-cca5-48b4-aab3-390f583a2e47)

### Kitchen Dashboard
![Kitchen Dashboard]
![image](https://github.com/user-attachments/assets/c2ed5dbd-f167-4f27-94bf-043959e5bffc)

### menu management
![food menu]
![image](https://github.com/user-attachments/assets/06e9f605-d9a0-4ed7-89a0-c90f5f672af7)

### Dashboard
![Dashboard]
![image](https://github.com/user-attachments/assets/90691b5c-6c59-4255-8807-2bc98d902af7)

### Inventory Management
![Inventory Management]
![image](https://github.com/user-attachments/assets/6cc2280e-6f01-433e-91d8-adc50f68dd63)
## Setup Instructions

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/https://github.com/psudharshanchowdary/cloud-kitchen-management-system.git
   cd cloud-kitchen-management-system

2. **Install Dependencies**:
```bash
npm install

3. **Set Up the Database**:
Install MySQL and create a database named cloud_kitchen.
Run the SQL schema:
```bash
mysql -u your-username -p cloud_kitchen < database/schema.sql
Update database credentials in your backend configuration (e.g., application.properties for Spring Boot).

4. **Run the Backend**:
Navigate to the src/main/java/com/cloudkitchen directory.
Run the Spring Boot application:
./mvnw spring-boot:run

5.**Run the Frontend**:
In the project root, start the Next.js development server:
npm run dev
Open http://localhost:3000 to view in vs code

