import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

export default function Dialog({ children, titleId, onClose, className = '' }: { children: ReactNode; titleId: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    return () => {
      dialog.close();
      document.body.classList.remove('dialog-open');
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <button className="icon-button close-button" aria-label="Close dialog" onClick={onClose} autoFocus><Icon name="close" /></button>
    {children}
  </dialog>;
}
