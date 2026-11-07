// Decorative backdrop: drifting colour orbs and twinkling particles, in pure CSS.
// Positions come from the index so server and client markup always match.
const particles = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  duration: `${3 + (i % 5)}s`,
  delay: `${(i % 7) * 0.6}s`,
}));

export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="orb orb-purple" />
      <span className="orb orb-pink" />
      <span className="orb orb-indigo" />
      {particles.map((style) => (
        <span
          key={`${style.left}-${style.top}`}
          className="particle"
          style={{ left: style.left, top: style.top, animationDuration: style.duration, animationDelay: style.delay }}
        />
      ))}
    </div>
  );
}
