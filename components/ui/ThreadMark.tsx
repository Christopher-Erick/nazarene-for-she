export function ThreadMark({ children }: { children: React.ReactNode }) {
  return (
    <span className="hero-mark">
      {children}
      <svg className="hero-mark-thread" viewBox="0 0 240 20" fill="none" aria-hidden="true">
        <path
          d="M4 13C42 5 78 17 118 10C158 3 196 16 236 8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
