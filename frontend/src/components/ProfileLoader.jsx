import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * This component ensures that the user profile data is loaded when the app initializes
 * without requiring the user to visit the profile page first.
 * It doesn't render anything visible, it just handles the data fetching.
 */
function ProfileLoader() {
  const { currentUser, fetchUserProfile } = useAuth()

  useEffect(() => {
    // Load user profile data whenever currentUser changes (e.g., on login)
    if (currentUser) {
      console.log('ProfileLoader: Loading user profile data')
      fetchUserProfile()
        .then(() => {
          console.log('ProfileLoader: User profile data loaded successfully')
        })
        .catch((error) => {
          console.error('ProfileLoader: Error loading user profile data', error)
        })
    }
  }, [currentUser, fetchUserProfile])

  // This component doesn't render anything
  return null
}

export default ProfileLoader
