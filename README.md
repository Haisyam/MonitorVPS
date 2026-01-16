# PulseOps VPS Monitoring Dashboard

Dashboard monitoring VPS profesional berbasis Next.js App Router (JavaScript) dengan UI modern glassmorphism, realtime SSE, dan API metrics aman. Cocok untuk admin VPS yang butuh insight cepat tentang CPU, RAM, disk, network, proses, services, health checks, dan log ringkas.

## Fitur Utama
- Realtime summary CPU, RAM, disk, network, uptime, load
- Charts Recharts untuk CPU, RAM, dan Network throughput
- Top processes (CPU/RAM) dengan search dan sort
- Status service (systemd) dan widget projects
- Health checks dari daftar URL
- Logs ringkas + error count
- SSE streaming dengan fallback polling
- Auth sederhana berbasis password + cookie httpOnly
- CORS dan API key protection di semua endpoint metrics

## Tech Stack
- Next.js 16 App Router (JavaScript)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Recharts
- systeminformation + pidusage

## Requirements
- Node.js 18+ (disarankan 20+)
- Linux VPS untuk metrics penuh (systeminformation paling akurat di Linux)

## Quick Start (Local Dev)
```bash
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:3000

Catatan:
- Metrics di laptop tetap bisa jalan, tetapi status service bisa "unknown" jika tidak pakai systemd.
- Ubah `DASHBOARD_ALLOWED_ORIGIN` ke `http://localhost:3000`.
- Setelah edit `.env`, restart `npm run dev`.

## Struktur Folder
```
src/
  app/                 # App Router pages + API routes
  components/          # UI components (cards, charts, tables)
  config/              # Konfigurasi projects widget
  lib/                 # Auth, api guard, metrics collector
deploy/
  apache/              # Apache reverse proxy config
  nginx/               # Nginx reverse proxy config
  systemd/             # systemd unit
```

## Environment Variables
Lihat `.env.example` untuk daftar lengkap. Variabel utama:

Wajib:
- `DASHBOARD_API_KEY` - API key untuk endpoint metrics
- `NEXT_PUBLIC_DASHBOARD_API_KEY` - dipakai frontend, harus sama dengan `DASHBOARD_API_KEY`
- `DASHBOARD_PASSWORD` - password login dashboard
- `DASHBOARD_AUTH_SECRET` - secret HMAC untuk session (fallback ke password jika kosong)

Direkomendasikan:
- `DASHBOARD_SESSION_TTL_SEC` - TTL cookie login (default 86400)
- `DASHBOARD_ALLOWED_ORIGIN` - origin yang diizinkan untuk CORS
- `DASHBOARD_RATE_LIMIT` - limit request per window
- `DASHBOARD_RATE_WINDOW_MS` - durasi window rate limit

Monitoring:
- `DASHBOARD_SERVICES` - daftar service (comma list). Contoh: `nginx,redis,pm2`
- `DASHBOARD_PIDS` - daftar PID khusus (comma list). Contoh: `1234,5678`
- `DASHBOARD_HEALTH_URLS` - URL health checks (comma list)
- `DASHBOARD_LOG_FILES` - path log atau `name:/path/log` (comma list)
- `DASHBOARD_LOG_TAIL_LINES` - jumlah line tail per log
- `DASHBOARD_LOG_MAX_BYTES` - batas byte untuk baca log
- `LOGS_CACHE_MS` - cache log in-memory

Tuning cache:
- `METRICS_CACHE_MS` - cache ringkas (default 1000ms)
- `DETAIL_CACHE_MS` - cache detail (default 4000ms)
- `PROCESS_CACHE_MS` - cache proses (default 1500ms)

Catatan penting:
- Jika `DASHBOARD_ALLOWED_ORIGIN` kosong, CORS memakai `Origin` dari request. Di production sebaiknya set eksplisit.
- `DASHBOARD_HEALTH_URLS` melakukan `GET` tanpa auth. Jika endpoint butuh key, tambahkan `?key=...` di URL.
- Pastikan user yang menjalankan Next.js punya akses baca log (`DASHBOARD_LOG_FILES`).

## Routes Utama
Frontend:
- `/` landing
- `/login`
- `/dashboard`
- `/dashboard/processes`
- `/dashboard/network`
- `/dashboard/storage`
- `/dashboard/services`
- `/dashboard/settings`

API (wajib `x-api-key` atau `?key=...`):
- `GET /api/metrics/summary`
- `GET /api/metrics/system`
- `GET /api/metrics/storage`
- `GET /api/metrics/network`
- `GET /api/metrics/processes`
- `GET /api/metrics/services`
- `GET /api/metrics/health`
- `GET /api/metrics/logs`
- `GET /api/health`
- `GET /api/stream` (SSE, dukung `?interval=1000` - min 500, max 5000)

## Deploy on VPS (Systemd)
1) Build aplikasi:
```bash
npm install
npm run build
```
2) Copy `.env` ke folder deploy.
3) Install unit systemd:
```bash
sudo cp deploy/systemd/vps-dashboard.service /etc/systemd/system/pulseops.service
sudo systemctl daemon-reload
sudo systemctl enable --now pulseops
```
4) Edit `User`, `Group`, dan `WorkingDirectory` pada unit file sesuai server.

## Reverse Proxy
Apache:
```bash
sudo a2enmod proxy proxy_http headers rewrite
sudo cp deploy/apache/vps-dashboard.conf /etc/apache2/sites-available/pulseops.conf
sudo a2ensite pulseops.conf
sudo systemctl reload apache2
```

Nginx:
```bash
sudo cp deploy/nginx/vps-dashboard.conf /etc/nginx/sites-available/pulseops.conf
sudo ln -s /etc/nginx/sites-available/pulseops.conf /etc/nginx/sites-enabled/pulseops.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Cloudflare
- SSL: Full (strict)
- Proxy status: Proxied
- Jangan cache `/api/*`

## Security Notes
- Semua endpoint metrics dan SSE butuh API key.
- `/dashboard/*` dilindungi middleware login.
- Session menggunakan cookie httpOnly yang ditandatangani HMAC.
- Jangan log secret ke console.
- Status service terbaik di Linux systemd.

## Troubleshooting
- Services kosong atau status unknown:
  - Pastikan `DASHBOARD_SERVICES` berisi nama service yang benar.
  - Restart server setelah ubah `.env`.
  - Di local non-systemd, status bisa `unknown`.
- Health checks gagal:
  - Pastikan `DASHBOARD_HEALTH_URLS` reachable dari server.
  - Jika butuh auth, tambahkan `?key=...`.
- Logs tidak muncul:
  - Cek path dan permission file.
  - Isi `DASHBOARD_LOG_FILES` dengan path valid.
- SSE tidak update:
  - Pastikan proxy tidak buffering (lihat config nginx).
  - Dashboard otomatis fallback ke polling.

---
Made for ops - realtime insight tanpa ribet.
