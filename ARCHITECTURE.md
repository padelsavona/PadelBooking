# Padel Booking - Architecture & Design Decisions

## Overview

This is a full-stack web application for booking padel courts, similar to Playtomic. The application supports online payments via Stripe and includes two user roles: players who must pay for bookings, and administrators who can block time slots without payment.

## Architecture Decisions

### Monolithic Modular Design

We chose a **monolithic modular architecture** with clear separation between backend and frontend:
- **Backend**: Single Node.js application with organized modules (services, routes, middleware)
- **Frontend**: React SPA with component-based architecture
- **Rationale**: Simplifies deployment on Render, easier to maintain for initial launch, can be split into microservices later if needed

### Technology Stack

#### Backend
- **Fastify**: Chosen over Express for better performance and TypeScript support
- **Prisma**: Modern ORM with excellent TypeScript integration and type safety
- **PostgreSQL**: Reliable, ACID-compliant database suitable for booking systems
- **Zod**: Schema validation providing runtime type safety
- **JWT**: Stateless authentication suitable for scalable web apps

#### Frontend
- **React 18**: Industry-standard UI library with strong ecosystem
- **Vite**: Fast build tool with excellent DX
- **TailwindCSS**: Utility-first CSS framework for rapid development
- **React Query**: Server state management with automatic caching and refetching
- **Zustand**: Lightweight client state management for auth state

### Database Schema

```
Users (authentication & authorization)
├── id (UUID)
├── email (unique)
├── password (bcrypt hashed)
├── name
└── role (PLAYER | ADMIN)

Courts (padel court information)
├── id (UUID)
├── name
├── description
├── pricePerHour (Decimal)
└── isActive

Bookings (reservation records)
├── id (UUID)
├── courtId (FK → Courts)
├── userId (FK → Users)
├── startTime (DateTime)
├── endTime (DateTime)
├── status (PENDING | CONFIRMED | CANCELLED | BLOCKED)
├── totalPrice (Decimal)
└── notes

Payments (Stripe payment tracking)
├── id (UUID)
├── bookingId (FK → Bookings, unique)
├── userId (FK → Users)
├── amount (Decimal)
├── stripePaymentId (unique)
├── stripeSessionId (unique)
└── status (pending | completed | failed | refunded)
```

### Security Measures

1. **Authentication & Authorization**
   - JWT tokens with configurable expiry
   - Role-based access control (RBAC)
   - Password hashing with bcrypt (10 rounds)

2. **Input Validation**
   - Zod schemas for all API endpoints
   - Type-safe validation at runtime
   - SQL injection prevention via Prisma

3. **Network Security**
   - CORS configuration
   - Rate limiting (100 requests per 15 minutes)
   - HTTPS required in production

4. **Environment Security**
   - All secrets in environment variables
   - No default passwords (must be set explicitly)
   - .gitignore for sensitive files

5. **Payment Security**
   - Stripe Checkout Session (PCI compliant)
   - Webhook signature verification
   - Server-side amount calculation

### API Design

**RESTful principles** with clear resource-based URLs:

```
Authentication
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

Courts (Public access for listing)
GET    /api/courts
GET    /api/courts/:id
GET    /api/courts/:id/bookings
POST   /api/courts (admin)
PATCH  /api/courts/:id (admin)

Bookings (Authenticated)
POST   /api/bookings
POST   /api/bookings/block (admin)
GET    /api/bookings/my-bookings
GET    /api/bookings/:id
PATCH  /api/bookings/:id

Payments (Authenticated)
POST   /api/payments/create-checkout-session
POST   /api/payments/webhook (Stripe)
```

### Error Handling

Centralized error handling with:
- Custom AppError class
- Consistent error response format:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "traceId": "request-id-for-debugging"
  }
  ```
- Request ID tracking for debugging

### Booking Conflict Detection

Algorithm for detecting time slot conflicts:
```typescript
// A booking conflicts if:
// 1. New start time is during an existing booking
// 2. New end time is during an existing booking  
// 3. Existing booking is entirely within new booking

WHERE courtId = ? 
  AND status IN ('PENDING', 'CONFIRMED', 'BLOCKED')
  AND (
    (startTime <= ? AND endTime > ?) OR  -- Case 1
    (startTime < ? AND endTime >= ?) OR  -- Case 2
    (startTime >= ? AND endTime <= ?)    -- Case 3
  )
