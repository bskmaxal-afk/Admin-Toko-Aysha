# Product Catalog CMS

Sistem katalog produk (**bukan e-commerce**). Arsitektur **monolith**: satu server Express yang menyediakan REST API, menyajikan gambar upload, dan menyajikan hasil build React.

- **Backend:** Node.js + Express (satu file: `server.js`)
- **Database:** MySQL / MariaDB
- **Frontend:** React (build-nya disajikan oleh Express)
- **Auth:** satu role `Admin`, login via cookie httpOnly (JWT)

---

## 1. Menjalankan Backend

### Prasyarat
- Node.js 18+
- MySQL / MariaDB berjalan

### Langkah

```bash
# 1. Import schema SQL (database: product_catalog_cms) ke MySQL

# 2. Install dependency
npm init -y
npm i express mysql2 bcryptjs jsonwebtoken cookie-parser multer helmet express-rate-limit dotenv

# 3. Buat file .env (lihat di bawah)

# 4. Jalankan
node server.js
```

Kalau berhasil akan muncul:

```
[INFO] Admin pertama dibuat: "admin"
[INFO] Server jalan di http://localhost:3000
```

### File `.env`

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=product_catalog_cms

JWT_SECRET=ganti_dengan_string_acak_panjang
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GantiPasswordIni123

COOKIE_SECURE=false
TRUST_PROXY=false
```

| Variabel | Wajib | Keterangan |
|---|---|---|
| `JWT_SECRET` | Ya | Minimal 16 karakter. Kalau kosong, server tidak mau start. |
| `ADMIN_USERNAME` | Ya (sekali) | Username admin pertama. Hanya dibaca saat tabel `admins` kosong. |
| `ADMIN_PASSWORD` | Ya (sekali) | Minimal 8 karakter. Disimpan sebagai hash bcrypt. |
| `DB_PASSWORD` | Sesuai MySQL | Kosongkan kalau root tanpa password. |
| `PORT` | Tidak | Default `3000`. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_NAME` | Tidak | Default `localhost` / `3306` / `root` / `product_catalog_cms`. |
| `COOKIE_SECURE` | Tidak | Set `true` hanya kalau sudah pakai HTTPS. Kalau `true` di HTTP, cookie login tidak tersimpan. |
| `TRUST_PROXY` | Tidak | Set `true` kalau di belakang proxy (Nginx, dll). |

> Jangan commit `.env` ke Git. Tambahkan ke `.gitignore`.

---

## 2. Struktur Folder

```
project/
├── server.js
├── .env
├── package.json
├── uploads/          <- dibuat otomatis, berisi gambar produk
└── client/
    └── dist/         <- hasil build React (npm run build), disajikan otomatis oleh Express
```

Kalau `client/dist/index.html` ada, Express otomatis menyajikannya, dan semua route non-API (misalnya `/produk/abc`, `/admin/login`) diarahkan ke `index.html` supaya React Router jalan.

---

## 3. Panduan untuk Frontend

### Aturan penting

1. **Semua request ke path relatif** (`/api/...`), jangan hardcode `http://localhost:3000`. Kalau FE dan BE satu server, tidak ada CORS.
2. **Login pakai cookie.** Setiap `fetch` ke endpoint admin harus pakai `credentials: 'include'` (atau `'same-origin'`). Token tidak perlu disimpan di localStorage dan tidak bisa dibaca JS.
3. **Create/update produk pakai `FormData`** (multipart), bukan JSON. **Jangan set header `Content-Type` manual**, biar browser yang mengisi boundary-nya.
4. **Gambar** diakses lewat field `image_url` (contoh: `/uploads/1730000000000-uuid.jpg`), langsung pakai di `<img src={product.image_url}>`. Kalau `null`, tampilkan placeholder.
5. Sesi berlaku **8 jam**. Kalau API admin mengembalikan `401`, arahkan user ke halaman login.

### Development dengan Vite (FE jalan di port lain)

Supaya cookie dan path relatif tetap jalan, pakai proxy di `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
```

Untuk production: `npm run build`, lalu pastikan hasilnya ada di `client/dist` sejajar dengan `server.js`.

### Helper fetch yang disarankan

