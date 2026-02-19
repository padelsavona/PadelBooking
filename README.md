# Padel Booking Application

A full-stack web application for booking padel courts, similar to Playtomic. Built with TypeScript, Node.js/Fastify, React, PostgreSQL, and Stripe integration.

## Features

- **User Authentication**: Register and login with JWT-based authentication
- **Court Booking**: Browse available courts and book time slots from 00:00 to 24:00
- **Online Payments**: Secure payment processing via Stripe
- **Booking Management**: View and cancel bookings
- **Two User Roles**:
  - **Players**: Must pay for bookings via Stripe
  - **Admins**: Can block time slots without payment for maintenance or events

## Tech Stack

### Backend
- **Node.js** with **Fastify** - Fast and lightweight web framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern ORM for PostgreSQL
- **PostgreSQL** - Reliable relational database
- **Stripe** - Payment processing
- **JWT** - Secure authentication
- **Zod** - Schema validation

### Frontend
- **React** 18 - Modern UI library
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Navigation
- **Axios** - HTTP client

### DevOps
- **Docker Compose** - Local development
- **GitHub Actions** - CI/CD pipeline
- **ESLint & Prettier** - Code quality

## Prerequisites

- Node.js 18+ 
- PostgreSQL 16+ (or use Docker)
- Stripe account (for payment processing)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Dimmiditutto/PadelBooking.git
cd PadelBooking
```

### 2. Environment Setup

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/padelbooking

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Admin Account
ADMIN_EMAIL=admin@padelbooking.com
ADMIN_PASSWORD=change-this-password
```

### 3. Start PostgreSQL

Using Docker:

```bash
docker-compose up -d
```

Or use your local PostgreSQL installation.

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 5. Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

cd ..
```

### 6. Run the Application

In one terminal, start the backend:

```bash
cd backend
npm run dev
```

In another terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

### 7. Login

Default admin credentials (from seed):
- Email: `admin@padelbooking.com`
- Password: `admin123456` (or from your ADMIN_PASSWORD env var)

## Development

### Project Structure

```
PadelBooking/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── src/
│   │   ├── middleware/          # Auth middleware
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── db.ts                # Prisma client
│   │   ├── errors.ts            # Error handling
│   │   ├── index.ts             # App entry point
│   │   ├── schemas.ts           # Validation schemas
│   │   └── seed.ts              # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Page components
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utilities
│   │   ├── App.tsx              # Main app component
│   │   └── main.tsx             # Entry point
│   └── package.json
├── .env.example                 # Environment template
├── docker-compose.yml           # Docker services
└── README.md
```

### Database Schema

- **Users**: Authentication and role management (PLAYER/ADMIN)
- **Courts**: Padel courts with pricing
- **Bookings**: Time slot reservations with status tracking
- **Payments**: Stripe payment records

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

#### Courts
- `GET /api/courts` - List all active courts
- `GET /api/courts/:id` - Get court details
- `GET /api/courts/:id/bookings` - Get court bookings
- `POST /api/courts` - Create court (admin only)
- `PATCH /api/courts/:id` - Update court (admin only)

#### Bookings
- `POST /api/bookings` - Create booking
- `POST /api/bookings/block` - Block time slot (admin only)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Cancel booking

#### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler

### Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run format       # Format code
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run format       # Format code
```

## Deployment

### Render Deployment

1. **Backend (Web Service)**:
   - Build Command: `cd backend && npm install && npm run build && npm run db:migrate`
   - Start Command: `cd backend && npm start`
   - Add environment variables from `.env.example`

2. **Frontend (Static Site)**:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

3. **Database**:
   - Create PostgreSQL instance on Render
   - Copy `DATABASE_URL` to backend environment variables

4. **Stripe Webhooks**:
   - Configure webhook URL: `https://your-backend.onrender.com/api/payments/webhook`
   - Add webhook secret to `STRIPE_WEBHOOK_SECRET` env var

### Environment Variables for Production

Make sure to set secure values for:
- `JWT_SECRET` - Random strong secret
- `ADMIN_PASSWORD` - Strong password
- `STRIPE_SECRET_KEY` - Production Stripe key
- `DATABASE_URL` - Production database URL
- `FRONTEND_URL` - Your frontend URL

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- CORS protection
- Rate limiting
- SQL injection prevention (Prisma)
- Environment-based secrets
- HTTPS required in production

## Future Enhancements

- [ ] Android mobile app
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Recurring bookings
- [ ] Multi-language support
- [ ] Calendar view
- [ ] Booking history and analytics
- [ ] Refund handling
- [ ] Court availability calendar

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.