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
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
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
    addToWatchlist,
    removeFromWatchlist: removeWatchlistItem,
    addToFavorites: addFavoritesItem,
    removeFromFavorites: removeFavoritesItem,
    addToWatched: addWatchedItem,
    removeFromWatched: removeWatchedItem,
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

  // Fetch user profile from Firestore
  const fetchUserProfile = async () => {
    if (!currentUser) return null

    try {
      console.log('Fetching user profile for:', currentUser.uid)

      // Get user document from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Get the user data from the document
        const userData = userDoc.data()
        console.log('Fetched user profile data:', userData)

        // Fetch collections data (watchlist, watched, favorites)
        let watchlistItems = []
        try {
          const watchlistRef = collection(
            db,
            'users',
            currentUser.uid,
            'watchlist'
          )
          const watchlistSnapshot = await getDocs(watchlistRef)

          watchlistItems = watchlistSnapshot.docs
            .map((doc) => {
              try {
                const data = JSON.parse(doc.data().data || '{}')
                return {
                  id: doc.id,
                  type: data.media_type || data.type || 'movie',
                  title: data.title || data.name || 'Unknown',
                  poster: data.poster_path
                    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
                    : data.poster || null,
                  poster_path: data.poster_path || null,
                  rating: data.vote_average || data.rating || 'N/A',
                  year: data.release_date
                    ? data.release_date.split('-')[0]
                    : data.first_air_date
                    ? data.first_air_date.split('-')[0]
                    : 'N/A',
                  genre:
                    data.genres && data.genres.length > 0
                      ? data.genres[0]
                      : 'Drama',
                  addedAt: doc.data().addedAt || new Date().toISOString(),
                }
              } catch (parseError) {
                console.error('Error parsing watchlist item:', parseError)
                return null
              }
            })
            .filter((item) => item !== null) // Remove any items that failed to parse

          console.log('Fetched watchlist items:', watchlistItems.length)
        } catch (error) {
          console.error('Error fetching watchlist:', error)
        }

        // Build the complete profile
        const profileData = {
          ...userData,
          watchlist: watchlistItems,
          favorites: [], // Will be populated below
          watched: [], // Will be populated below
        }

        // Get watched movies
        try {
          const watchedRef = collection(db, 'users', currentUser.uid, 'watched')
          const watchedSnapshot = await getDocs(watchedRef)

          profileData.watched = watchedSnapshot.docs
            .map((doc) => {
              try {
                const data = JSON.parse(doc.data().data || '{}')
                return {
                  id: doc.id,
                  type: data.media_type || data.type || 'movie',
                  title: data.title || data.name || 'Unknown',
                  poster: data.poster_path
                    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
                    : data.poster || null,
                  poster_path: data.poster_path || null,
                  rating: data.vote_average || data.rating || 'N/A',
                  year: data.release_date
                    ? data.release_date.split('-')[0]
                    : data.first_air_date
                    ? data.first_air_date.split('-')[0]
                    : 'N/A',
                  genre:
                    data.genres && data.genres.length > 0
                      ? data.genres[0]
                      : 'Drama',
                  watchedAt: doc.data().watchedAt || new Date().toISOString(),
                }
              } catch (parseError) {
                console.error('Error parsing watched item:', parseError)
                return null
              }
            })
            .filter((item) => item !== null) // Remove any items that failed to parse

          console.log('Fetched watched movies:', profileData.watched.length)
        } catch (error) {
          console.error('Error fetching watched movies:', error)
        }

        // Get favorites items
        try {
          const favoritesRef = collection(
            db,
            'users',
            currentUser.uid,
            'favorites'
          )
          const favoritesSnapshot = await getDocs(favoritesRef)

          profileData.favorites = favoritesSnapshot.docs
            .map((doc) => {
              try {
                const data = JSON.parse(doc.data().data || '{}')
                return {
                  id: doc.id,
                  type: data.media_type || data.type || 'movie',
                  title: data.title || data.name || 'Unknown',
                  poster: data.poster_path
                    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
                    : data.poster || null,
                  poster_path: data.poster_path || null,
                  rating: data.vote_average || data.rating || 'N/A',
                  year: data.release_date
                    ? data.release_date.split('-')[0]
                    : data.first_air_date
                    ? data.first_air_date.split('-')[0]
                    : 'N/A',
                  genre:
                    data.genres && data.genres.length > 0
                      ? data.genres[0]
                      : 'Drama',
                  addedAt: doc.data().addedAt || new Date().toISOString(),
                }
              } catch (parseError) {
                console.error('Error parsing favorites item:', parseError)
                return null
              }
            })
            .filter((item) => item !== null) // Remove any items that failed to parse

          console.log('Fetched favorites items:', profileData.favorites.length)
        } catch (error) {
          console.error('Error fetching favorites:', error)
        }

        // Set the profile in state
        setUserProfile(profileData)
        return profileData
      } else {
        // User doc doesn't exist yet, create it
        console.log('Creating new user profile in Firestore:', currentUser.uid)

        // Create basic profile
        const newUserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Webflix User',
          username: currentUser.email?.split('@')[0] || '',
          email: currentUser.email,
          bio: '',
          favoriteGenres: [],
          createdAt: new Date().toISOString(),
          watchlist: [],
          favorites: [],
          watched: [],
        }

        // Create the user document in Firestore
        await setDoc(userDocRef, newUserProfile)

        setUserProfile(newUserProfile)
        console.log('Created new user profile in Firestore:', currentUser.uid)
        return newUserProfile
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)

      // Fallback to basic profile if Firestore fails
      const fallbackProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Webflix User',
        username: currentUser.email?.split('@')[0] || 'user',
        email: currentUser.email,
        bio: '',
        favoriteGenres: [],
        watchlist: [],
        favorites: [],
        watched: [],
      }

      setUserProfile(fallbackProfile)
      return fallbackProfile
    }
  }

  // Update user profile with Firestore integration
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // First update Firebase Auth display name if provided
      if (profileData.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName,
        })
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid)

      // Get the current user document
      const userSnapshot = await getDoc(userRef)
      let userData = {}

      if (userSnapshot.exists()) {
        userData = userSnapshot.data()
      }

      // Prepare the updated data
      const updatedData = {
        ...userData,
        displayName: profileData.displayName || userData.displayName,
        username: profileData.username || userData.username,
        bio: profileData.bio !== undefined ? profileData.bio : userData.bio,
        updatedAt: new Date().toISOString(),
      }

      // Update the document in Firestore
      await setDoc(userRef, updatedData, { merge: true })
      console.log('Updated user profile in Firestore:', currentUser.uid)

      // Update the local profile state with the new data
      setUserProfile((prev) => {
        if (!prev)
          return {
            ...profileData,
            uid: currentUser.uid,
          }

        return {
          ...prev,
          ...profileData,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Remove from watchlist - using Firestore
  const removeFromWatchlist = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log('Removing from watchlist:', mediaId, mediaType)

      // Remove from Firestore first
      await removeWatchlistItem(currentUser.uid, mediaId)

      // Then update local state
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

  // Add to favorites - using Firestore
  const addToFavorites = async (userId, mediaId, mediaData) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // Parse the media data if it's a string
      const media =
        typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData

      // Format genre information if available
      let genreNames = []
      if (media.genres && Array.isArray(media.genres)) {
        // Direct genre objects from API
        genreNames = media.genres.map((g) => g.name)
      } else if (media.genre_ids && Array.isArray(media.genre_ids)) {
        // Just genre IDs - use common genre map
        const genreMap = {
          28: 'Action',
          12: 'Adventure',
          16: 'Animation',
          35: 'Comedy',
          80: 'Crime',
          99: 'Documentary',
          18: 'Drama',
          10751: 'Family',
          14: 'Fantasy',
          36: 'History',
          27: 'Horror',
          10402: 'Music',
          9648: 'Mystery',
          10749: 'Romance',
          878: 'Science Fiction',
          10770: 'TV Movie',
          53: 'Thriller',
          10752: 'War',
          37: 'Western',
          10759: 'Action & Adventure',
          10762: 'Kids',
          10763: 'News',
          10764: 'Reality',
          10765: 'Sci-Fi & Fantasy',
          10766: 'Soap',
          10767: 'Talk',
          10768: 'War & Politics',
        }
        genreNames = media.genre_ids
          .map((id) => genreMap[id] || 'Unknown')
          .filter((name) => name !== 'Unknown')
      }

      const mediaItem = {
        id: media.id,
        type: media.media_type || media.type || 'movie',
        title: media.title || media.name || 'Unknown Title',
        poster_path: media.poster_path,
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
          : null,
        backdrop_path: media.backdrop_path,
        backdrop: media.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
          : null,
        vote_average: media.vote_average,
        rating: media.vote_average ? media.vote_average.toFixed(1) : '0.0',
        release_date: media.release_date || media.first_air_date,
        year: media.release_date
          ? media.release_date.split('-')[0]
          : media.first_air_date
          ? media.first_air_date.split('-')[0]
          : 'N/A',
        genres: genreNames,
        genre: genreNames.length > 0 ? genreNames[0] : 'Drama',
        overview: media.overview || '',
      }

      console.log('Adding to favorites:', mediaItem)

      // Add to Firestore first
      await addFavoritesItem(
        currentUser.uid,
        mediaItem.id,
        JSON.stringify(mediaItem)
      )

      // Then update local state
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

        // Add timestamp
        mediaItem.addedAt = new Date().toISOString()

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

  // Remove from favorites - using Firestore
  const removeFromFavorites = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log('Removing from favorites:', mediaId, mediaType)

      // Remove from Firestore first
      await removeFavoritesItem(currentUser.uid, mediaId)

      // Then update local state
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

  // Add to watched movies - using Firestore
  const addToWatched = async (userId, mediaId, mediaData) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      // Parse the media data if it's a string
      const media =
        typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData

      // Format genre information if available
      let genreNames = []
      if (media.genres && Array.isArray(media.genres)) {
        // Direct genre objects from API
        genreNames = media.genres.map((g) => g.name)
      } else if (media.genre_ids && Array.isArray(media.genre_ids)) {
        // Just genre IDs - use common genre map
        const genreMap = {
          28: 'Action',
          12: 'Adventure',
          16: 'Animation',
          35: 'Comedy',
          80: 'Crime',
          99: 'Documentary',
          18: 'Drama',
          10751: 'Family',
          14: 'Fantasy',
          36: 'History',
          27: 'Horror',
          10402: 'Music',
          9648: 'Mystery',
          10749: 'Romance',
          878: 'Science Fiction',
          10770: 'TV Movie',
          53: 'Thriller',
          10752: 'War',
          37: 'Western',
          10759: 'Action & Adventure',
          10762: 'Kids',
          10763: 'News',
          10764: 'Reality',
          10765: 'Sci-Fi & Fantasy',
          10766: 'Soap',
          10767: 'Talk',
          10768: 'War & Politics',
        }
        genreNames = media.genre_ids
          .map((id) => genreMap[id] || 'Unknown')
          .filter((name) => name !== 'Unknown')
      }

      const mediaItem = {
        id: media.id,
        type: media.media_type || media.type || 'movie',
        title: media.title || media.name || 'Unknown Title',
        poster_path: media.poster_path,
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
          : null,
        backdrop_path: media.backdrop_path,
        backdrop: media.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
          : null,
        vote_average: media.vote_average,
        rating: media.vote_average ? media.vote_average.toFixed(1) : '0.0',
        release_date: media.release_date || media.first_air_date,
        year: media.release_date
          ? media.release_date.split('-')[0]
          : media.first_air_date
          ? media.first_air_date.split('-')[0]
          : 'N/A',
        genres: genreNames,
        genre: genreNames.length > 0 ? genreNames[0] : 'Drama',
        overview: media.overview || '',
      }

      console.log('Adding to watched movies:', mediaItem)

      // Add to Firestore first
      await addWatchedItem(
        currentUser.uid,
        mediaItem.id,
        JSON.stringify(mediaItem)
      )

      // Then update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const watched = prev.watched || []
        // Check if item already exists
        const existingItem = watched.find(
          (item) => item.id === mediaItem.id && item.type === mediaItem.type
        )

        if (existingItem) {
          console.log('Item already in watched movies')
          return prev
        }

        // Add watched timestamp
        mediaItem.watchedAt = new Date().toISOString()

        return {
          ...prev,
          watched: [...watched, mediaItem],
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding to watched movies:', error)
      throw error
    }
  }

  // Remove from watched - using Firestore
  const removeFromWatched = async (mediaId, mediaType) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log('Removing from watched movies:', mediaId, mediaType)

      // Remove from Firestore first
      await removeWatchedItem(currentUser.uid, mediaId)

      // Then update local state
      setUserProfile((prev) => {
        if (!prev) return null

        const watched = prev.watched || []
        const updatedWatched = watched.filter(
          (item) => !(item.id === mediaId && item.type === mediaType)
        )

        return {
          ...prev,
          watched: updatedWatched,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing from watched movies:', error)
      throw error
    }
  }

  // Update favorite genres with Firestore integration
  const updateFavoriteGenres = async (genres) => {
    try {
      if (!currentUser) throw new Error('No user is currently logged in')

      console.log('Updating favorite genres in Firestore:', genres)

      // Update the user document in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await setDoc(
        userRef,
        {
          favoriteGenres: genres,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      // Update local state
      setUserProfile((prev) => {
        if (!prev)
          return {
            uid: currentUser.uid,
            favoriteGenres: genres,
          }

        return {
          ...prev,
          favoriteGenres: genres,
        }
      })

      console.log('Favorite genres updated successfully')
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
    addToWatched,
    removeFromWatched,
    updateFavoriteGenres,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
