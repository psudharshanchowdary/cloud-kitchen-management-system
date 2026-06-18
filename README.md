# Queen's Cloud Kitchen OS & Operations Platform

An enterprise-grade, real-time Cloud Kitchen Operations & Management Platform designed to streamline order fulfillment, kitchen workflow efficiency, supplier logistics, and delivery dispatch. Built using **Next.js**, **TailwindCSS**, **Framer Motion**, and **TypeScript**.

---

## 🚀 Key Features

### 1. Strict Role-Based Access Control (RBAC)
The system implements path-level route guards and renders specialized interfaces based on 8 user roles:
*   👑 **Owner**: Access to executive summary metrics, revenue & profit trends charts, salary expense summaries (excl. owners), and system settings.
*   👔 **Operations Manager**: Full logistics schedules, queue monitoring, and dispatch runs performance logs.
*   👨‍🍳 **Head Chef**: Controls kitchen station configurations, item availability toggles, prep times, and recipes.
*   🍳 **Chef / Kitchen Assistant**: Tailored cooking checklists, recipe ingredient ratios, and prep-time updates.
*   📦 **Packing Staff**: Box packing check-offs and courier dispatch handoffs.
*   🌾 **Inventory Manager**: Logs stock adjust entries, creates supplier profiles, and raises purchase orders.
*   🚚 **Delivery Driver**: Personal run checklists, navigation addresses, and travel duration logs.

### 2. Live Supplier Logistics Tracking
Enables transparent supply chain tracking for incoming raw materials:
*   **Inventory Managers** have action controls to **Accept** incoming shipments (recording batch numbers, expiry dates, quantities received, and item condition into the stock logs), **Reject** deliveries (recording reasons), or **Report issues** (missing or damaged items).
*   **Owners** and **Operations Managers** have view-only access to ETAs, dispatch logs, invoices, and supplier details.

### 3. Integrated Delivery Courier Management
Tracks courier dispatches from the packing station:
*   Saves courier details: Driver Name, Employee ID, Phone, Vehicle number/type.
*   Records pickup, dispatch start, and delivery completion timestamps.
*   Calculates and visualizes trip durations on the Executive Dashboard.

### 4. Dynamic Light / Dark Theme Engine
*   Fully WCAG AA contrast audited layout conforming automatically to OS display configuration or client theme toggles.
*   Utilizes CSS variables (`globals.css`) mapped to Tailwind semantic design tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.) instead of hardcoded colors.

### 5. Responsive, Scrollable Modal Architecture
*   Bounded to `max-h-[90vh]` using Flexbox layout structure to ensure forms never overflow the viewport on mobile, tablet, or desktop devices.
*   **Sticky Header**: Keeps title and exit controls pinned at the top.
*   **Scrollable Body (`flex-1 overflow-y-auto`)**: Supports infinite form fields (e.g. recipe ingredients) without layout breakages.
*   **Sticky Footer**: Keeps Save and Cancel action buttons fixed at the bottom for comfortable reachability.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
*   **Form Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/psudharshanchowdary/cloud-kitchen-management-system.git
   cd cloud-kitchen-management-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### Production Build
Build the optimized Next.js bundle:
```bash
npm run build
```
Start the production server:
```bash
npm start
```
