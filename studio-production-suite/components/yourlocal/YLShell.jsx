import './yourlocal.css';

// Wraps the YourLocal community pages in the clean, professional look.
// Everything inside is styled by yourlocal.css under the .yl class, so the
// rest of the site (Gleaux, Progress, Hub, admin) keeps its own style.
// Uses the system UI font (no font download), which keeps builds reliable.
export default function YLShell({ children }) {
  return (
    <div className="yl">
      <div className="yl-wrap">{children}</div>
    </div>
  );
}
