import { Link, useLocation } from "react-router-dom";

export function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo">İnanç Tekstil</span>
        <span className="nav-tag">PMS</span>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
          Ürünler
        </Link>
        <Link to="/jobs" className={`nav-link ${pathname === "/jobs" ? "active" : ""}`}>
          İşler
        </Link>
        <a
          href="https://1z7hb1-2d.myshopify.com/admin"
          target="_blank"
          rel="noreferrer"
          className="nav-link nav-link-external"
        >
          Shopify ↗
        </a>
      </div>
    </nav>
  );
}