```js
async function api(path, options = {}) {
  const res = await fetch(path, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Terjadi kesalahan');
    err.status = res.status;
    err.errors = data.errors; // array pesan validasi (kalau ada)
    throw err;
  }
  return data;
}
```

---

## 4. Daftar Endpoint

Semua response berbentuk JSON.

### 4.1 Publik (tanpa login)

#### `GET /api/categories`
Daftar kategori beserta jumlah produk yang **published**.

```json
{
  "data": [
    { "id": 1, "name": "Bahan Masakan", "slug": "bahan-masakan", "product_count": 5 }
  ]
}
```

#### `GET /api/products`
Daftar produk berstatus **published** saja.

| Query | Keterangan |
|---|---|
| `search` | Cari berdasarkan nama atau brand |
| `category` | Filter kategori, bisa pakai **id** (`1`) atau **slug** (`snack`) |
| `page` | Halaman, default `1` |
| `limit` | Item per halaman, default `12`, maksimal `100` |

Contoh: `/api/products?search=indomie&category=makanan-instan&page=1&limit=12`

```json
{
  "data": [ /* array Product, lihat 5. Bentuk Data */ ],
  "meta": { "page": 1, "limit": 12, "total": 30, "total_pages": 3 }
}
```

#### `GET /api/products/:slug`
Detail satu produk (published) berdasarkan **slug**.

```json
{ "data": { /* Product */ } }
```
Kalau tidak ada atau bukan published: `404`.

---

### 4.2 Auth

#### `POST /api/auth/login`
Body JSON:
```json
{ "username": "admin", "password": "GantiPasswordIni123" }
```
Sukses (`200`) dan cookie `token` otomatis di-set:
```json
{ "message": "Login berhasil", "admin": { "id": 1, "username": "admin" } }
```
Gagal: `401` (username/password salah), `400` (kosong), `429` (terlalu banyak percobaan: 10 kali per 15 menit).

#### `POST /api/auth/logout`
Menghapus cookie. Response: `{ "message": "Logout berhasil" }`

#### `GET /api/auth/me`
Cek apakah sedang login. Gunakan ini saat aplikasi pertama kali load untuk protected route.
- Login: `200` `{ "admin": { "id": 1, "username": "admin" } }`
- Belum login: `401`

#### `POST /api/auth/change-password` (butuh login)
```json
{ "current_password": "lama", "new_password": "baru_minimal_8_karakter" }
```

---

### 4.3 Admin: Kategori (butuh login)

| Method | Endpoint | Body (JSON) |
|---|---|---|
| `GET` | `/api/admin/categories` | - |
| `POST` | `/api/admin/categories` | `{ "name": "Frozen Food" }` |
| `PUT` | `/api/admin/categories/:id` | `{ "name": "Nama Baru" }` |
| `DELETE` | `/api/admin/categories/:id` | - |

- `slug` dibuat otomatis dari nama, tidak perlu dikirim.
- `GET` mengembalikan `{ "data": [ { id, name, slug, created_at, updated_at, product_count } ] }` (`product_count` mencakup semua status).
- `POST`/`PUT` mengembalikan `{ "message": "...", "data": { id, name, slug, ... } }`.
- `DELETE` kategori yang masih dipakai produk akan ditolak dengan **`409`**. Tampilkan pesannya ke admin.

---

### 4.4 Admin: Produk (butuh login)

#### `GET /api/admin/products`
Sama seperti endpoint publik, tapi menampilkan **semua status**. Query tambahan: `status=draft|published|archived`.

#### `GET /api/admin/products/:id`
Detail satu produk berdasarkan **id** (untuk form edit). Response: `{ "data": { /* Product */ } }`

#### `POST /api/admin/products`
**`multipart/form-data`**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | text | Ya | Maks 150 karakter |
| `brand` | text | Ya | Maks 100 karakter |
| `quantity` | number | Ya | Berat/volume, lebih dari 0 |
| `unit` | text | Ya | `gram` atau `ml` |
| `country` | text | Ya | Negara asal, maks 100 karakter |
| `category_id` | number | Ya | id kategori yang valid |
| `status` | text | Tidak | `draft` (default), `published`, `archived` |
| `description` | text | Tidak | |
| `image` | file | Tidak | JPG / PNG / WebP, maks **2 MB** |

