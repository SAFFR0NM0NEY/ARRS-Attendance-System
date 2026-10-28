import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="brand-mark">
        
      </span>
      <p className="eyebrow">ITCA DIGITAL CAMPUS</p>
      <h1>Page not found</h1>
      <p>The page may have moved or the address may be incorrect.</p>
      <Link to="/" className="button button-primary">
        Return to welcome page
      </Link>
    </main>
  );
}