```

### Payment Flow

1. User creates booking → Status: PENDING
2. User clicks "Pay" → Create Stripe Checkout Session
3. User redirected to Stripe → Completes payment
4. Stripe webhook → Update payment status
5. Payment confirmed → Booking status: CONFIRMED

### Frontend Architecture

**Component Structure:**
```
src/
├── components/          # Reusable components
│   ├── Navbar           # Navigation bar
│   ├── ProtectedRoute   # Route guard
│   └── BookingForm      # Booking creation form
├── pages/               # Page components
│   ├── HomePage         # Court browsing & booking
│   ├── LoginPage        # Authentication
│   ├── RegisterPage     # User registration
│   ├── MyBookingsPage   # User's bookings
│   └── AdminPage        # Admin panel
├── hooks/               # Custom React hooks
│   ├── useAuth          # Authentication state
│   └── useBooking       # Booking operations
├── types/               # TypeScript types
├── utils/               # Utilities (API client)
└── App.tsx              # Main app with routing
```

**State Management:**
- **Server State**: React Query (bookings, courts, etc.)
- **Client State**: Zustand (authentication)
- **Form State**: Local component state

### DevOps & Deployment

**Local Development:**
- Docker Compose for PostgreSQL
- Hot reload for backend (tsx watch)
- Fast refresh for frontend (Vite HMR)

**CI/CD:**
- GitHub Actions for lint & build
- Automated checks on PRs
- Security scanning with CodeQL

**Deployment (Render):**
1. **Backend** (Web Service)
   - Build: `cd backend && npm install && npm run build && npm run db:migrate`
   - Start: `cd backend && npm start`
   - Auto-deploy from Git

2. **Frontend** (Static Site)
   - Build: `cd frontend && npm install && npm run build`
   - Publish: `frontend/dist`
   - CDN distribution

3. **Database** (PostgreSQL)
   - Managed PostgreSQL instance
   - Automatic backups

### Future Enhancements

**Planned for Android App:**
- Same backend API (already mobile-ready)
- Native Android app with Kotlin/Jetpack Compose or React Native
- Push notifications for booking confirmations

**Potential Improvements:**
- Email notifications (using SendGrid/AWS SES)
- SMS reminders (using Twilio)
- Calendar view for availability
- Recurring bookings
- Multi-language support (i18n)
- Real-time updates (WebSocket/SSE)
- Analytics dashboard
- Refund handling
- Booking history export

### Non-Functional Requirements

**Performance:**
- API response time < 200ms (p95)
- Frontend LCP < 2.5s
- Database queries optimized with indexes

**Scalability:**
- Stateless backend (horizontal scaling)
- Database connection pooling
- CDN for static assets

**Reliability:**
- Health check endpoints (/health, /ready)
- Graceful error handling
- Transaction support for critical operations

**Observability:**
- Request ID tracking
- Error logging
- Stripe webhook events logged

**Accessibility:**
- Semantic HTML
- Keyboard navigation
- Screen reader compatible (future: WCAG 2.2 AA)

## Trade-offs & Decisions

1. **JWT vs Session Auth**: Chose JWT for stateless auth, easier horizontal scaling
2. **Prisma vs TypeORM**: Chose Prisma for better TypeScript support and migrations
3. **Monolith vs Microservices**: Started with monolith for faster development
4. **Stripe Checkout vs Elements**: Chose Checkout for faster integration, PCI compliance
5. **React Query vs Redux**: Chose React Query for server state, simpler than Redux
6. **Postgres vs MongoDB**: Chose Postgres for ACID compliance critical for bookings

## Security Summary

✅ **No security vulnerabilities found** in CodeQL scan
✅ JWT-based authentication
✅ Password hashing with bcrypt
✅ Input validation on all endpoints
✅ RBAC implementation
✅ Rate limiting
✅ CORS protection
✅ Environment-based secrets
✅ No SQL injection (Prisma ORM)
✅ Stripe webhook signature verification
✅ Admin password required (no defaults)

The application is production-ready and follows industry best practices for security, scalability, and maintainability.
