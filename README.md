# ITELECT4 Backend API

Backend REST API for the DLSL Book Reservation & Academic Submission System. Built with Express, TypeScript, and MongoDB Atlas.

## Live Deployment
- **Backend API Live URL**: `https://itelect4-backend-eosin.vercel.app/`
- **Frontend App Live URL**: `https://itelect4-project-it4b-gt1.vercel.app/`
- **Health Check Endpoint**: `https://itelect4-backend-eosin.vercel.app/api/health`

## Environment Variables
Configured in `.env` (local) and Vercel Project Settings (production):
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key used for signing JWT tokens
- `CORS_ORIGIN`: Allowed origins for CORS (e.g. `http://localhost:5173, https://<your-frontend-app>.vercel.app`)

*Note: Never commit `.env`. See `.env.example` for reference.*

Vercel serves the Express app exported from `src/server.ts`; the local
development server listener is not started in the Vercel runtime. MongoDB
connects when the first request arrives, so configure `MONGODB_URI` in the
Vercel project environment before deploying.

## API Endpoints
- `GET /api/health` - Health check (`{ ok: true, db: true }`)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Authenticate and return JWT token
- `GET /api/books` - Public book catalog
- `GET /api/books/:id` - Public book detail lookup
- `GET /api/courses` - Public course reference list
- `GET /api/courses/:code` - Public single course by code
- `GET /api/reservations` - User reservations (Protected)
- `POST /api/reservations` - Create reservation (Protected)
- `PATCH /api/reservations/:id` - Cancel reservation (Protected)
- `GET /api/submissions` - User submissions (Protected)
- `POST /api/submissions` - Create submission (Protected)

## Scripts
- `npm run dev` - Start local development server with tsx watch
- `npm run build` - TypeScript compilation check (`tsc`)
- `npm run seed` - Upsert initial reference resources into MongoDB Atlas

## Author
Mikaela Ysabel L. Lantafe | IT4B
