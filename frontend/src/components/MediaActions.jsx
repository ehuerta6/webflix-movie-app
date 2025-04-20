import { useAuth } from '../context/AuthContext'

/**
 * MediaActions component - Empty placeholder since buttons are removed
 */
function MediaActions() {
  const { currentUser } = useAuth()

  // Don't show anything if user is not logged in
  if (!currentUser) return null

  // Return empty div since buttons are removed
  return <div></div>
}

export default MediaActions
