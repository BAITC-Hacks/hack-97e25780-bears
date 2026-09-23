import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function ModalFrame({ title, onClose, busy = false, children }: {
  title: string; onClose: () => void; busy?: boolean; children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);
  const closeRef = useRef(onClose);
  busyRef.current = busy;
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) closeRef.current();
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]'));
      const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-[#161720] border border-white/10 shadow-2xl outline-none">
        <div className="sticky top-0 z-10 bg-[#1A1C26] border-b border-white/10 px-5 py-4 flex items-center justify-between gap-4">
          <h2 className="font-bold text-white text-lg">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label={`Закрыть: ${title}`} className="p-2 rounded-xl text-neutral-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
