# 🚀 Deployment Guide — Queen's Cloud Kitchen

Follow these steps to deploy and configure the system in a production or staging environment.

---

## 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and sign up for a free account.
2. Click **New Project** and select a database location closest to your kitchen location.
3. Choose a strong database password and copy your project URL and `anon` key.

---

## 2. Database Schema Execution

1. In the Supabase Dashboard, click on **SQL Editor** from the left-hand navigation.
2. Click **New Query**.
3. Open the [database/schema.sql](file:///Users/pavulurusudharshanchowdary/Downloads/cloud-kitchen-management-system-main/cloud-kitchen-management-system/database/schema.sql) file, copy the full contents, and paste it into the query editor.
4. Click **Run**. All tables, constraints, indexes, and RLS policies will be created.

---

## 3. Hydrate Seed Data

1. Click **New Query** again inside the SQL Editor.
2. Open the [database/seed.sql](file:///Users/pavulurusudharshanchowdary/Downloads/cloud-kitchen-management-system-main/cloud-kitchen-management-system/database/seed.sql) file, copy the full contents, and paste it into the editor.
3. Click **Run**. This will populate your catalog with recipes, raw suppliers, inventory levels, and initial mock expenses.

---

## 4. Local Environment Variables

Create a file named `.env.local` in the project root directory and add the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The application will dynamically connect and query data from your live database. If these values are not provided, the application will automatically fall back to the local flat-file storage engine (`database/db.json`) for seamless local testing.

---

## 5. Build and Test Locally

To compile and verify the build for deployment, execute:

```bash
npm run build
```

To run the Next.js dev server, execute:

```bash
npm run dev
```

Your system is now ready for production!
