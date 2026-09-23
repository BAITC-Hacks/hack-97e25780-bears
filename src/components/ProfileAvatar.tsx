import React from 'react';

export function ProfileAvatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  return <span aria-hidden="true" className="w-10 h-10 flex-shrink-0 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center text-sm font-bold">{initials}</span>;
}
