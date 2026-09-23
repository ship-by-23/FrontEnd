# SimpanDulu Frontend

SimpanDulu adalah aplikasi *read-it-later* untuk menyimpan artikel dari web dan membacanya kembali dalam satu library pribadi. Frontend ini menangani autentikasi, pengelolaan artikel, reader, pencarian, tag, highlight, serta pengaturan pengalaman membaca.

Repository ini berisi aplikasi frontend. Untuk berjalan sepenuhnya, frontend membutuhkan service API SimpanDulu dengan contract pada prefix `/api/v1`.

## Fitur

- Menyimpan artikel berdasarkan URL dan memantau proses ekstraksi konten.
- Mengelola library dalam tampilan grid atau list, lengkap dengan pagination, pencarian, sorting, dan filter.
- Mengubah status baca artikel menjadi belum dibaca, sedang dibaca, atau selesai.
- Menandai artikel sebagai favorit, mengarsipkan, mengedit status, dan menghapus artikel.
- Membaca artikel dalam reader yang responsif dengan progress baca yang tersimpan.
- Mengatur tema, font reader, dan ukuran teks.
- Membuat highlight dari teks artikel, menambahkan catatan, mengedit, dan menghapusnya.
- Mengelompokkan artikel menggunakan tag yang dapat dibuat, diganti nama, dihapus, serta dipasang atau dilepas dari artikel.
- Menggunakan bookmarklet untuk mengirim halaman yang sedang dibuka ke SimpanDulu.
- Mengelola profil, password, sesi login, dan pengaturan akun.

## Tech stack

| Area | Teknologi |
| --- | --- |
| UI | React, TypeScript, Tailwind CSS |
| Build tool | Vite |
| Routing | React Router |
| Server state | TanStack React Query |
| Komponen pendukung | Lucide React, Motion, Sonner, `clsx`, `tailwind-merge` |
| Quality tools | TypeScript, ESLint, Vitest |
| Production serving | Docker, Nginx |

## Struktur proyek

```text
src/
├── app/          # Router dan provider aplikasi
├── components/   # Komponen UI dan layout yang reusable
├── features/     # Modul berdasarkan domain fitur
├── lib/          # API client, contract parser, konfigurasi, dan utilitas
├── pages/        # Komposisi halaman berdasarkan route
└── styles/       # Style global
public/
├── brand/        # Logo dan wordmark
└── images/       # Asset gambar publik
```

Pendekatan berbasis fitur menjaga logic domain—seperti artikel, library, reader, tag, highlight, auth, dan appearance—tetap dekat dengan komponen yang menggunakannya. `src/lib/api` menjadi boundary antara UI dan API melalui typed request serta validasi response contract.

## Menjalankan secara lokal

### Prasyarat

- Node.js 22 atau versi LTS yang kompatibel.
- npm.
- Service API SimpanDulu yang dapat diakses dari browser.

### Instalasi

1. Salin file environment contoh:

   ```bash
   cp .env.example .env
   ```

   Untuk PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Sesuaikan nilai `VITE_API_URL` pada `.env`.
3. Install dependency dan jalankan development server:

   ```bash
   npm ci
   npm run dev
   ```

   Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

### Environment variable

#### Development

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | Ya | URL absolut API yang diakhiri `/api/v1`, misalnya `http://localhost:3000/api/v1`. |
| `VITE_APP_ENV` | Tidak | Penanda environment aplikasi, misalnya `development`. |

Jangan menyimpan credential atau secret di environment variable dengan prefix `VITE_` karena nilainya ikut masuk ke bundle browser.

#### Production container

Nilai production diberikan ketika container dijalankan. Image yang sama dapat digunakan di beberapa environment tanpa rebuild frontend.

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `API_URL` | Ya | URL absolut API dan harus diakhiri `/api/v1`. |
| `APP_ENV` | Tidak | Nama environment; default-nya `production`. |
| `APP_VERSION` | Tidak | Versi atau commit SHA yang sedang dideploy. |

