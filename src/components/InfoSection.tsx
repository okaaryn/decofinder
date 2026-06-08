export default function InfoSection() {
  return (
    <section className="glass-card">
      <h2 className="info-title">How it works</h2>
      <p className="info-text">
        DecoFinder connects directly to the Discord Collectibles API to fetch and download high-resolution assets linked to the platform's profile customization ecosystem. 
      </p>
      <ul className="info-list">
        <li><strong>Avatar Decorations:</strong> Extract transparent PNG frames.</li>
        <li><strong>Nameplates:</strong> Download animated or static nameplate banners.</li>
        <li><strong>Profile Effects:</strong> Retrieve both intro and loop animation layers.</li>
      </ul>
      
      <div className="alert-box mt-4">
        <strong>Privacy Guarantee:</strong> We do not store, log, or transmit your authorization token to any third-party servers. All processing is strictly performed to proxy the API request and generate the archive locally on your machine.
      </div>
    </section>
  );
}
