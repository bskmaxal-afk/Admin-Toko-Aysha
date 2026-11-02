# Toko Aysha — Backend Architecture & Handover Documentation

Dokumen ini ditujukan untuk **Tim Backend Engineer** yang mengelola database, autentikasi, dan penyimpanan media untuk ekosistem **Toko Aysha Asian Market**.

---

## 1. Arsitektur Sistem

Ekosistem Toko Aysha terdiri dari dua frontend independen yang terhubung ke satu backend terpusat:

1. **Public Storefront** (`Toko Aysha Asian Market`):
   - Host: [https://toko-aysha.vercel.app](https://toko-aysha.vercel.app)
   - Akses: Publik / Read-Only (`SELECT`) hanya untuk produk dengan `status = 'published'` dan `archived_at IS NULL`.
2. **Admin Dashboard** (`Admin Toko Aysha`):
   - Akses: Terautentikasi (Admin). Operasi penuh CRUD produk, upload foto, manajemen kategori, negara, dan arsip (*soft-delete*).

---

## 2. Struktur Database & File Migrasi SQL

Seluruh skrip SQL PostgreSQL yang sudah teruji dan siap dieksekusi berada di folder:
📂 `supabase/migrations/`

| File Migrasi | Deskripsi & Fungsi |
|---|---|
| `20261101_001_initial_schema.sql` | Membuat tabel `countries`, `categories`, `admin_users`, dan `products`. Menyiapkan trigger otomatis untuk `updated_at`, `published_at`, dan `archived_at`, serta fungsi verifikasi role `public.is_admin()`. |
| `20261101_002_security_rls.sql` | Mengaktifkan **Row Level Security (RLS)**. Publik hanya membaca produk yang terbit; operasi tulis dibatasi ketat hanya untuk admin yang terverifikasi di server. |
| `20261101_003_storage_setup.sql` | Menyiapkan bucket Storage `product-images` (maks. 5MB, format JPEG/PNG/WebP). Publik dapat membaca gambar, sedangkan write/delete wajib `is_admin()`. |
| `20261101_004_seed_data.sql` | Memasukkan data awal 12 negara asal Asia dan 11 kategori produk Toko Aysha. |

---

## 3. Langkah Cepat Deployment Backend (Supabase)

### Langkah A: Eksekusi Migrasi SQL
Buka **SQL Editor** pada project Supabase Anda, lalu jalankan file di atas secara berurutan (001 sampai 004).

### Langkah B: Daftarkan Akun Administrator
1. Di Supabase Dashboard, masuk ke **Authentication** -> **Users** -> **Add User**.
2. Masukkan email dan password admin, centang **Auto Confirm User**.
3. Salin User `UUID` yang dihasilkan, lalu jalankan query ini di SQL Editor:
   ```sql
   INSERT INTO public.admin_users (id, email, role)
   VALUES ('<PASTE_USER_UUID>', '<PASTE_USER_EMAIL>', 'admin');
   ```

### Langkah C: Konfigurasi File `.env`
Di folder `Admin Toko Aysha` dan `Toko Aysha Asian Market`, isi file `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
VITE_PUBLIC_WEBSITE_URL=https://toko-aysha.vercel.app
```
*Catatan: Begitu `.env` diisi, frontend secara otomatis beralih dari Local Preview Mode ke database Supabase cloud tanpa perlu mengubah kode.*

---

## 4. Migrasi Katalog Warisan (153 Produk)

Toko Aysha memiliki 153 data produk lama di `src/data/products.js`. Sesuai aturan bisnis, **seluruh produk lama ini wajib masuk ke status `draft` terlebih dahulu** agar admin fisik toko bisa memverifikasi ketersediaan stok aslinya sebelum diterbitkan.

Untuk mengeksekusi migrasi dari laptop:
```bash
# Preview audit data:
node scripts/migrate_legacy_catalog.js --dry-run

# Eksekusi insert ke database:
node scripts/migrate_legacy_catalog.js --execute
```
*(Skrip ini bersifat idempoten: jika dijalankan berulang kali, produk yang slug-nya sudah ada tidak akan diduplikasi).*

---

## 5. Kontak / Catatan Teknis Frontend
- Frontend mengadopsi skema dual-mode: jika `.env` belum terhubung, aplikasi berjalan di **Local Preview Mode** (menggunakan Base64 data URL untuk gambar dan localStorage untuk produk) sehingga admin tetap bisa mencoba form tanpa terblokir error backend.
- Hubungi tim developer jika ingin menyesuaikan REST API alternatif selain Supabase.
