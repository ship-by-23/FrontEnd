# SimpanDulu Frontend

Frontend React untuk aplikasi read-it-later privat SimpanDulu.

## Menjalankan

1. Salin `.env.example` menjadi `.env` dan sesuaikan `VITE_API_URL`.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.

Runtime tidak menggunakan data dummy. Jika API kosong, UI menampilkan empty state; jika API tidak tersedia, UI menampilkan error yang dapat dipulihkan.

## Kontrak backend yang digunakan

- `GET /me`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /articles`
- `POST /articles`
- `GET /articles/:articleId`
- `GET /tags`

Refresh session diasumsikan melalui cookie HTTP-only dengan `credentials: include`. Detail payload sengaja dibatasi pada field yang dipakai UI hingga kontrak backend final tersedia.
