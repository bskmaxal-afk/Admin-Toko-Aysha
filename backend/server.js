/**
 * ============================================================
 *  Product Catalog CMS - Backend (Express, single file)
 * ============================================================
 *
 * SETUP
 *   1. Jalankan SQL schema kamu di MySQL/MariaDB (product_catalog_cms).
 *   2. npm init -y
 *      npm i express mysql2 bcryptjs jsonwebtoken cookie-parser multer helmet express-rate-limit dotenv
 *   3. Buat file .env di folder yang sama:
 *
 *        PORT=3000
 *        DB_HOST=localhost
 *        DB_PORT=3306
 *        DB_USER=root
 *        DB_PASSWORD=
 *        DB_NAME=product_catalog_cms
 *        JWT_SECRET=isi_dengan_string_acak_panjang_minimal_32_karakter
 *        ADMIN_USERNAME=admin
 *        ADMIN_PASSWORD=GantiPasswordIni123
 *        COOKIE_SECURE=false      # ubah ke true kalau sudah pakai HTTPS
 *
 *   4. node server.js
 *
 * Admin pertama otomatis dibuat dari ADMIN_USERNAME & ADMIN_PASSWORD
 * kalau tabel admins masih kosong (password disimpan dalam bentuk hash bcrypt).
 *
 * Kalau folder client/dist (hasil build React) ada, server ini otomatis
 * menyajikannya, jadi frontend + backend jalan dari satu server (monolith).
 */

'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/* ------------------------------------------------------------
 * CONFIG
 * ---------------------------------------------------------- */
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'token';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const BCRYPT_ROUNDS = 12;

const STATUSES = ['draft', 'published', 'archived'];
const UNITS = ['gram', 'ml'];

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('[FATAL] JWT_SECRET belum diset di .env (minimal 16 karakter).');
  process.exit(1);
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'product_catalog_cms',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  decimalNumbers: true, // DECIMAL dikembalikan sebagai number
});

// Hash dummy supaya waktu respon login relatif sama walau username tidak ada
const DUMMY_HASH = bcrypt.hashSync('dummy-password-not-used', BCRYPT_ROUNDS);

/* ------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------- */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const h = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Data tidak ditemukan');
  return id;
}

function slugify(text) {
  return (
    String(text)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'item'
  );
}

// table hanya diisi konstanta internal ('products' / 'categories'), bukan input user
async function uniqueSlug(table, base, excludeId = null) {
  let slug = base;
  let i = 1;
  for (;;) {
    const sql = `SELECT id FROM ${table} WHERE slug = ?${excludeId ? ' AND id <> ?' : ''} LIMIT 1`;
    const [rows] = await pool.query(sql, excludeId ? [slug, excludeId] : [slug]);
    if (!rows.length) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

/* ------------------------------------------------------------
 * UPLOAD GAMBAR
 * Nama file asli TIDAK dipakai: selalu di-rename jadi UUID acak.
 * ---------------------------------------------------------- */
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomUUID()}${MIME_EXT[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (MIME_EXT[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'Format gambar harus JPG, PNG, atau WebP'));
  },
});

// Cek magic bytes supaya file palsu (mis. .exe diganti mimetype) ditolak
function isRealImage(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpg || png || webp;
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(UPLOAD_DIR, path.basename(filename)), () => {});
}

// Wrapper: kalau handler gagal, file yang barusan diupload ikut dihapus
const withUpload = (handler) =>
  h(async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      if (req.file) removeFile(req.file.filename);
      throw err;
    }
  });

/* ------------------------------------------------------------
 * FORMATTER & QUERY PRODUK
 * ---------------------------------------------------------- */
const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

const fmtProduct = (r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  brand: r.brand,
  quantity: r.quantity,
  unit: r.unit,
  country: r.country,
  description: r.description,
  image: r.image,
  image_url: r.image ? `/uploads/${r.image}` : null,
  status: r.status,
  category: { id: r.category_id, name: r.category_name, slug: r.category_slug },
  created_at: r.created_at,
  updated_at: r.updated_at,
});

