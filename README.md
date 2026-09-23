# SimpanDulu Frontend

Frontend React untuk SimpanDulu, aplikasi read-it-later privat. Pengguna dapat menyimpan URL, membaca artikel di satu tempat, lalu menemukannya kembali lewat library, tag, dan pencarian.

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env`.
2. Pastikan `VITE_API_URL` menunjuk ke API yang sedang berjalan.
3. Install dependency dan jalankan development server:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Perintah yang tersedia

```bash
npm run build   # type-check dan build production
npm run lint    # cek lint
npm test        # jalankan test sekali
```

## Route utama

- `/` — landing page
- `/login` dan `/register` — autentikasi
- `/library` — daftar artikel
- `/articles/new` — simpan artikel
- `/articles/:articleId` — reader
- `/search` — pencarian
- `/tags` — tag
- `/settings/profile`, `/settings/appearance`, `/settings/security`, `/settings/bookmarklet` — pengaturan

## API

Base URL diatur melalui `VITE_API_URL` (contoh: `http://localhost:3000/api/v1`). Frontend memakai endpoint berikut:

- `GET /me`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /articles`
- `POST /articles`
- `GET /articles/:articleId`
- `POST /articles/:articleId/retry`
- `GET /tags`

Refresh session menggunakan cookie HTTP-only dengan `credentials: include`.

Save Article melakukan validasi URL dasar di browser, mengirim tag opsional jika dipilih, lalu memantau `pending`, `processing`, `completed`, atau `failed` dengan bounded polling. Progress extraction tidak dibuat di frontend.