Sukses: `201` `{ "message": "Produk berhasil ditambahkan", "data": { /* Product */ } }`

Contoh:

```js
const fd = new FormData();
fd.append('name', 'Indomie Goreng');
fd.append('brand', 'Indomie');
fd.append('quantity', '85');
fd.append('unit', 'gram');
fd.append('country', 'Indonesia');
fd.append('category_id', '4');
fd.append('status', 'published');
fd.append('description', 'Mie instan rasa goreng');
if (file) fd.append('image', file); // file dari <input type="file">

await api('/api/admin/products', { method: 'POST', body: fd });
```

#### `PUT /api/admin/products/:id`
`multipart/form-data`, **semua field wajib dikirim ulang** seperti POST (bukan partial update). Tambahan:

- Kirim `image` baru untuk **mengganti** gambar (gambar lama otomatis dihapus dari server).
- Kirim `remove_image=true` untuk **menghapus** gambar tanpa menggantinya.
- Tidak kirim keduanya: gambar lama tetap.

Sukses: `200` `{ "message": "Produk berhasil diperbarui", "data": { /* Product */ } }`

Tips untuk form edit: isi form dengan hasil `GET /api/admin/products/:id`, lalu kirim ulang semua field saat submit.

#### `DELETE /api/admin/products/:id`
Menghapus produk beserta file gambarnya. Response: `{ "message": "Produk berhasil dihapus" }`

---

## 5. Bentuk Data

### Product

```json
{
  "id": 12,
  "name": "Indomie Goreng",
  "slug": "indomie-goreng",
  "brand": "Indomie",
  "quantity": 85,
  "unit": "gram",
  "country": "Indonesia",
  "description": "Mie instan rasa goreng",
  "image": "1730000000000-8f3c...-.jpg",
  "image_url": "/uploads/1730000000000-8f3c...-.jpg",
  "status": "published",
  "category": { "id": 4, "name": "Makanan Instan", "slug": "makanan-instan" },
  "created_at": "2026-11-02T08:00:00.000Z",
  "updated_at": "2026-11-02T08:00:00.000Z"
}
```

- `image` dan `image_url` bernilai `null` kalau produk tidak punya gambar.
- `quantity` bertipe number, `unit` hanya `gram` atau `ml`.
- `slug` dibuat otomatis dari nama (unik) dan dipakai untuk URL detail publik.

---

## 6. Format Error

Semua error berbentuk:

```json
{ "message": "Pesan error yang bisa ditampilkan ke user" }
```

Khusus validasi (`400`) ada tambahan array:

```json
{
  "message": "Validasi gagal",
  "errors": [
    "Nama produk wajib diisi (maks 150 karakter)",
    "Satuan harus 'gram' atau 'ml'"
  ]
}
```

| Status | Arti |
|---|---|
| `400` | Input tidak valid (cek `errors`), format gambar salah, dll. |
| `401` | Belum login / sesi habis / login salah |
| `404` | Data atau endpoint tidak ditemukan |
| `409` | Konflik (kategori masih dipakai produk, data duplikat) |
| `429` | Terlalu banyak percobaan login |
| `500` | Error server |

---

## 7. Halaman yang Perlu Dibuat di Frontend

**Publik**
- Katalog produk: grid produk, search (nama/brand), filter kategori, pagination
- Detail produk: gambar, nama, brand, berat/volume + satuan, negara asal, kategori, deskripsi

**Admin** (semua di belakang login)
- Login
- Daftar produk: tabel dengan filter status, tombol tambah/edit/hapus
- Form tambah/edit produk: termasuk upload dan preview gambar
- Manajemen kategori: tambah, ubah nama, hapus

**Batasan:** tidak ada keranjang, checkout, pembayaran, pesanan, atau akun pelanggan.

---

## 8. Prompt Siap Pakai untuk AI Frontend

Kalau FE dibuat pakai AI, tempel README ini lalu tambahkan:

> Buatkan frontend React (Vite) untuk API di README ini. Gunakan path relatif `/api/...`, `credentials: 'include'` untuk semua request, `FormData` tanpa header Content-Type manual untuk create/update produk, dan proteksi halaman admin dengan `GET /api/auth/me`. Tampilkan pesan error dari field `message` dan `errors` dari response. Buat halaman publik dan admin sesuai bagian 7.