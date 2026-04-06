import { Link } from 'react-router-dom'
import { ButtonLabel } from '../components/icons'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <h1>Page not found</h1>
      <p>The requested audit section is outside the configured planning or audit workspace.</p>
      <Link to="/" className="button button-primary">
        <ButtonLabel icon="home" label="Back to dashboard" />
      </Link>
    </div>
  )
}
