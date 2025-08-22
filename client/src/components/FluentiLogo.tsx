export default function FluentiLogo({
  className,
  style,
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Fluenti logo" className={className} style={style}>
      <circle cx="32" cy="32" r="26" fill="currentColor" />
      <path d="M26 20v24" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <path d="M26 22h14" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <path d="M26 32h10" stroke="white" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
