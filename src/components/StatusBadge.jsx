import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;

  switch (status.toLowerCase()) {
    case 'published':
      return <span className="badge badge-published">● Published</span>;
    case 'draft':
      return <span className="badge badge-draft">● Draft</span>;
    case 'archived':
      return <span className="badge badge-archived">● Archived</span>;
    default:
      return <span className="badge">{status}</span>;
  }
}

export function AvailabilityBadge({ availability }) {
  if (!availability) return null;

  switch (availability.toLowerCase()) {
    case 'available':
      return <span className="badge badge-available">In Stock</span>;
    case 'unavailable':
      return <span className="badge badge-unavailable">Out of Stock</span>;
    default:
      return <span className="badge">{availability}</span>;
  }
}
