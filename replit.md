# TerriSmart - Real Estate Platform

## Overview
TerriSmart is a comprehensive full-stack real estate platform built with React, Express, MongoDB, and modern web technologies. The platform supports multiple user roles including customers, investors, vendors, and brokers with features like authentication, RERA verification, property management, and more.

**Current State**: Imported from GitHub and configured to run in Replit environment

**Last Updated**: November 08, 2025

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Express.js + Node.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Passport.js (Local + Google OAuth)
- **UI Components**: Radix UI, Lucide React
- **Maps**: Google Maps API
- **Email**: Nodemailer (SMTP)
- **Payment**: PayPal SDK

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components (dashboards, auth, etc.)
│   │   └── App.jsx      # Main app component
│   └── index.html
├── server/              # Express backend
│   ├── auth-routes.js   # Authentication endpoints
│   ├── routes.js        # API routes
│   ├── db.js           # MongoDB connection
│   ├── email-service.js # Email functionality
│   ├── storage.js      # Data models and storage
│   └── index.js        # Server entry point
├── shared/              # Shared schemas and types
└── scripts/            # Utility scripts

```

### Key Features
- **Multi-role Authentication**: Customer, Investor, Vendor, Broker, Admin roles
- **RERA Verification**: Automated verification system for brokers and vendors
- **Email Notifications**: OTP verification, welcome emails, status updates
- **Property Management**: List, search, and manage real estate properties
- **Google Maps Integration**: Location-based features and geocoding
- **Dashboard Analytics**: Role-specific dashboards with analytics
- **Payment Integration**: PayPal payment processing

## Environment Variables

### Required for Basic Operation
- `MONGODB_URI` - MongoDB connection string (required for database functionality)
- `SESSION_SECRET` - Secret key for session management (defaults to development value)
- `PORT` - Server port (defaults to 5000)
- `NODE_ENV` - Environment mode (development/production)

### Optional Features
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (for Google sign-in)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `APP_URL` - Application base URL (defaults to http://localhost:5000)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key (for location features)
- `SUREPASS_API_KEY` - Surepass API for RERA verification
- `SMTP_HOST` - SMTP server host (for email notifications)
- `SMTP_PORT` - SMTP server port (defaults to 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM_EMAIL` - From email address
- `SUPPORT_EMAIL` - Support contact email

## Development

### Running the Application
The application runs on port 5000 with the command:
```bash
npm run dev
```

This starts an Express server that:
- Serves the React frontend via Vite in development mode
- Provides API endpoints at `/api/*`
- Handles authentication and session management
- Connects to MongoDB (if configured)

### Build Process
```bash
npm run build   # Builds both frontend and backend for production
npm start       # Runs production build
```

## User Preferences
None specified yet.

## Recent Changes
- **2025-11-08**: Initial import from GitHub
- **2025-11-08**: Configured for Replit environment
- **2025-11-08**: Dependencies installed
- **2025-11-08**: Vite config already set with `allowedHosts: true` for Replit proxy support

## Notes
- The app gracefully handles missing MongoDB connection and will run with limited functionality
- RERA verification requires manual admin approval for vendors and brokers
- Email features require SMTP configuration
- Google OAuth and Maps features require respective API keys
