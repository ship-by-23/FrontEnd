# SimpanDulu Frontend

Frontend React untuk SimpanDulu, aplikasi read-it-later privat. Pengguna dapat menyimpan URL, membaca artikel di satu tempat, lalu menemukannya kembali lewat library, tag, dan pencarian.

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env`.
2. Pastikan `VITE_API_URL` menunjuk ke API development yang sedang berjalan.
3. Install dependency dan jalankan development server:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Perintah yang tersedia

```bash
npm run build   # type-check dan build production
npm run typecheck # type-check tanpa membuat bundle
npm run lint    # cek lint
npm test        # jalankan test sekali
```

## Route utama

- `/` — landing page
- `/login` dan `/register` — autentikasi
- `/library` — daftar artikel
- `/articles/new` — simpan artikel
- `/articles/:articleId` — reader
- `/articles/:articleId/edit` — edit state user-controlled dan metadata read-only
- `/search` — pencarian
- `/tags` — direktori, create, rename, dan delete tag
- `/tags/:tagId` — artikel pada tag dan detach relasi
- `/highlights` — daftar highlight dan note dari seluruh artikel
- `/settings/profile`, `/settings/appearance`, `/settings/security`, `/settings/bookmarklet` — pengaturan

## API

Pada development, base URL diatur melalui `VITE_API_URL` (contoh: `http://localhost:3000/api/v1`). URL wajib memakai prefix `/api/v1`. Pada production, base URL dibaca dari `/runtime-config.js` yang dibuat container saat startup sehingga artifact staging dan production dapat sama.

- `GET /me`
- `PATCH /me`
- `PUT /me/password`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /articles`
- `POST /articles`
- `GET /articles/:articleId`
- `PATCH /articles/:articleId`
- `DELETE /articles/:articleId`
- `POST /articles/:articleId/retry`
- `PUT /articles/:articleId/progress`
- `GET /tags`
- `POST /tags`
- `PATCH /tags/:tagId`
- `DELETE /tags/:tagId`
- `PUT /articles/:articleId/tags/:tagId`
- `DELETE /articles/:articleId/tags/:tagId`
- `GET /highlights`
- `GET /articles/:articleId/highlights`
- `POST /articles/:articleId/highlights`
- `PATCH /highlights/:highlightId`
- `DELETE /highlights/:highlightId`

Route `/search` menggunakan `GET /articles` yang sama dengan Library, dengan parameter `query` dan filter yang sama. Tidak ada endpoint frontend terpisah yang dibuat hanya untuk layar Search.

Refresh session menggunakan cookie HTTP-only dengan `credentials: include`.

Save Article melakukan validasi URL dasar di browser, mengirim tag opsional jika dipilih, lalu memantau `pending`, `processing`, `completed`, atau `failed` dengan bounded polling. Progress extraction tidak dibuat di frontend.

## Production container

Build image sekali, lalu berikan API URL saat container dijalankan:

```bash
docker build -t simpandulu-frontend .
docker run --rm -p 8080:80 \
  -e API_URL=https://api.example.com/api/v1 \
  -e APP_ENV=production \
  -e APP_VERSION=$(git rev-parse --short HEAD) \
  simpandulu-frontend
```

Container akan gagal start jika `API_URL` kosong, bukan menggunakan fallback diam-diam. `nginx.conf` mengaktifkan SPA fallback, header keamanan dasar, dan CSP `connect-src` yang dibuat dari origin API saat startup.
