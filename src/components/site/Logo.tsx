export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.6" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path
        d="M9 22.5 15.2 9h1.6L23 22.5h-3l-1.3-3h-5.4l-1.3 3H9Zm5.3-5.6h3.4L16 12.6l-1.7 4.3Z"
        fill="#fff"
      />
      <circle cx="24.5" cy="8" r="2" fill="#fff" fillOpacity=".9" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
      <LogoMark />
      <span>
        Aido<span className="text-gradient">Post</span>
      </span>
    </span>
  );
}
