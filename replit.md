# XGoo - Courier Office Management SaaS

## Overview
XGoo is a mobile-first courier office management SaaS designed for small and mid-size courier offices in India. It replaces manual notebook/Excel/WhatsApp workflows with a fast, POS-style digital platform for managing bookings, billing, customer data, courier partners, and comprehensive reports.

**Target**: Booking entry under 60 seconds, 90% digital bookings, clear end-of-day revenue visibility.

## Recent Changes
- **2026-02-05**: Added quotations, public booking portal, invoices, and parcel labels
  - Quotations system for creating and sharing price quotes with customers
  - Public booking portal at /book/:slug for customer self-service
  - Booking requests review page for approving/rejecting customer submissions
  - Invoice generation with print and share (WhatsApp, Email)
  - Parcel label component with QR code for printing on packages
  - Database updates: quotations and booking_requests tables, publicSlug on offices
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
│   ├── components/       # UI components (app-sidebar, ThemeProvider, ParcelLabel)
│   ├── hooks/            # Custom React hooks (use-auth, use-toast)
│   ├── lib/              # Utilities (queryClient, auth-utils)
│   ├── pages/            # Page components
│   │   ├── landing.tsx   # Marketing landing page
│   │   ├── dashboard.tsx # Main dashboard with KPIs
│   │   ├── bookings/new.tsx # New booking form
│   │   ├── shipments.tsx # Shipment list and management
│   │   ├── shipments/label.tsx # Parcel label with QR code
│   │   ├── shipments/invoice.tsx # Invoice view with sharing
│   │   ├── quotations.tsx # Quotation management
│   │   ├── booking-requests.tsx # Review customer booking requests
│   │   ├── public-booking.tsx # Public booking portal (no auth)
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
- **Offices**: One per authenticated user, contains all business data (publicSlug for sharing)
- **Customers**: Walk-in or business customers with credit limits
- **Courier Partners**: DTDC, FedEx, Blue Dart, etc. with rate cards
- **Shipments**: Bookings with sender/receiver details, tracking, billing
- **Payments**: Cash, UPI, bank transfer, or credit
- **Invoices**: Generated per shipment
- **Quotations**: Price quotes with status (draft/sent/accepted/rejected/expired)
- **Booking Requests**: Customer-submitted requests from public portal

### Key Features
1. **Fast Booking Entry**: POS-style interface for quick shipment creation
2. **Auto Price Calculation**: Based on partner rate cards (Air/Surface)
3. **Customer Management**: Walk-in and business customers with credit
4. **Multi-Partner Support**: Configure multiple courier partners
5. **Status Tracking**: Booked → Picked Up → In Transit → Delivered
6. **Reports & Analytics**: Date-wise, customer-wise, partner-wise reports
7. **CSV Export**: Download reports for Excel analysis
8. **Quotations**: Create and share price quotes via WhatsApp/Email/Print
9. **Public Booking Portal**: Shareable link (/book/:slug) for customer self-service
10. **Invoice Generation**: Professional invoices with print and share options
11. **Parcel Labels**: QR code labels for packages (4x6 thermal printer format)

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
All endpoints require authentication (except auth and public routes):

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
- `GET /api/shipments/:id/label` - Get label data for printing
- `GET /api/shipments/:id/invoice` - Get/create invoice for shipment

- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `PATCH /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation

- `GET /api/booking-requests` - List booking requests
- `GET /api/booking-requests/:id` - Get single booking request
- `PATCH /api/booking-requests/:id/status` - Update request status

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports` - Report data (requires from/to params)
- `GET /api/reports/export` - CSV export

### Public Endpoints (no auth required)
- `GET /api/public/office/:slug` - Get public office info
- `GET /api/public/office/:slug/partners` - Get active partners
- `POST /api/public/office/:slug/booking-request` - Submit booking request

## User Preferences
- Mobile-first design approach
- Professional POS-style interface
- Inter font for clean typography
- XGoo brand colors:
  - Primary Orange: #FF4907 (vibrant orange for buttons/actions)
  - Dark Brown: #391305 (dark mode background)
  - Medium Brown: #9B320B (accent color)
- Support for light/dark mode matching brand identity

## Security
- All routes protected by Replit Auth middleware
- Tenant scoping: Users can only access their own office's data
- Zod validation on all POST/PATCH requests
- No raw SQL - all queries through Drizzle ORM
