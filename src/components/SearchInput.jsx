import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search products by name or brand...',
  debounceMs = 350,
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="search-input-box">
      <Search size={16} className="search-input-icon" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
