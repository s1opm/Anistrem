# AniStrem

Premium anime streaming platform with admin-only uploads, multi-resolution video processing, HLS/DASH streaming, and responsive dark UI.

## Quick Start

```bash
# 1. Clone and install
cd animation-streaming
npm install

# 2. Create backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 3. Seed database
npm run seed

# 4. Start dev servers
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin/login |
| API | http://localhost:5000/api |

## Default Admin

- **Email:** admin@anistrem.com
- **Password:** Admin@123456

**Change the default password after first login!**

## Tech Stack

**Frontend:** React 18, Vite 5, Tailwind CSS, React Router, Zustand, Framer Motion, React Player

**Backend:** Node.js 18+, Express, MongoDB/Mongoose, JWT, Multer, FFmpeg

## Project Structure

```
animation-streaming/
├── backend/
│   └── src/
│       ├── config/          # Environment config
│       ├── controllers/     # Route handlers
│       ├── middleware/       # Auth, validation, upload
│       ├── models/          # Mongoose schemas (12 models)
│       ├── routes/          # API routes
│       ├── services/        # Video processing, cloud storage
│       ├── seed.js          # Database seeder
│       └── server.js        # Express entry point
├── frontend/
│   └── src/
│       ├── components/      # UI, layout, video components
│       ├── pages/
│       │   ├── admin/       # Admin panel (7 pages)
│       │   └── public/      # Public website (14 pages)
│       ├── services/        # Axios API client
│       ├── store.js         # Zustand stores
│       ├── hooks/           # Custom hooks
│       └── utils/           # Helpers and formatters
├── scripts/
│   ├── setup.js             # Interactive setup
│   └── dev.js               # Dev server launcher
├── netlify.toml             # Netlify deployment config
├── package.json             # Root monorepo scripts
├── README.md
└── DEPLOYMENT.md
```

## Deployment

- **Frontend:** Deploy to [Netlify](https://netlify.com) — see [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Backend:** Deploy to Render, Railway, or any Node.js host
- **Database:** MongoDB Atlas (free M0 tier)

## Requirements

- Node.js 18+
- MongoDB 6+ (or MongoDB Atlas)
- FFmpeg (for video processing)
