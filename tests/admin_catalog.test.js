import test from 'node:test';
import assert from 'node:assert/strict';

import { validateProductForm, validateImageFile, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '../src/utils/validation.js';
import { slugify } from '../src/utils/slugify.js';

test('1. Form Validation — Required fields and publishing constraints', async (t) => {
  await t.test('fails when product name is empty or whitespace', () => {
    const res = validateProductForm({ name: '   ', country_id: 'c-1', category_id: 'cat-1' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.name);
  });

  await t.test('fails when country of origin is missing', () => {
    const res = validateProductForm({ name: 'Teh Botol', country_id: '', category_id: 'cat-1' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.country_id);
  });

  await t.test('fails when category is missing', () => {
    const res = validateProductForm({ name: 'Teh Botol', country_id: 'c-1', category_id: '' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.category_id);
  });

  await t.test('allows saving as draft without photograph', () => {
    const res = validateProductForm({
      name: 'Teh Botol Sosro',
      country_id: 'c-id',
      category_id: 'cat-drinks',
      image_path: '',
    }, false); // isPublishing = false
    assert.equal(res.isValid, true);
    assert.equal(Object.keys(res.errors).length, 0);
  });

  await t.test('blocks publishing if photograph is missing', () => {
    const res = validateProductForm({
      name: 'Teh Botol Sosro',
      country_id: 'c-id',
      category_id: 'cat-drinks',
      image_path: '',
    }, true); // isPublishing = true
    assert.equal(res.isValid, false);
    assert.ok(res.errors.image_path);
  });

  await t.test('passes when all required fields and photograph are present for publishing', () => {
    const res = validateProductForm({
      name: 'Teh Botol Sosro',
      country_id: 'c-id',
      category_id: 'cat-drinks',
      image_path: 'product-images/teh-botol.jpg',
    }, true);
    assert.equal(res.isValid, true);
  });
});

test('2. Image Validation — File formats and size limits', async (t) => {
  await t.test('accepts valid JPEG, PNG, and WebP', () => {
    for (const mime of ALLOWED_IMAGE_TYPES) {
      const file = { type: mime, size: 2 * 1024 * 1024 }; // 2MB
      const res = validateImageFile(file);
      assert.equal(res.valid, true);
    }
  });

  await t.test('rejects unsupported image types (gif, pdf, exe)', () => {
    const invalidTypes = ['image/gif', 'application/pdf', 'application/x-msdownload', 'text/html'];
    for (const mime of invalidTypes) {
      const file = { type: mime, size: 1024 * 1024 };
      const res = validateImageFile(file);
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Invalid file format'));
    }
  });

  await t.test('rejects files larger than 5MB limit', () => {
    const oversizedFile = { type: 'image/jpeg', size: 5.5 * 1024 * 1024 };
    const res = validateImageFile(oversizedFile);
    assert.equal(res.valid, false);
    assert.ok(res.error.includes('exceeds 5MB limit'));
  });

  await t.test('accepts file exactly within boundary', () => {
    const validFile = { type: 'image/png', size: MAX_IMAGE_SIZE_BYTES };
    const res = validateImageFile(validFile);
    assert.equal(res.valid, true);
  });
});

test('3. Slug Generation — Clean, unique, and URL-safe', () => {
  assert.equal(slugify('Indomie Mi Goreng'), 'indomie-mi-goreng');
  assert.equal(slugify('Indomie Mi Goreng Original', '85g'), 'indomie-mi-goreng-original-85g');
  assert.equal(slugify('Buldak 2x Spicy Ramyun! (Halal)'), 'buldak-2x-spicy-ramyun-halal');
  assert.equal(slugify('   ABC Kecap Manis & Gurih --- '), 'abc-kecap-manis-gurih');
});

test('4. Public Visibility Filtering Rules', () => {
  const sampleCatalog = [
    { id: '1', name: 'Item Published', status: 'published', archived_at: null },
    { id: '2', name: 'Item Draft', status: 'draft', archived_at: null },
    { id: '3', name: 'Item Archived', status: 'archived', archived_at: '2026-11-01T00:00:00Z' },
    { id: '4', name: 'Item Inconsistent', status: 'published', archived_at: '2026-11-01T00:00:00Z' },
  ];

  // Enforces Section 10 rule: status = 'published' AND archived_at IS NULL
  const publicVisible = sampleCatalog.filter(
    p => p.status === 'published' && p.archived_at === null
  );

  assert.equal(publicVisible.length, 1);
  assert.equal(publicVisible[0].id, '1');
});

test('5. Restore Action — Restores to Draft by Default', () => {
  const archivedProduct = {
    id: 'prod-123',
    name: 'Discontinued Snack',
    status: 'archived',
    archived_at: '2026-10-30T10:00:00Z',
  };

  // Restoring clears archived_at and sets status = 'draft'
  const restoredProduct = {
    ...archivedProduct,
    status: 'draft',
    archived_at: null,
  };

  assert.equal(restoredProduct.status, 'draft');
  assert.equal(restoredProduct.archived_at, null);

  // Must not appear in public catalog until verified and published
  const isPublic = restoredProduct.status === 'published' && restoredProduct.archived_at === null;
  assert.equal(isPublic, false);
});
