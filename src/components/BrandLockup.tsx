import { SHOW_HELPER_TEXT } from '../config/uiPreferences'
import { APP_CREATOR, APP_LOGO_PATH, APP_NAME, APP_TAGLINE } from '../data/branding'

export default function BrandLockup({
  variant = 'sidebar',
  showCreator = false,
  subtitle,
}: {
  variant?: 'sidebar'
  showCreator?: boolean
  subtitle?: string
}) {
  return (
    <div className={`brand-lockup brand-lockup-${variant}`}>
      <img src={APP_LOGO_PATH} alt={`${APP_NAME} logo`} className="brand-lockup-logo" />
      <div className="brand-lockup-copy">
        <strong>{APP_NAME}</strong>
        {SHOW_HELPER_TEXT ? <p>{subtitle ?? APP_TAGLINE}</p> : null}
        {showCreator ? <span>{APP_CREATOR}</span> : null}
      </div>
    </div>
  )
}
