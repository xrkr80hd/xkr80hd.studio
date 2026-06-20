import SubmissionIntakeForm from '../../components/SubmissionIntakeForm';
import { getSiteProfile } from '../../lib/content';

export default async function ContactPage() {
  const profile = await getSiteProfile();
  const email = profile?.email || 'contact@xrkr80hd.studio';

  return (
    <>
      <section className="card hero">
        <h1>
          <span className="hero-accent">Contact</span> YourLocal Feature Desk
        </h1>
        <p>If your band, artist project, or podcast should be featured on YourLocal, send details and links.</p>
      </section>

      <section className="card section-space contact-card">
        <h3 className="section-title">Need a Site That Hits Hard?</h3>
        <p>
          We build bold local-first web experiences for bands, artists, podcasts, and businesses. If you want clean UX, fast pages,
          media integration, and a brand presence that stands out, book a web build.
        </p>
        <div className="actions">
          <a className="button primary" href={`mailto:${email}?subject=Web%20Development%20Service%20Inquiry`}>
            Book Web Development
          </a>
          <a className="button" href={`mailto:${email}`}>
            General Contact
          </a>
        </div>
        <p className="meta">
          Service focus: full web builds, landing pages, media hubs, artist/business profiles, and content systems.
        </p>
      </section>

      <SubmissionIntakeForm />
    </>
  );
}
