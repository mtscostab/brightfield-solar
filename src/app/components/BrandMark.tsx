/** Brightfield sun-over-horizon mark. Decorative: the wordmark carries the name. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="16" fill="var(--green-900)" />
      <circle cx="16" cy="19" r="7.5" fill="var(--coral)" />
      <path d="M16 6.5v3M7.2 10.2l2.1 2.1M24.8 10.2l-2.1 2.1" stroke="var(--lime)" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="19" width="22" height="8" fill="var(--green-900)" />
      <path d="M6 19.5h20M8.5 23h15" stroke="var(--lime)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
