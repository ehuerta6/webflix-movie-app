import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase/firebase'
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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const AuthContext = createContext()
const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
      await createUserDocument(userCredential.user)

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

      // Check if this is a new user
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (!userDoc.exists()) {
        await createUserDocument(result.user)
      }

      return result
    } catch (error) {
      console.error('Error during Google sign in:', error.message)
      throw error
    }
  }

  // Create user document in Firestore
  const createUserDocument = async (user) => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const { displayName, email, uid } = user

      try {
        await setDoc(userRef, {
          uid,
          displayName: displayName || 'Webflix User',
          username: email.split('@')[0],
          email,
          bio: 'Movie enthusiast and aspiring critic.',
          favoriteGenres: [],
          watchlist: [],
          favorites: [],
        })
      } catch (error) {
        console.error('Error creating user document:', error)
      }
    }
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

      // Update email in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { email: newEmail })

      // Refresh user profile
      await fetchUserProfile()

      return { success: true }
    } catch (error) {
      console.error('Error updating email:', error)
      throw error
    }
  }

  // Fetch user profile from Firestore
  const fetchUserProfile = async () => {
    if (!currentUser) return null

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
        return userData
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Update user profile in both Auth and Firestore
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // First update Firebase Auth display name if provided
      if (profileData.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName,
        })
      }

      // Then update the user document in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, profileData)

      // Refresh the user profile in state
      await fetchUserProfile()

      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Add to watchlist
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
      }

      const userRef = doc(db, 'users', currentUser.uid)

      // First get current watchlist to check for duplicates
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const watchlist = userData.watchlist || []

        // Check if item already exists in watchlist
        const existingItem = watchlist.find(
          (item) => item.id === mediaItem.id && item.type === mediaItem.type
        )
        if (existingItem) {
          return { success: true, message: 'Item already in watchlist' }
        }

        // Add item to watchlist
        await updateDoc(userRef, {
          watchlist: [...watchlist, mediaItem],
        })

        // Refresh user profile
        await fetchUserProfile()

        return { success: true }
      }

      return { success: false, message: 'User document not found' }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  }

  // Remove from watchlist
  const removeFromWatchlist = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      const userRef = doc(db, 'users', currentUser.uid)

      // Get current watchlist
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const watchlist = userData.watchlist || []

        // Filter out the item to remove
        const updatedWatchlist = watchlist.filter(
          (item) => !(item.id === mediaId && item.type === mediaType)
        )

        // Update the document
        await updateDoc(userRef, {
          watchlist: updatedWatchlist,
        })

        // Refresh user profile
        await fetchUserProfile()

        return { success: true }
      }

      return { success: false, message: 'User document not found' }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  }

  // Add to favorites
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

      const userRef = doc(db, 'users', currentUser.uid)

      // First get current favorites to check for duplicates
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const favorites = userData.favorites || []

        // Check if item already exists in favorites
        const existingItem = favorites.find(
          (item) => item.id === mediaItem.id && item.type === mediaItem.type
        )
        if (existingItem) {
          return { success: true, message: 'Item already in favorites' }
        }

        // Add item to favorites
        await updateDoc(userRef, {
          favorites: [...favorites, mediaItem],
        })

        // Refresh user profile
        await fetchUserProfile()

        return { success: true }
      }

      return { success: false, message: 'User document not found' }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  // Remove from favorites
  const removeFromFavorites = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      const userRef = doc(db, 'users', currentUser.uid)

      // Get current favorites
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const favorites = userData.favorites || []

        // Filter out the item to remove
        const updatedFavorites = favorites.filter(
          (item) => !(item.id === mediaId && item.type === mediaType)
        )

        // Update the document
        await updateDoc(userRef, {
          favorites: updatedFavorites,
        })

        // Refresh user profile
        await fetchUserProfile()

        return { success: true }
      }

      return { success: false, message: 'User document not found' }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  // Update favorite genres
  const updateFavoriteGenres = async (genres) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      const userRef = doc(db, 'users', currentUser.uid)

      // Update favorite genres
      await updateDoc(userRef, {
        favoriteGenres: genres,
      })

      // Refresh user profile
      await fetchUserProfile()

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
