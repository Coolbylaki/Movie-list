const paths = {
  search: 'M21 21l-4.4-4.4M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  refresh: 'M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9',
  sort: 'M8 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3',
  close: 'M6 6l12 12M18 6 6 18',
  film: 'M4 3h16v18H4zM8 3v18M16 3v18M4 7h4M4 12h4M4 17h4M16 7h4M16 12h4M16 17h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z',
};

export default function Icon({ name, className = '' }: { name: keyof typeof paths | 'settings'; className?: string }) {
  if (name === 'settings') return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="m9 3-.6 2.4-2 1.1L4 5.8 2 9.2l1.8 1.7v2.2L2 14.8l2 3.4 2.4-.7 2 1.1L9 21h4l.6-2.4 2-1.1 2.4.7 2-3.4-1.8-1.7v-2.2L20 9.2l-2-3.4-2.4.7-2-1.1L13 3Z" /><circle cx="11" cy="12" r="3" />
  </svg>;
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill={name === 'star' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
