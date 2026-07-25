# AniStrem — Deployment Guide (Netlify + Render)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Netlify         │────▶│  Render           │────▶│  MongoDB Atlas  │
│  (Frontend SPA)  │     │  (Backend API)    │     │  (Database)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  Cloudinary      │
                        │  (File Storage)  │
                        └──────────────────┘
```

| Service | Provider | Free Tier |
|---------|----------|-----------|
| Frontend | Netlify | Yes (100GB/mo) |
| Backend | Render | Yes (750hrs/mo) |
| Database | MongoDB Atlas | Yes (512MB M0) |
| Storage | Cloudinary | Yes (25GB) |

---

## Step 1: MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free M0 cluster
2. **Database Access:** Create user with password
3. **Network Access:** Add IP `0.0.0.0/0`
4. **Connect** → Copy connection string:
   ```
   mongodb+srv://<user>:<pass>@cluster.mongodb.net/anistrem?retryWrites=true&w=majority
   ```

---

## Step 2: Cloudinary (File Storage)

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Copy **Cloud name**, **API Key**, **API Secret** from dashboard

---

## Step 3: Backend — Render

1. Go to [render.com](https://render.com) → New **Web Service**
2. Connect GitHub repo
3. Configure:
   | Setting | Value |
   |---------|-------|
   | Name | anistrem-backend |
   | Runtime | Node |
   | Root directory | `backend` |
   | Build command | `npm install` |
   | Start command | `npm start` |
   | Node version | 18 |

4. Add **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/anistrem?retryWrites=true&w=majority
   JWT_SECRET=<64-char-random-string>
   JWT_REFRESH_SECRET=<different-64-char-random-string>
   FRONTEND_URL=https://your-site.netlify.app
   ADMIN_EMAIL=admin@anistrem.com
   ADMIN_PASSWORD=<strong-password>
   STORAGE_TYPE=cloudinary
   CLOUDINARY_CLOUD_NAME=<name>
   CLOUDINARY_API_KEY=<key>
   CLOUDINARY_API_SECRET=<secret>
   ```

5. Deploy → Note the URL (e.g., `https://anistrem-backend.onrender.com`)

---

## Step 4: Frontend — Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect GitHub repo
3. Configure:
   | Setting | Value |
   |---------|-------|
   | Branch | main |
   | Build command | `cd frontend && npm install && npm run build` |
   | Publish directory | `frontend/dist` |

4. Add **Environment Variables** (Site settings → Environment variables):
   ```
   VITE_API_BASE_URL = https://anistrem-backend.onrender.com/api
   VITE_SITE_NAME = AniStrem
   ```

5. Deploy → Note the URL (e.g., `https://your-site.netlify.app`)

---

## Step 5: Seed Database

On first boot, the backend **auto-seeds** the admin user and categories if the database is empty. No manual step needed.

To manually re-seed:
```bash
# Via Render Shell (Dashboard → Shell)
cd backend && node src/seed.js
```

---

## Step 6: Update Frontend URL

Update `FRONTEND_URL` in Render env vars to match your actual Netlify URL:
```
FRONTEND_URL=https://your-site.netlify.app
```

---

## Build Commands Reference

| Action | Command |
|--------|---------|
| Install all | `npm install` (from root) |
| Build frontend | `cd frontend && npm install && npm run build` |
| Seed database | `cd backend && node src/seed.js` |
| Start backend | `cd backend && npm start` |

---

## Environment Variables

### Frontend (Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | **Yes** | Backend API URL (e.g., `https://backend.onrender.com/api`) |
| `VITE_SITE_NAME` | No | Site name (default: AniStrem) |

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | JWT signing key (64+ chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token key (64+ chars) |
| `FRONTEND_URL` | **Yes** | Your Netlify URL (e.g., `https://site.netlify.app`) |
| `ADMIN_EMAIL` | **Yes** | Admin seed email |
| `ADMIN_PASSWORD` | **Yes** | Admin seed password |
| `STORAGE_TYPE` | No | `local`, `s3`, `cloudinary`, or `gcs` |
| `CLOUDINARY_CLOUD_NAME` | If cloudinary | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | If cloudinary | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | If cloudinary | Cloudinary API secret |

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Files

### Deploy to Netlify (frontend/)
```
frontend/
├── src/                    (all source)
├── public/                 (favicon, logo, manifest, robots, _redirects)
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

### Deploy to Render (backend/)
```
backend/
├── src/                    (all source)
├── package.json
├── package-lock.json
└── .env.example            (reference only — set env vars in Render)
```

### Never deploy
```
node_modules/
dist/
.env
*.log
uploads/processed/
```

---

## Troubleshooting

**Frontend shows "Network Error" on API calls:**
- Verify `VITE_API_BASE_URL` is set correctly in Netlify env vars
- Redeploy frontend after changing env vars (baked into build)
- Verify backend CORS allows your Netlify domain

**Admin login fails:**
- Admin user is auto-seeded on first boot if database is empty
- If still failing, re-seed via Render Shell: `cd backend && node src/seed.js`
- Verify `JWT_SECRET` is set

**CORS errors in browser console:**
- Verify `FRONTEND_URL` in backend env vars matches your Netlify URL exactly
- Must include `https://` and no trailing slash

**Videos don't play:**
- Set `STORAGE_TYPE=cloudinary` and configure Cloudinary credentials
- Upload a small test video first

---

## Checklist

- [ ] MongoDB Atlas: cluster created, IP `0.0.0.0/0`, user created
- [ ] Cloudinary: account created, credentials noted
- [ ] Backend: deployed to Render, env vars set
- [ ] Backend: database seeded, admin login works
- [ ] Frontend: deployed to Netlify, `VITE_API_BASE_URL` set
- [ ] Frontend: `FRONTEND_URL` updated in Render to match Netlify URL
- [ ] All pages load correctly
- [ ] Admin panel accessible
- [ ] Video upload works
- [ ] No console errors