Saat startup, entrypoint container membuat `runtime-config.js` dan konfigurasi Nginx dari nilai tersebut. Jika `API_URL` tidak valid, container berhenti agar deployment tidak berjalan dengan konfigurasi yang salah.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan Vite development server. |
| `npm run build` | Menjalankan type-check lalu membuat production bundle. |
| `npm run preview` | Menyajikan hasil build secara lokal. |
| `npm run typecheck` | Memeriksa tipe TypeScript tanpa membuat bundle. |
| `npm run lint` | Menjalankan ESLint pada source code. |
| `npm test` | Menjalankan test sekali menggunakan Vitest. |
| `npm run test:watch` | Menjalankan Vitest dalam mode watch. |

Sebelum membuat pull request, jalankan pemeriksaan utama berikut:

```bash
npm run lint
npm test
npm run build
```

## Route utama

| Route | Keterangan |
| --- | --- |
| `/` | Landing page. |
| `/login` | Masuk ke akun. |
| `/register` | Membuat akun baru. |
| `/library` | Library artikel beserta filter, sort, dan pagination. |
| `/articles/new` | Menyimpan artikel baru. |
| `/articles/:articleId` | Membaca artikel dan mengelola highlight. |
| `/articles/:articleId/edit` | Mengubah status dan metadata yang dapat diedit. |
| `/search` | Mencari artikel menggunakan filter library. |
| `/tags` | Mengelola direktori tag. |
| `/tags/:tagId` | Melihat artikel berdasarkan tag. |
| `/highlights` | Melihat dan mengelola seluruh highlight. |
| `/settings/profile` | Mengubah profil. |
| `/settings/appearance` | Mengatur tema, font, ukuran teks, dan tampilan library. |
| `/settings/security` | Mengubah password. |
| `/settings/bookmarklet` | Menyiapkan bookmarklet SimpanDulu. |
| `/settings/about` | Informasi aplikasi. |

Route selain landing dan autentikasi dilindungi oleh pemeriksaan session. Halaman dimuat secara lazy untuk menjaga bundle awal tetap kecil.

## Integrasi API

Frontend menggunakan `fetch` melalui API client terpusat. Kelompok endpoint yang digunakan meliputi:

- Auth dan akun: `/auth/*` serta `/me`.
- Artikel: `/articles`, detail artikel, update, delete, retry extraction, dan reading progress.
- Tag: `/tags` serta relasi tag pada artikel.
- Highlight: daftar global, highlight per artikel, update note, dan delete.

`/search` tidak membutuhkan endpoint khusus. Halaman tersebut menggunakan endpoint artikel yang sama dengan Library melalui parameter `query` dan filter terkait.

Status ekstraksi artikel dipantau dari frontend dengan polling terbatas. Proses mengambil dan mengekstrak isi artikel tetap menjadi tanggung jawab service API.

Sesi menggunakan access token yang hanya disimpan di memory browser, sedangkan refresh session menggunakan cookie HTTP-only dengan `credentials: include`. Response API divalidasi di boundary contract sebelum digunakan oleh UI.

## Menjalankan dengan Docker

Build image production:

```bash
docker build -t simpandulu-frontend .
```

Jalankan container dengan konfigurasi API:

```bash
docker run --rm -p 8080:80 \
  -e API_URL=https://api.example.com/api/v1 \
  -e APP_ENV=production \
  -e APP_VERSION=commit-sha \
  simpandulu-frontend
```

Frontend disajikan oleh Nginx dengan SPA fallback, cache asset statis, dan header keamanan dasar. Setelah container berjalan, aplikasi dapat diakses melalui `http://localhost:8080`.

## Catatan pengembangan

- Gunakan API URL yang menyertakan prefix `/api/v1`; konfigurasi tanpa prefix akan ditolak.
- Jangan menaruh token atau credential di source code maupun file `.env` yang di-commit.
- Perubahan pada response API perlu tetap mengikuti parser dan type di `src/lib/api`.
- Logic baru sebaiknya ditempatkan pada feature terkait, bukan menumpuk di page component.
