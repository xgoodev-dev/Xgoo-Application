# XGoo - Courier Office Management SaaS

## Overview
XGoo is a mobile-first courier office management SaaS designed for small and mid-size courier offices in India. It replaces manual notebook/Excel/WhatsApp workflows with a fast, POS-style digital platform for managing bookings, billing, customer data, courier partners, and comprehensive reports.

**Target**: Booking entry under 60 seconds, 90% digital bookings, clear end-of-day revenue visibility.

## Recent Changes
- **2026-02-05**: Complete MVP implementation with all features
  - Database schema with offices, customers, shipments, courier partners, payments, invoices
  - Replit Auth integration for secure authentication
  - Full frontend with mobile-first POS-style UI
  - Backend API with Zod validation and tenant scoping
  - Seed data for demo experience

## Project Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)

### Directory Structure
```
├── client/src/
│   ├── components/       # UI components (app-sidebar, ThemeProvider, etc.)
│   ├── hooks/            # Custom React hooks (use-auth, use-toast)
│   ├── lib/              # Utilities (queryClient, auth-utils)
│   ├── pages/            # Page components
│   │   ├── landing.tsx   # Marketing landing page
│   │   ├── dashboard.tsx # Main dashboard with KPIs
│   │   ├── bookings/new.tsx # New booking form
│   │   ├── shipments.tsx # Shipment list and management
│   │   ├── customers.tsx # Customer CRUD
│   │   ├── partners.tsx  # Courier partner CRUD
│   │   ├── reports.tsx   # Analytics and exports
│   │   └── settings.tsx  # Office settings
│   └── App.tsx           # Main app with routing
├── server/
│   ├── routes.ts         # API endpoints with validation
│   ├── storage.ts        # Database operations
│   └── replit_integrations/ # Auth and object storage
├── shared/
│   ├── schema.ts         # Drizzle schema definitions
│   └── models/auth.ts    # Auth-related models
└── db/                   # Database migrations
```

### Data Models
- **Offices**: One per authenticated user, contains all business data
- **Customers**: Walk-in or business customers with credit limits
- **Courier Partners**: DTDC, FedEx, Blue Dart, etc. with rate cards
- **Shipments**: Bookings with sender/receiver details, tracking, billing
- **Payments**: Cash, UPI, bank transfer, or credit
- **Invoices**: Generated per shipment

### Key Features
1. **Fast Booking Entry**: POS-style interface for quick shipment creation
2. **Auto Price Calculation**: Based on partner rate cards (Air/Surface)
3. **Customer Management**: Walk-in and business customers with credit
4. **Multi-Partner Support**: Configure multiple courier partners
5. **Status Tracking**: Booked → Picked Up → In Transit → Delivered
6. **Reports & Analytics**: Date-wise, customer-wise, partner-wise reports
7. **CSV Export**: Download reports for Excel analysis

## Running the Project
The project uses a single workflow that starts both the Express backend and Vite frontend:
```bash
npm run dev
```

The app runs on port 5000 with:
- Frontend served by Vite (with HMR)
- Backend API at `/api/*`
- Authentication at `/api/login` and `/api/logout`

## API Endpoints
All endpoints require authentication (except auth routes):

- `GET /api/office` - Get current user's office
- `POST /api/office` - Create office (first login)
- `PATCH /api/office/:id` - Update office settings

- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

- `GET /api/partners` - List courier partners
- `POST /api/partners` - Create partner
- `PATCH /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

- `GET /api/shipments` - List shipments
- `POST /api/shipments` - Create shipment (booking)
- `PATCH /api/shipments/:id/status` - Update shipment status

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports` - Report data (requires from/to params)
- `GET /api/reports/export` - CSV export

## User Preferences
- Mobile-first design approach
- Professional POS-style interface
- Inter font for clean typography
- Blue (#0079F2) as primary color
- Support for light/dark mode

## Security
- All routes protected by Replit Auth middleware
- Tenant scoping: Users can only access their own office's data
- Zod validation on all POST/PATCH requests
- No raw SQL - all queries through Drizzle ORM