async function getProductById(id) {
  const [rows] = await pool.query(`${PRODUCT_SELECT} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listProducts(query, { publicOnly }) {
  const where = [];
  const params = [];

  if (publicOnly) {
    where.push("p.status = 'published'");
  } else if (STATUSES.includes(str(query.status))) {
    where.push('p.status = ?');
    params.push(str(query.status));
  }

  const search = str(query.search);
  if (search) {
    const like = `%${escapeLike(search)}%`;
    where.push('(p.name LIKE ? OR p.brand LIKE ?)');
    params.push(like, like);
  }

  const category = str(query.category);
  if (category) {
    if (/^\d+$/.test(category)) {
      where.push('p.category_id = ?');
      params.push(Number(category));
    } else {
      where.push('c.slug = ?');
      params.push(category);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `${PRODUCT_SELECT} ${whereSql} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows.map(fmtProduct),
    meta: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

function validateProduct(b) {
  const errors = [];
  const name = str(b.name);
  const brand = str(b.brand);
  const country = str(b.country);
  const description = str(b.description) || null;
  const category_id = Number(b.category_id);
  const quantity = Number(b.quantity);
  const unit = str(b.unit);
  const status = str(b.status) || 'draft';

  if (!name || name.length > 150) errors.push('Nama produk wajib diisi (maks 150 karakter)');
  if (!brand || brand.length > 100) errors.push('Brand wajib diisi (maks 100 karakter)');
  if (!country || country.length > 100) errors.push('Negara asal wajib diisi (maks 100 karakter)');
  if (!Number.isInteger(category_id) || category_id < 1) errors.push('Kategori tidak valid');
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 99999999.99)
    errors.push('Berat/volume harus berupa angka lebih dari 0');
  if (!UNITS.includes(unit)) errors.push("Satuan harus 'gram' atau 'ml'");
  if (!STATUSES.includes(status)) errors.push("Status harus 'draft', 'published', atau 'archived'");

  return {
    errors,
    data: { name, brand, country, description, category_id, quantity, unit, status },
  };
}

/* ------------------------------------------------------------
 * APP
 * ---------------------------------------------------------- */
const app = express();
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

/* ------------------------------------------------------------
 * AUTH
 * ---------------------------------------------------------- */
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
});

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return next(new HttpError(401, 'Silakan login terlebih dahulu'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    next(new HttpError(401, 'Sesi tidak valid atau sudah berakhir'));
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

const authRouter = express.Router();

authRouter.post(
  '/login',
  loginLimiter,
  h(async (req, res) => {
    const username = str(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!username || !password) throw new HttpError(400, 'Username dan password wajib diisi');

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin ? admin.password : DUMMY_HASH);
    if (!admin || !ok) throw new HttpError(401, 'Username atau password salah');

    const token = jwt.sign({ sub: admin.id, username: admin.username }, JWT_SECRET, {
      expiresIn: '8h',
    });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({ message: 'Login berhasil', admin: { id: admin.id, username: admin.username } });
  })
);

authRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logout berhasil' });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

authRouter.post(
  '/change-password',
  requireAuth,
  h(async (req, res) => {
    const current = typeof req.body.current_password === 'string' ? req.body.current_password : '';
    const next = typeof req.body.new_password === 'string' ? req.body.new_password : '';
    if (!current || next.length < 8)
      throw new HttpError(400, 'Password lama wajib diisi dan password baru minimal 8 karakter');

    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    if (!rows[0] || !(await bcrypt.compare(current, rows[0].password)))
      throw new HttpError(401, 'Password lama salah');

    const hash = await bcrypt.hash(next, BCRYPT_ROUNDS);
    await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hash, req.admin.id]);
    res.json({ message: 'Password berhasil diubah' });
  })
);

app.use('/api/auth', authRouter);

/* ------------------------------------------------------------
 * PUBLIC API (tanpa login)
 * ---------------------------------------------------------- */
const publicRouter = express.Router();

publicRouter.get(
  '/categories',
  h(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'published'
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json({ data: rows });
  })
);

publicRouter.get(
  '/products',
  h(async (req, res) => {
    res.json(await listProducts(req.query, { publicOnly: true }));
  })
);

publicRouter.get(
  '/products/:slug',
  h(async (req, res) => {
    const [rows] = await pool.query(
      `${PRODUCT_SELECT} WHERE p.slug = ? AND p.status = 'published' LIMIT 1`,
      [req.params.slug]
    );
    if (!rows[0]) throw new HttpError(404, 'Produk tidak ditemukan');
    res.json({ data: fmtProduct(rows[0]) });
  })
);

app.use('/api', publicRouter);

/* ------------------------------------------------------------
 * ADMIN API (wajib login)
 * ---------------------------------------------------------- */
const adminRouter = express.Router();
adminRouter.use(requireAuth);

/* ---- Kategori ---- */
adminRouter.get(
  '/categories',
  h(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json({ data: rows });
  })
);

adminRouter.post(
  '/categories',
  h(async (req, res) => {
    const name = str(req.body.name);
    if (!name || name.length > 100)
      throw new HttpError(400, 'Nama kategori wajib diisi (maks 100 karakter)');

    const slug = await uniqueSlug('categories', slugify(name));
    const [result] = await pool.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [
      name,
      slug,
    ]);
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Kategori berhasil ditambahkan', data: rows[0] });
  })
);

adminRouter.put(
  '/categories/:id',
  h(async (req, res) => {
    const id = parseId(req.params.id);
    const name = str(req.body.name);
    if (!name || name.length > 100)
      throw new HttpError(400, 'Nama kategori wajib diisi (maks 100 karakter)');

    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing[0]) throw new HttpError(404, 'Kategori tidak ditemukan');

    const slug =
      existing[0].name === name ? existing[0].slug : await uniqueSlug('categories', slugify(name), id);
    await pool.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Kategori berhasil diperbarui', data: rows[0] });
  })
);

adminRouter.delete(
  '/categories/:id',
  h(async (req, res) => {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (!result.affectedRows) throw new HttpError(404, 'Kategori tidak ditemukan');
    res.json({ message: 'Kategori berhasil dihapus' });
  })
);

