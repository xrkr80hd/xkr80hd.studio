const MEDIA_SPECS = [
  { slot: 'Home Profile Image', ratio: '4:3', size: '1600x1200', note: 'Used in home hero avatar. Keep face/subject centered.' },
  { slot: 'Home Guide Cards (all cards)', ratio: '4:3', size: '1600x1200', note: 'Used as background-image cards. Safe crop in center area.' },
  { slot: 'Band Card Image', ratio: '1:1', size: '1200x1200', note: 'Shown in the square archive, scene, and artist listing cards.' },
  { slot: 'Band Banner Image', ratio: '3:1', size: '2400x800', note: 'Wide hero strip at top of band page.' },
  { slot: 'Band Profile Photo', ratio: '3:4', size: '1200x1600', note: 'Portrait image in band detail header.' },
  { slot: 'Band Member Photo', ratio: '1:1', size: '1000x1000', note: 'Circle avatar crop for current/past members.' },
  { slot: 'Podcast Cover Image', ratio: '1:1', size: '1200x1200', note: 'Square podcast card image in the public listing.' },
  { slot: 'Blog Cover Image', ratio: '16:9', size: '1600x900', note: 'Used with fixed-height cover blocks.' },
  {
    slot: 'Track Cover Image',
    ratio: '1:1',
    size: '1400x1400',
    note: 'Used as square art in XRKR Hub now-playing. Keep subject centered so list crops still look clean.',
  },
  { slot: 'Episode Cover Image (optional)', ratio: '16:9', size: '1600x900', note: 'For podcast episode art if provided.' },
  { slot: 'Hub Gallery Thumbnail', ratio: '16:10', size: '1600x1000', note: 'Used in hub media thumbs and strips.' },
  { slot: 'XRKR Radio Desktop Skin', ratio: '128:35', size: '1536x420', note: 'Desktop player shell; keep exact dimensions.' },
];

export default function AdminMediaGuide() {
  return (
    <section className="card section-space">
      <h3 className="section-title">Admin Media Size Guide</h3>
      <p className="meta">Use these dimensions for clean crops across cards, banners, and detail pages.</p>
      <div className="admin-media-guide-wrap">
        <table className="admin-media-guide-table">
          <thead>
            <tr>
              <th>Placement</th>
              <th>Ratio</th>
              <th>Recommended Size</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {MEDIA_SPECS.map((item) => (
              <tr key={item.slot}>
                <td>{item.slot}</td>
                <td>{item.ratio}</td>
                <td>{item.size}</td>
                <td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta">Preferred image format: `.jpg` for photos, `.png` only when transparency is needed. Keep each image under 2-3MB.</p>
    </section>
  );
}
