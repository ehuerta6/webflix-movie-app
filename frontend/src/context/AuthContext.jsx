import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../services/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useFireStore } from '../services/firestore'

const AuthContext = createContext()
const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const {
    addToWatchlist: addToWatchlistFirestore,
    removeFromWatchlist: removeFromWatchlistFirestore,
    getWatchlist,
  } = useFireStore()

  // Login with email and password
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Logout
  const logout = () => {
    setUserProfile(null)
    return signOut(auth)
  }

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Update profile with display name
      await updateProfile(userCredential.user, { displayName })

      // Create user document in Firestore
      try {
        // Create an empty user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName,
          email,
          createdAt: new Date().toISOString(),
        })
        console.log('Created user document for:', userCredential.user.uid)
      } catch (error) {
        console.error('Error creating user document:', error)
      }

      return userCredential
    } catch (error) {
      console.error('Error during sign up:', error.message)
      throw error
    }
  }

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)

      // Check if user document exists, if not create it
      try {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid))

        if (!userDoc.exists()) {
          // Create user document in Firestore
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            createdAt: new Date().toISOString(),
          })
          console.log('Created user document for Google user:', result.user.uid)
        }
      } catch (error) {
        console.error('Error checking/creating user document:', error)
      }

      return result
    } catch (error) {
      console.error('Error during Google sign in:', error.message)
      throw error
    }
  }

  // Create user document in Firestore - placeholder for future implementation
  // eslint-disable-next-line no-unused-vars
  const createUserDocument = async (user) => {
    if (!user) return

    console.log('Will create user document for:', user.uid)

    // Firestore implementation will be added later
    return { success: true }
  }

  // Re-authenticate the user before sensitive operations
  const reauthenticate = async (currentPassword) => {
    if (!currentUser) throw new Error('No user is currently logged in')

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    )

    return reauthenticateWithCredential(currentUser, credential)
  }

  // Update user password
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // First re-authenticate the user
      await reauthenticate(currentPassword)

      // Then update the password
      await updatePassword(currentUser, newPassword)

      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  // Update user email
  const updateUserEmail = async (currentPassword, newEmail) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // First re-authenticate the user
      await reauthenticate(currentPassword)

      // Then update the email
      await updateEmail(currentUser, newEmail)

      // Will implement Firestore update later
      console.log('Will update email in database for user:', currentUser.uid)

      return { success: true }
    } catch (error) {
      console.error('Error updating email:', error)
      throw error
    }
  }

  // Fetch user profile - now fetches watchlist from Firestore
  const fetchUserProfile = async () => {
    if (!currentUser) return null

    try {
      // Mock user profile data for most fields
      const mockUserProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Webflix User',
        username: currentUser.email?.split('@')[0] || 'user',
        email: currentUser.email,
        bio: 'Movie enthusiast and aspiring critic.',
        favoriteGenres: [],
        favorites: [],
      }

      // Fetch actual watchlist from Firestore
      const watchlist = await getWatchlist(currentUser.uid)
      mockUserProfile.watchlist = watchlist || []

      setUserProfile(mockUserProfile)
      console.log(
        'Fetched user profile with watchlist from Firestore:',
        currentUser.uid
      )
      return mockUserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Update user profile - placeholder for future implementation
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // First update Firebase Auth display name if provided
      if (profileData.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName,
        })
      }

      // Will implement Firestore update later
      console.log('Will update profile in database:', profileData)

      // Update the local profile state with the new data
      setUserProfile((prev) => ({
        ...prev,
        ...profileData,
      }))

      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Add to watchlist - now uses Firestore
  const addToWatchlist = async (media) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      const mediaItem = {
        id: media.id,
        type: media.media_type || media.type,
        title: media.title || media.name,
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
          : null,
        backdrop: media.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
          : null,
        rating: media.vote_average ? media.vote_average.toFixed(1) : '0.0',
        year: media.release_date
          ? media.release_date.split('-')[0]
          : media.first_air_date
          ? media.first_air_date.split('-')[0]
          : 'N/A',
        added_at: new Date().toISOString(),
      }

      console.log('Adding to watchlist in Firestore:', mediaItem)

      // Save to Firestore
      await addToWatchlistFirestore(currentUser.uid, mediaItem)

      // Update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const watchlist = prev.watchlist || []
        // Check if item already exists
        const existingItem = watchlist.find(
          (item) => item.id === mediaItem.id && item.type === mediaItem.type
        )

        if (existingItem) {
          console.log('Item already in watchlist')
          return prev
        }

        return {
          ...prev,
          watchlist: [...watchlist, mediaItem],
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  }

  // Remove from watchlist - now uses Firestore
  const removeFromWatchlist = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log('Removing from watchlist in Firestore:', mediaId, mediaType)

      // Remove from Firestore
      await removeFromWatchlistFirestore(currentUser.uid, mediaId)

      // Update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const watchlist = prev.watchlist || []
        const updatedWatchlist = watchlist.filter(
          (item) => !(item.id === mediaId && item.type === mediaType)
        )

        return {
          ...prev,
          watchlist: updatedWatchlist,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  }

  // Add to favorites - placeholder implementation
  const addToFavorites = async (media) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      const mediaItem = {
        id: media.id,
        type: media.media_type || media.type,
        title: media.title || media.name,
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
          : null,
        backdrop: media.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
          : null,
        rating: media.vote_average ? media.vote_average.toFixed(1) : '0.0',
        year: media.release_date
          ? media.release_date.split('-')[0]
          : media.first_air_date
          ? media.first_air_date.split('-')[0]
          : 'N/A',
      }

      console.log(
        'Adding to favorites (will implement database later):',
        mediaItem
      )

      // Update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const favorites = prev.favorites || []
        // Check if item already exists
        const existingItem = favorites.find(
          (item) => item.id === mediaItem.id && item.type === mediaItem.type
        )

        if (existingItem) {
          console.log('Item already in favorites')
          return prev
        }

        return {
          ...prev,
          favorites: [...favorites, mediaItem],
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  // Remove from favorites - placeholder implementation
  const removeFromFavorites = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log(
        'Removing from favorites (will implement database later):',
        mediaId,
        mediaType
      )

      // Update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const favorites = prev.favorites || []
        const updatedFavorites = favorites.filter(
          (item) => !(item.id === mediaId && item.type === mediaType)
        )

        return {
          ...prev,
          favorites: updatedFavorites,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  // Update favorite genres - placeholder implementation
  const updateFavoriteGenres = async (genres) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log(
        'Updating favorite genres (will implement database later):',
        genres
      )

      // Update local state
      setUserProfile((prev) => {
        if (!prev) return null
        return {
          ...prev,
          favoriteGenres: genres,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating favorite genres:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        await fetchUserProfile()
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    signup,
    loginWithGoogle,
    fetchUserProfile,
    updateUserPassword,
    updateUserEmail,
    reauthenticate,
    updateUserProfile,
    addToWatchlist,
    removeFromWatchlist,
    addToFavorites,
    removeFromFavorites,
    updateFavoriteGenres,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