/* ---- Produk ---- */
adminRouter.get(
  '/products',
  h(async (req, res) => {
    res.json(await listProducts(req.query, { publicOnly: false }));
  })
);

adminRouter.get(
  '/products/:id',
  h(async (req, res) => {
    const row = await getProductById(parseId(req.params.id));
    if (!row) throw new HttpError(404, 'Produk tidak ditemukan');
    res.json({ data: fmtProduct(row) });
  })
);

// multipart/form-data, field gambar: "image"
adminRouter.post(
  '/products',
  upload.single('image'),
  withUpload(async (req, res) => {
    if (req.file && !isRealImage(req.file.path))
      throw new HttpError(400, 'File yang diupload bukan gambar yang valid');

    const { errors, data } = validateProduct(req.body);
    if (errors.length) throw new HttpError(400, 'Validasi gagal', errors);

    const slug = await uniqueSlug('products', slugify(data.name));
    const [result] = await pool.query(
      `INSERT INTO products
        (category_id, name, slug, brand, quantity, unit, country, description, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_id,
        data.name,
        slug,
        data.brand,
        data.quantity,
        data.unit,
        data.country,
        data.description,
        req.file ? req.file.filename : null,
        data.status,
      ]
    );
    const row = await getProductById(result.insertId);
    res.status(201).json({ message: 'Produk berhasil ditambahkan', data: fmtProduct(row) });
  })
);

// Kirim field "image" untuk ganti gambar, atau remove_image=true untuk hapus gambar
adminRouter.put(
  '/products/:id',
  upload.single('image'),
  withUpload(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await getProductById(id);
    if (!existing) throw new HttpError(404, 'Produk tidak ditemukan');

    if (req.file && !isRealImage(req.file.path))
      throw new HttpError(400, 'File yang diupload bukan gambar yang valid');

    const { errors, data } = validateProduct(req.body);
    if (errors.length) throw new HttpError(400, 'Validasi gagal', errors);

    const slug =
      existing.name === data.name
        ? existing.slug
        : await uniqueSlug('products', slugify(data.name), id);

    let image = existing.image;
    if (req.file) image = req.file.filename;
    else if (str(req.body.remove_image) === 'true') image = null;

    await pool.query(
      `UPDATE products SET
         category_id = ?, name = ?, slug = ?, brand = ?, quantity = ?, unit = ?,
         country = ?, description = ?, image = ?, status = ?
       WHERE id = ?`,
      [
        data.category_id,
        data.name,
        slug,
        data.brand,
        data.quantity,
        data.unit,
        data.country,
        data.description,
        image,
        data.status,
        id,
      ]
    );

    if (existing.image && existing.image !== image) removeFile(existing.image);

    const row = await getProductById(id);
    res.json({ message: 'Produk berhasil diperbarui', data: fmtProduct(row) });
  })
);

adminRouter.delete(
  '/products/:id',
  h(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await getProductById(id);
    if (!existing) throw new HttpError(404, 'Produk tidak ditemukan');

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    removeFile(existing.image);
    res.json({ message: 'Produk berhasil dihapus' });
  })
);

app.use('/api/admin', adminRouter);

/* ------------------------------------------------------------
 * 404 API + SERVE REACT BUILD (monolith)
 * ---------------------------------------------------------- */
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

/* ------------------------------------------------------------
 * ERROR HANDLER
 * ---------------------------------------------------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ message: err.message, ...(err.details ? { errors: err.details } : {}) });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 2 MB' : `Upload gagal: ${err.message}`;
    return res.status(400).json({ message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON tidak valid' });
  }
  switch (err.code) {
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ message: 'Kategori tidak ditemukan' });
    case 'ER_ROW_IS_REFERENCED_2':
      return res
        .status(409)
        .json({ message: 'Kategori masih dipakai oleh produk, pindahkan atau hapus produknya dulu' });
    case 'ER_DUP_ENTRY':
      return res.status(409).json({ message: 'Data duplikat, coba gunakan nama lain' });
    default:
      console.error(err);
      return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

/* ------------------------------------------------------------
 * STARTUP
 * ---------------------------------------------------------- */
async function seedAdmin() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM admins');
  if (total > 0) return;

  const username = str(process.env.ADMIN_USERNAME);
  const password = process.env.ADMIN_PASSWORD || '';
  if (!username || password.length < 8) {
    console.warn(
      '[WARN] Belum ada admin. Set ADMIN_USERNAME dan ADMIN_PASSWORD (min 8 karakter) di .env lalu restart.'
    );
    return;
  }
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await pool.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hash]);
  console.log(`[INFO] Admin pertama dibuat: "${username}"`);
}

(async () => {
  try {
    await pool.query('SELECT 1');
    await seedAdmin();
    app.listen(PORT, () => console.log(`[INFO] Server jalan di http://localhost:${PORT}`));
  } catch (err) {
    console.error('[FATAL] Gagal start server:', err.message);
    process.exit(1);
  }
})();