import { Inter } from 'next/font/google';
import './yourlocal.css';

const inter = Inter({ subsets: ['latin'], variable: '--yl-font', weight: ['400', '500', '600', '700'] });

// Wraps the YourLocal community pages in the clean, professional look.
// Everything inside is styled by yourlocal.css under the .yl class, so the
// rest of the site (Gleaux, Progress, Hub, admin) keeps its own style.
export default function YLShell({ children }) {
  return (
    <div className={`yl ${inter.variable}`}>
      <div className="yl-wrap">{children}</div>
    </div>
  );
}
