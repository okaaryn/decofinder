export default function TrustSection() {
  return (
    <section id="cli" className="glass-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="team-header">
        Prefer the <span className="highlight">Terminal?</span>
      </h2>
      <p className="team-desc" style={{ marginBottom: '2rem' }}>
        For power users who prefer to keep things local and transparent. Download our original Python CLI script to export your collectibles directly from your machine.
      </p>
      <a href="/cli-version.zip" download className="button button-outline" style={{ display: 'inline-block', width: 'auto', padding: '0.8rem 2.5rem', fontSize: '1.05rem' }}>
        Download CLI Archive
      </a>
    </section>
  );
}
