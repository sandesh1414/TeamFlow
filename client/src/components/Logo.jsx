const Logo = ({ size = 36, light = false }) => {
  const main = light ? '#ffffff' : 'var(--primary)';
  const accent = light ? '#5eead4' : 'var(--ai)';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill={light ? 'rgba(255,255,255,0.14)' : 'var(--primary-soft)'} />
      <path d="M12 14h16M12 20h10M12 26h13" stroke={main} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="29" cy="20" r="4.5" fill={accent} />
      <circle cx="29" cy="20" r="2" fill={light ? '#0d9488' : '#ffffff'} />
    </svg>
  );
};

export default Logo;
