import React from 'react';
import { RotateCcw } from 'lucide-react';
import SearchInput from './SearchInput';

export default function FilterBar({
  search,
  onSearchChange,
  countries = [],
  countryId,
  onCountryChange,
  categories = [],
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  showStatusFilter = true,
  availability,
  onAvailabilityChange,
  sortBy,
  onSortChange,
  onReset,
}) {
  const hasActiveFilters = Boolean(
    search || 
    (countryId && countryId !== 'all') || 
    (categoryId && categoryId !== 'all') || 
    (status && status !== 'active' && status !== 'all') || 
    (availability && availability !== 'all')
  );

  return (
    <div className="filter-bar card">
      <SearchInput value={search} onChange={onSearchChange} />

      {/* Country of Origin Filter */}
      <select
        className="select-filter"
        value={countryId || 'all'}
        onChange={(e) => onCountryChange(e.target.value)}
        title="Filter by Country of Origin"
      >
        <option value="all">All Origins</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.flag_emoji || '🌏'} {c.name}
          </option>
        ))}
      </select>

      {/* Category Filter */}
      <select
        className="select-filter"
        value={categoryId || 'all'}
        onChange={(e) => onCategoryChange(e.target.value)}
        title="Filter by Product Category"
      >
        <option value="all">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Publication Status Filter */}
      {showStatusFilter && (
        <select
          className="select-filter"
          value={status || 'active'}
          onChange={(e) => onStatusChange(e.target.value)}
          title="Filter by Publication Status"
        >
          <option value="active">Active (Published & Draft)</option>
          <option value="published">Published Only</option>
          <option value="draft">Draft Only</option>
          <option value="all">All Records</option>
        </select>
      )}

      {/* Availability Filter */}
      {onAvailabilityChange && (
        <select
          className="select-filter"
          value={availability || 'all'}
          onChange={(e) => onAvailabilityChange(e.target.value)}
          title="Filter by Stock Availability"
        >
          <option value="all">All Stock Status</option>
          <option value="available">In Stock</option>
          <option value="unavailable">Out of Stock</option>
        </select>
      )}

      {/* Sort By */}
      {onSortChange && (
        <select
          className="select-filter"
          value={sortBy || 'updated_at_desc'}
          onChange={(e) => onSortChange(e.target.value)}
          title="Sort Products"
        >
          <option value="updated_at_desc">Recently Updated</option>
          <option value="name_asc">Name (A — Z)</option>
          <option value="name_desc">Name (Z — A)</option>
        </select>
      )}

      {/* Reset Filter Button */}
      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          <RotateCcw size={14} />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
