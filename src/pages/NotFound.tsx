import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <h1>Page not found</h1>
      <p>The requested audit section is outside the configured planning or audit workspace.</p>
      <Link to="/" className="button button-primary">
        Back to dashboard
      </Link>
    </div>
  )
}
