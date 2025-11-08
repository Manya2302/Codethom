# TerriSmart - Smart Territory Management Platform

## Overview
TerriSmart is a modern, production-ready territory management platform for real estate professionals. It features a React frontend with Vite, Express backend, and MongoDB database. The application includes authentication, territory mapping, team assignment, performance analytics, and dashboards for different user roles (Admin, User, Partner).

**Current State**: Successfully running in Replit environment with MongoDB database connected and frontend properly configured.

## Recent Changes
- **2025-11-08**: Implemented Admin Verification Workflow for Vendor/Broker Signups
  - **MAJOR CHANGE**: Modified signup flow - all vendor/broker signups now go through admin verification
  - Removed Surepass API dependency for automatic RERA verification
  - Now validates RERA ID format only (Gujarat + other Indian states supported)
  - Vendor/broker signups create verification records instead of user accounts
  - Success message: "Your account is under verification. We will send the result within 24 hours."
  - Admin dashboard Verifications page shows all pending verifications
  - Admins can approve (creates account + sends approval email) or reject (sends rejection email with reason)
  - Professional email templates for approval and rejection notifications
  - Passwords are securely hashed before storing in verification records
  - Fixed textarea.jsx TypeScript syntax issue (removed types from .jsx file)
  
- **2025-11-08**: Enhanced RERA verification with multi-format support
  - Expanded RERA ID validation to support all major Indian state formats
  - Now accepts: PR/GJ/AHMEDABAD/RAA07880/070121 (Gujarat), MH12345678901234 (Maharashtra), KA/RERA/123/2020 (Karnataka), TN-RERA-12345-2020 (Tamil Nadu)
  - Fixed debounce cleanup bug using useRef to prevent stale timers
  
- **2025-11-08**: Role-based registration and RERA verification system
  - **Major Feature**: Implemented 4-role user system (Customer, Investor, Vendor, Broker)
  - Updated User schema with new fields: role, reraId, isReraVerified, isEmailVerified
  - Created RERA verification API endpoint for government compliance
  - Built email service for RERA confirmation notifications
  - Developed dynamic SignUpForm with role dropdown and conditional RERA field
  - Created 4 role-specific dashboard pages with tailored features
  - Implemented role-based redirect logic in authentication flow
  - **Verification Flows**:
    - Customer/Investor: Email OTP verification
    - Vendor/Broker: RERA ID verification + email confirmation
  - Fixed critical useEffect bug in SignUpForm for proper field display
  - All routes registered and working in App.jsx

- **2025-11-08**: Initial setup and branding enhancements
  - Installed MongoDB system dependency
  - Connected to MongoDB Atlas cloud database (Codethon cluster)
  - Enhanced TerriSmart branding across all pages
  - Verified Vite configuration for Replit proxy (host: 0.0.0.0, allowedHosts: true)
  - Set up deployment configuration for production
  - Application running successfully on port 5000

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 4
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Passport.js with local strategy
- **Payment**: PayPal SDK integration
- **Session Management**: express-session

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Theme, User)
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── index.js         # Server entry point
│   ├── routes.js        # API routes
│   ├── auth-routes.js   # Authentication routes
│   ├── db.js            # MongoDB connection
│   ├── email-service.js # Email functionality
│   └── storage.js       # File storage
├── shared/              # Shared code
│   └── schema.js        # Mongoose models (User, OTP, Document, Transaction, Notification)
└── attached_assets/     # Generated images and stock photos
```

### Database Schema (MongoDB/Mongoose)
- **User**: name, email, password, **role (customer/investor/vendor/broker/admin/user/partner)**, status, verified flag, **isEmailVerified, isReraVerified, reraId**, avatar, phone, company
- **OTP**: email, code, type (signup/password-reset), expiration, attempts tracking
- **Document**: userId, name, type, size, status (pending/verified/rejected), url
- **Transaction**: userId, amount, status, method (PayPal/Credit Card/Razorpay), description
- **Notification**: userId, title, message, type (info/success/warning/error), read flag

### Features by Role

**All Users**:
- Authentication (Sign up, Sign in, OTP verification, Password reset)
- Profile management
- Theme toggle (dark/light mode)
- Notifications panel

**Customer Dashboard** (`/dashboard/customer`):
- Property search and listings
- Saved favorites and watchlist
- Document management
- Payment and transaction history
- Profile customization

**Investor Dashboard** (`/dashboard/investor`):
- Investment portfolio tracking
- ROI analytics and performance metrics
- Property opportunities
- Document and contract management
- Transaction history

**Vendor Dashboard** (`/dashboard/vendor`):
- Service listings management
- Client requests and quotes
- RERA verification badge display
- Document uploads and verification
- Transaction and payment tracking

**Broker Dashboard** (`/dashboard/broker`):
- Property listings management
- Client relationship management
- RERA verification badge display
- Commission and revenue analytics
- Document management

**User Dashboard** (Legacy):
- Document upload and verification tracking
- Payment checkout (PayPal integration)
- Transaction history
- Profile customization

**Partner Dashboard** (Legacy):
- Similar to User Dashboard with partner-specific features

**Admin Dashboard**:
- User management (add, edit, view, delete users)
- Analytics charts (user growth, activity, roles distribution, revenue)
- Add admin functionality
- System-wide notifications

## Environment Variables

### Required
- `SESSION_SECRET`: Session encryption key (auto-generated in Replit)
- `MONGODB_URI`: MongoDB Atlas connection string (configured in Replit Secrets)

### Optional
- `PORT`: Server port (defaults to 5000)
- `NODE_ENV`: Environment mode (development/production)

## Development Setup

### Running the Application
The application is configured to run via the `Start application` workflow which:
1. Connects to MongoDB Atlas cloud database
2. Starts the Node.js development server on port 5000
3. Serves the React frontend via Vite

**Commands**:
- Development: `npm run dev`
- Build: `npm run build`
- Production: `npm start`

### Vite Configuration
The Vite dev server is properly configured for Replit:
- Host: `0.0.0.0` (binds to all interfaces)
- `allowedHosts: true` (accepts proxy requests)
- HMR client port: 443 (for Replit's proxy)

## Deployment
Configured for **VM deployment** (stateful, always-on):
- Build command: `npm run build`
- Run command: Starts MongoDB then runs production server
- Port: 5000
- Suitable for applications with persistent database connections

## User Preferences
None documented yet.

## Design System
See `design_guidelines.md` for comprehensive design specifications including:
- Typography system (Inter + JetBrains Mono)
- Color palette and theming
- Component patterns
- Responsive breakpoints
- Layout grid system
- User interface patterns for all dashboard types

## Notes
- MongoDB Atlas cloud database is used for all environments
- Database connection is managed via MONGODB_URI environment variable in Replit Secrets
- Session data is stored in memory (not persisted across restarts in development)
- The application uses express-session with MemoryStore (consider upgrading to PostgreSQL session store for production)
- File uploads use local storage (consider cloud storage for production)
- Custom territory-themed images are stored in `attached_assets/generated_images/`
