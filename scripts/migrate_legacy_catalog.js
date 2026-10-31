/**
 * Toko Aysha — Legacy Product Catalog Migration Script
 * 
 * Safely prepares and imports legacy catalog data from src/data/products.js
 * into the Supabase database schema.
 * 
 * Enforces Business Rules:
 * 1. Idempotent: Checks slugs before inserting to prevent duplicates.
 * 2. Unverified records are set to status = 'draft' by default.
 *    Only products reviewed by the administrator will be published.
 * 3. Dry-run mode by default for verification and safety.
 * 
 * Usage:
 *   node scripts/migrate_legacy_catalog.js --dry-run
 *   node scripts/migrate_legacy_catalog.js --execute
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load legacy dataset from Toko Aysha Asian Market
const productsPath = path.resolve(__dirname, '../../Toko Aysha Asian Market/src/data/products.js');
const categoriesPath = path.resolve(__dirname, '../../Toko Aysha Asian Market/src/data/categories.js');

if (!fs.existsSync(productsPath)) {
  console.error('Error: Legacy products dataset not found at:', productsPath);
  process.exit(1);
}

const { products } = await import(pathToFileURL(productsPath).href);
const { categories } = await import(pathToFileURL(categoriesPath).href);

// 2. Command Line Arguments
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

console.log('================================================================');
console.log('TOKO AYSHA — PRODUCT CATALOG MIGRATION AUDIT & IMPORT');
console.log(`Execution Mode: ${isExecute ? 'EXECUTE (Writing to DB)' : 'DRY RUN (Preview Only)'}`);
console.log('================================================================\n');

// 3. Inspect and Audit Legacy Records
const report = {
  totalRecords: products.length,
  categoriesCount: {},
  originsCount: {},
  recordsEligible: 0,
  recordsRequiringVerification: 0,
  potentialDuplicates: [],
  missingFields: [],
  willRemainDraft: 0,
};

const seenSlugs = new Set();

products.forEach((p, idx) => {
  // Category count
  report.categoriesCount[p.category] = (report.categoriesCount[p.category] || 0) + 1;

  // Origin count
  const origin = p.origin || 'Unknown';
  report.originsCount[origin] = (report.originsCount[origin] || 0) + 1;

  // Slug check
  const slug = p.id;
  if (seenSlugs.has(slug)) {
    report.potentialDuplicates.push({ index: idx, id: p.id, name: p.name });
  } else {
    seenSlugs.add(slug);
  }

  // Missing fields check
  const missing = [];
  if (!p.name) missing.push('name');
  if (!p.category) missing.push('category');
  if (!p.origin) missing.push('origin');
  if (!p.image) missing.push('image');
  if (missing.length > 0) {
    report.missingFields.push({ id: p.id, missing });
  }

  // All legacy records require physical store stock verification before live publication
  report.recordsRequiringVerification++;
  report.willRemainDraft++;
  report.recordsEligible++;
});

// 4. Print Dry Run Report
console.log('----------------------------------------------------------------');
console.log('MIGRATION INVENTORY AUDIT REPORT');
console.log('----------------------------------------------------------------');
console.log(`• Total Legacy Records Found:          ${report.totalRecords}`);
console.log(`• Records Eligible for Migration:      ${report.recordsEligible}`);
console.log(`• Records Requiring Store Verification:${report.recordsRequiringVerification}`);
console.log(`• Records Remaining as Drafts:        ${report.willRemainDraft} (100% of unverified records)`);
console.log(`• Potential Duplicates Detected:       ${report.potentialDuplicates.length}`);
console.log(`• Records with Missing Core Fields:    ${report.missingFields.length}`);

console.log('\nCategory Breakdown:');
Object.entries(report.categoriesCount).forEach(([cat, count]) => {
  console.log(`  - ${cat.padEnd(25)}: ${count} products`);
});

console.log('\nCountry Origin Breakdown:');
Object.entries(report.originsCount).forEach(([orig, count]) => {
  console.log(`  - ${orig.padEnd(20)}: ${count} products`);
});

if (isDryRun) {
  console.log('\n----------------------------------------------------------------');
  console.log('DRY RUN COMPLETED.');
  console.log('To execute this migration against your Supabase project:');
  console.log('1. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  console.log('2. Run: node scripts/migrate_legacy_catalog.js --execute');
  console.log('----------------------------------------------------------------\n');
  process.exit(0);
}

// 5. Execution Logic (requires configured Supabase credentials)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\nError: Supabase environment variables not found for execution.');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running with --execute.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\nConnecting to Supabase and fetching reference IDs...');

// Fetch country mapping
const { data: dbCountries, error: countryErr } = await supabase.from('countries').select('id, name, slug');
if (countryErr) {
  console.error('Failed to fetch countries from database:', countryErr.message);
  process.exit(1);
}

// Fetch category mapping
const { data: dbCategories, error: catErr } = await supabase.from('categories').select('id, name, slug');
if (catErr) {
  console.error('Failed to fetch categories from database:', catErr.message);
  process.exit(1);
}

const countryMap = new Map();
dbCountries.forEach(c => {
  countryMap.set(c.name.toLowerCase(), c.id);
  countryMap.set(c.slug.toLowerCase(), c.id);
});

const categoryMap = new Map();
dbCategories.forEach(cat => {
  categoryMap.set(cat.slug.toLowerCase(), cat.id);
  categoryMap.set(cat.name.toLowerCase(), cat.id);
});

// Default fallback category if unknown
const defaultCategoryId = dbCategories.find(c => c.slug === 'other-products')?.id || dbCategories[0]?.id;
const defaultCountryId = dbCountries.find(c => c.slug === 'indonesia')?.id || dbCountries[0]?.id;

console.log(`Starting migration of ${products.length} records into 'draft' status...`);

let insertedCount = 0;
let skippedCount = 0;

for (const p of products) {
  const slug = p.id;

  // Check if product with this slug already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    skippedCount++;
    continue;
  }

  const countryId = countryMap.get(p.origin?.toLowerCase()) || defaultCountryId;
  const categoryId = categoryMap.get(p.category?.toLowerCase()) || defaultCategoryId;

  const row = {
    name: p.name,
    slug: slug,
    brand: p.brand || null,
    package_size: p.packageSize || null,
    description: p.description || null,
    ingredients: p.ingredients || null,
    allergens: p.allergens || null,
    preparation: p.preparation || null,
    country_id: countryId,
    category_id: categoryId,
    image_path: p.image || null,
    availability: p.inStock ? 'available' : 'unavailable',
    status: 'draft', // Critical rule: imported as draft pending manual verification
    featured: Boolean(p.featured),
    is_new: Boolean(p.isNew),
    price: null,
  };

  const { error: insertErr } = await supabase.from('products').insert([row]);
  if (insertErr) {
    console.error(`Failed to insert product [${slug}]:`, insertErr.message);
  } else {
    insertedCount++;
  }
}

console.log('\n================================================================');
console.log('MIGRATION EXECUTION SUMMARY:');
console.log(`• Successfully Inserted: ${insertedCount} draft products`);
console.log(`• Already Existed/Skipped: ${skippedCount} products`);
console.log('================================================================\n');
