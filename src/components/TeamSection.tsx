export default function TeamSection() {
  return (
    <section className="team-section fade-in">
      <h2 className="team-header">
        Meet our <span className="highlight">Team</span>
      </h2>
      <p className="team-desc">
        DecoFinder was created because we needed a dedicated scraper for our biolink project, <a href="https://jury.lat" target="_blank" rel="noopener noreferrer" className="jury-link">jury.lat</a>. We built this tool to seamlessly download all decorations and effects, and now we're sharing it with the community.
      </p>
      <div className="team-container">
        <div className="team-card">
          <div className="card-image-wrapper">
            {/* Placeholder for PFP */}
            <img src="pfp.png" alt="aaryn" className="team-image" />
          </div>
          <h3 className="team-name">aaryn</h3>
          <p className="team-role">founder & developer.</p>
        </div>
      </div>
    </section>
  );
}
