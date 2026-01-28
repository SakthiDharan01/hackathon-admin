## AI WARS Admin Dashboard

Admin-only Next.js (App Router) UI for the AI WARS Hackathon platform.

### Requirements
- Node.js 18+
- Backend running at `http://localhost:8080` (or set `NEXT_PUBLIC_API_BASE_URL`)

### Environment
Create `.env.local` in this folder if you want to override the backend URL:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Run
```
npm install
npm run dev
```

### Routes
- `/login`
- `/dashboard`
- `/teams`
- `/teams/[teamId]`
- `/evaluations`
- `/announcements`
- `/checkin`
- `/submissions`
- `/settings`

### Auth
Login posts to `/admin/auth/login`. The UI stores the admin JWT in an httpOnly cookie via Next.js route handler and proxies all admin API calls through `/api/admin/*`.

### Notes
- All critical actions require confirmation.
- Polling is enabled on key screens.
- QR scanner uses the browser BarcodeDetector API with manual fallback.
Use this Folder 