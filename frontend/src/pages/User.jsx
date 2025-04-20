import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGenres } from '../services/api'
import { useAuth } from '../context/AuthContext'

// MovieCard component for reuse in different collections
const MovieCard = ({ movie, actions }) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!movie || !movie.id) return null

  // Format the poster URL properly
  const posterUrl =
    movie.poster && movie.poster.includes('http')
      ? movie.poster
      : movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : 'https://via.placeholder.com/342x513?text=No+Image'

  return (
    <div className="bg-[#1e1e1e] rounded overflow-hidden flex-shrink-0 hover:translate-y-[-4px] transition-transform duration-200 w-36">
      <div className="w-full h-48 relative">
        <img
          src={posterUrl}
          alt={movie.title || 'Movie'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/342x513?text=No+Image'
          }}
          loading="lazy"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#333] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {movie.rating && (
          <div className="absolute top-0 right-0 bg-black/50 px-1.5 py-0.5 m-1.5 rounded text-xs">
            <span className="text-[#5ccfee]">
              {typeof movie.rating === 'number'
                ? movie.rating.toFixed(1)
                : movie.rating}
            </span>
          </div>
        )}
        {movie.genre && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
            <span className="text-xs text-[#5ccfee] font-medium truncate max-w-[70%]">
              {movie.genre}
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <h4 className="font-medium text-gray-200 text-sm mb-0.5 truncate">
          {movie.title || 'Unknown Title'}
        </h4>
        <p className="text-gray-400 text-xs">{movie.year || 'N/A'}</p>
        {actions && <div className="mt-1 flex justify-between">{actions}</div>}
      </div>
    </div>
  )
}

// GenreToggle component for selecting genres
const GenreToggle = ({ genre, selected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(genre)}
    className={`px-2 py-0.5 text-xs rounded-full ${
      selected
        ? 'bg-[#5ccfee] text-black font-bold'
        : 'bg-[#252525] text-gray-300 hover:bg-[#333]'
    }`}
  >
    {genre}
  </button>
)

// Stat component for user statistics
const StatItem = ({ icon, label, value }) => (
  <div className="bg-[#1e1e1e] p-2 rounded flex items-center">
    {icon}
    <div>
      <p className="text-gray-400 text-xs leading-tight">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  </div>
)

function User() {
  const navigate = useNavigate()
  const {
    userProfile,
    currentUser,
    fetchUserProfile,
    updateUserPassword,
    updateUserEmail,
    updateUserProfile,
    removeFromWatchlist,
    removeFromFavorites,
    updateFavoriteGenres,
    removeFromWatched,
    setUserProfile,
  } = useAuth()
  const [userStats, setUserStats] = useState({
    totalWatched: 0,
    favoriteCount: 0,
    watchlistCount: 0,
  })

  // API data state
  // const [likedMovies, setLikedMovies] = useState([])
  const [watchlistMovies, setWatchlistMovies] = useState([])
  // const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState({
    genres: false,
    liked: false,
    watchlist: false,
    watched: false,
    profile: false,
  })

  // UI state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [availableGenres, setAvailableGenres] = useState([])

  // Form state - initialize once we have userProfile
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    selectedGenres: [],
  })

  const [settingsForm, setSettingsForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add profileSubmitting state to track profile form submission
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  // Add state for profile form errors
  const [profileError, setProfileError] = useState('')

  // Calculate user statistics
  useEffect(() => {
    if (userProfile) {
      const favorites = userProfile.favorites || []
      const watchlist = userProfile.watchlist || []
      const watched = userProfile.watched || []

      // Only calculate counts needed for our stats display
      const movieWatched = watched.filter(
        (item) => item.type === 'movie'
      ).length
      const showWatched = watched.filter((item) => item.type === 'tv').length

      setUserStats({
        totalWatched: movieWatched + showWatched,
        favoriteCount: favorites.length,
        watchlistCount: watchlist.length,
      })
    }
  }, [userProfile])

  // Fetch user profile on mount and when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      setLoading((prev) => ({ ...prev, profile: true }))
      fetchUserProfile()
        .then(() => setLoading((prev) => ({ ...prev, profile: false })))
        .catch(() => setLoading((prev) => ({ ...prev, profile: false })))
    }
  }, [currentUser?.uid])

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile && isEditingProfile) {
      setEditForm({
        name: userProfile.displayName || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        selectedGenres: userProfile.favoriteGenres || [],
      })
    }

    if (userProfile) {
      setSettingsForm((prev) => ({
        ...prev,
        email: userProfile.email || '',
      }))
    }
  }, [userProfile, isEditingProfile])

  // Load genre data for mapping IDs to names
  useEffect(() => {
    const loadGenres = async () => {
      setLoading((prev) => ({ ...prev, genres: true }))
      try {
        // Fetch movie and TV genres
        const [movieGenres, tvGenres] = await Promise.all([
          fetchGenres('movie'),
          fetchGenres('tv'),
        ])

        // Create genre list
        const genreNames = new Set()

        // Add movie genres to list
        movieGenres.forEach((genre) => {
          genreNames.add(genre.name)
        })

        // Add TV genres to list (some may overlap)
        tvGenres.forEach((genre) => {
          genreNames.add(genre.name)
        })

        setAvailableGenres([...genreNames].sort())
      } catch (error) {
        console.error('Error fetching genres:', error)
      } finally {
        setLoading((prev) => ({ ...prev, genres: false }))
      }
    }

    loadGenres()
  }, [])

  // Load user watchlist and favorites from profile data with improved Firestore compatibility
  useEffect(() => {
    if (!userProfile) return

    console.log('Processing user profile data:', userProfile)

    try {
      // Format favorites data
      if (userProfile.favorites && userProfile.favorites.length > 0) {
        console.log(
          'Processing favorites from Firestore:',
          userProfile.favorites
        )

        const formattedFavorites = userProfile.favorites
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            console.log('Processing favorite movie:', movie) // Add this log
            // Extract genre from various possible formats
            let genre = 'Drama'

            // First check if the raw data has genres property (could be from parsed JSON)
            if (movie.genres) {
              if (Array.isArray(movie.genres)) {
                if (movie.genres.length > 0) {
                  // Could be array of objects with name
                  if (
                    typeof movie.genres[0] === 'object' &&
                    movie.genres[0].name
                  ) {
                    genre = movie.genres[0].name
                  }
                  // Or array of strings
                  else if (typeof movie.genres[0] === 'string') {
                    genre = movie.genres[0]
                  }
                }
              }
              // Could be a string that needs parsing
              else if (typeof movie.genres === 'string') {
                try {
                  const parsedGenres = JSON.parse(movie.genres)
                  if (Array.isArray(parsedGenres) && parsedGenres.length > 0) {
                    if (
                      typeof parsedGenres[0] === 'object' &&
                      parsedGenres[0].name
                    ) {
                      genre = parsedGenres[0].name
                    } else {
                      genre = String(parsedGenres[0])
                    }
                  }
                } catch {
                  // Not JSON, just use the string
                  genre = movie.genres
                }
              }
            }
            // Then check if there's a simple genre property
            else if (movie.genre) {
              genre = movie.genre
            }

            return {
              id: movie.id,
              title: movie.title || movie.name || 'Unknown Title',
              // Handle different poster formats
              poster: movie.poster || null,
              poster_path:
                movie.poster_path ||
                (movie.poster && !movie.poster.includes('http')
                  ? movie.poster
                  : null),
              year:
                movie.year ||
                (movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : 'N/A'),
              rating: movie.rating || movie.vote_average || 'N/A',
              genre: genre,
              type: movie.type || movie.media_type || 'movie',
            }
          })

        // setLikedMovies(formattedFavorites)
        console.log('Formatted favorites:', formattedFavorites)
      } else {
        // setLikedMovies([])
        console.log('No favorites found in user profile')
      }

      // Format watchlist data with improved handling for Firestore data structure
      if (userProfile.watchlist && userProfile.watchlist.length > 0) {
        console.log(
          'Processing watchlist from Firestore:',
          userProfile.watchlist
        )

        const formattedWatchlist = userProfile.watchlist
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            console.log('Processing watchlist movie:', movie) // Add this log
            // Extract genre from various possible formats
            let genre = 'Drama'

            // First check if the raw data has genres property (could be from parsed JSON)
            if (movie.genres) {
              if (Array.isArray(movie.genres)) {
                if (movie.genres.length > 0) {
                  // Could be array of objects with name
                  if (
                    typeof movie.genres[0] === 'object' &&
                    movie.genres[0].name
                  ) {
                    genre = movie.genres[0].name
                  }
                  // Or array of strings
                  else if (typeof movie.genres[0] === 'string') {
                    genre = movie.genres[0]
                  }
                }
              }
              // Could be a string that needs parsing
              else if (typeof movie.genres === 'string') {
                try {
                  const parsedGenres = JSON.parse(movie.genres)
                  if (Array.isArray(parsedGenres) && parsedGenres.length > 0) {
                    if (
                      typeof parsedGenres[0] === 'object' &&
                      parsedGenres[0].name
                    ) {
                      genre = parsedGenres[0].name
                    } else {
                      genre = String(parsedGenres[0])
                    }
                  }
                } catch {
                  // Not JSON, just use the string
                  genre = movie.genres
                }
              }
            }
            // Then check if there's a simple genre property
            else if (movie.genre) {
              genre = movie.genre
            }

            return {
              id: movie.id,
              title: movie.title || movie.name || 'Unknown Title',
              // Handle different poster formats
              poster: movie.poster || null,
              poster_path:
                movie.poster_path ||
                (movie.poster && !movie.poster.includes('http')
                  ? movie.poster
                  : null),
              year:
                movie.year ||
                (movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : 'N/A'),
              rating: movie.rating || movie.vote_average || 'N/A',
              genre: genre,
              type: movie.type || movie.media_type || 'movie',
            }
          })

        setWatchlistMovies(formattedWatchlist)
        console.log('Formatted watchlist movies:', formattedWatchlist)
      } else {
        setWatchlistMovies([])
        console.log('No watchlist items found in user profile')
      }

      // Format watched movies data - use the same improved genre extraction
      if (userProfile.watched && userProfile.watched.length > 0) {
        console.log(
          'Processing watched movies from Firestore:',
          userProfile.watched
        )

        const formattedWatched = userProfile.watched
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            console.log('Processing watched movie:', movie) // Add this log
            // Extract genre from various possible formats
            let genre = 'Drama'

            // First check if the raw data has genres property (could be from parsed JSON)
            if (movie.genres) {
              if (Array.isArray(movie.genres)) {
                if (movie.genres.length > 0) {
                  // Could be array of objects with name
                  if (
                    typeof movie.genres[0] === 'object' &&
                    movie.genres[0].name
                  ) {
                    genre = movie.genres[0].name
                  }
                  // Or array of strings
                  else if (typeof movie.genres[0] === 'string') {
                    genre = movie.genres[0]
                  }
                }
              }
              // Could be a string that needs parsing
              else if (typeof movie.genres === 'string') {
                try {
                  const parsedGenres = JSON.parse(movie.genres)
                  if (Array.isArray(parsedGenres) && parsedGenres.length > 0) {
                    if (
                      typeof parsedGenres[0] === 'object' &&
                      parsedGenres[0].name
                    ) {
                      genre = parsedGenres[0].name
                    } else {
                      genre = String(parsedGenres[0])
                    }
                  }
                } catch {
                  // Not JSON, just use the string
                  genre = movie.genres
                }
              }
            }
            // Then check if there's a simple genre property
            else if (movie.genre) {
              genre = movie.genre
            }

            return {
              id: movie.id,
              title: movie.title || movie.name || 'Unknown Title',
              // Handle different poster formats
              poster: movie.poster || null,
              poster_path:
                movie.poster_path ||
                (movie.poster && !movie.poster.includes('http')
                  ? movie.poster
                  : null),
              year:
                movie.year ||
                (movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : 'N/A'),
              rating: movie.rating || movie.vote_average || 'N/A',
              genre: genre,
              type: movie.type || movie.media_type || 'movie',
              watchedAt: movie.watchedAt || 'N/A',
            }
          })

        // setWatchedMovies(formattedWatched)
        console.log('Formatted watched movies:', formattedWatched)
      } else {
        // setWatchedMovies([])
        console.log('No watched movies found in user profile')
      }
    } catch (error) {
      console.error('Error formatting user profile data:', error)
    }
  }, [userProfile]) // Only depend on userProfile changes

  // Event handlers
  const handleGoBack = () => navigate(-1)

  const handleProfileEdit = () => {
    // Initialize the form with current userProfile data
    setEditForm({
      name: userProfile?.displayName || '',
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
      selectedGenres: userProfile?.favoriteGenres || [],
    })
    setIsEditingProfile(true)
    setProfileError('')
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    setProfileError('') // Clear any previous error when form is changed
  }

  const handleGenreToggle = (genre) => {
    // Create a copy of the current selected genres
    const currentGenres = [...editForm.selectedGenres]
    const index = currentGenres.indexOf(genre)

    // Toggle the genre
    if (index !== -1) {
      currentGenres.splice(index, 1)
    } else {
      currentGenres.push(genre)
    }

    // Update the form state with the new genres array
    setEditForm({
      ...editForm,
      selectedGenres: currentGenres,
    })

    console.log('Updated selected genres:', currentGenres)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    // Validate the form
    if (!editForm.name.trim()) {
      setProfileError('Display name cannot be empty')
      return
    }

    // Validate username format (no spaces)
    if (editForm.username && editForm.username.includes(' ')) {
      setProfileError('Username cannot contain spaces')
      return
    }

    setLoading((prev) => ({ ...prev, profile: true }))
    setProfileSubmitting(true)
    setProfileError('') // Clear any errors

    try {
      // First update the user profile data (except genres)
      const profileData = {
        displayName: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
      }

      console.log('Updating user profile in Firestore:', profileData)
      await updateUserProfile(profileData)

      // Then separately update favorite genres if they've changed
      const currentGenres = userProfile?.favoriteGenres || []
      const newGenres = editForm.selectedGenres || []

      if (JSON.stringify(currentGenres) !== JSON.stringify(newGenres)) {
        console.log('Updating favorite genres in Firestore:', newGenres)
        await updateFavoriteGenres(newGenres)
      }

      // Success! Close the editing form
      setIsEditingProfile(false)

      // Display success message (could be implemented with a toast notification)
      console.log('Profile successfully updated')
    } catch (error) {
      console.error('Error updating profile:', error)
      setProfileError(error.message || 'Failed to update profile')
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }))
      setProfileSubmitting(false)
    }
  }

  const handleSettingsToggle = () => {
    if (!isSettingsOpen) {
      setSettingsForm({
        email: userProfile?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleSettingsFormChange = (e) => {
    const { name, value } = e.target
    setSettingsForm((prev) => ({ ...prev, [name]: value }))
    // Clear any previous error messages when form is changed
    setSettingsError('')
    setSettingsSuccess('')
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()

    // Reset status messages
    setSettingsError('')
    setSettingsSuccess('')
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!settingsForm.currentPassword) {
        throw new Error('Current password is required for any account changes')
      }

      let changesMade = false

      // Check if we need to update the password
      if (settingsForm.newPassword) {
        // Validate password
        if (settingsForm.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters')
        }

        // Check if passwords match
        if (settingsForm.newPassword !== settingsForm.confirmPassword) {
          throw new Error('New passwords do not match')
        }

        // Update password
        await updateUserPassword(
          settingsForm.currentPassword,
          settingsForm.newPassword
        )

        changesMade = true
        setSettingsSuccess((prev) => prev + 'Password updated successfully. ')
      }

      // Check if we need to update the email
      if (settingsForm.email !== userProfile.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(settingsForm.email)) {
          throw new Error('Please enter a valid email address')
        }

        // Update email
        await updateUserEmail(settingsForm.currentPassword, settingsForm.email)

        changesMade = true
        setSettingsSuccess((prev) => prev + 'Email updated successfully. ')
      }

      // If we get here with no changes made, show message
      if (!changesMade) {
        setSettingsSuccess('No changes were detected')
      }

      // Reset form (except email)
      setSettingsForm({
        email: settingsForm.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      // Close the settings form after a short delay
      setTimeout(() => {
        setIsSettingsOpen(false)
        setSettingsSuccess('')
      }, 2000)
    } catch (error) {
      console.error('Settings update error:', error)

      // Set appropriate error message based on Firebase error codes
      if (error.code) {
        // Firebase Auth errors have a code property
        switch (error.code) {
          case 'auth/wrong-password':
            setSettingsError('Incorrect current password')
            break
          case 'auth/requires-recent-login':
            setSettingsError(
              'For security reasons, please log out and log back in before changing your password'
            )
            break
          case 'auth/email-already-in-use':
            setSettingsError('This email is already in use by another account')
            break
          case 'auth/invalid-email':
            setSettingsError('The email address is not valid')
            break
          case 'auth/weak-password':
            setSettingsError('Password should be at least 6 characters')
            break
          case 'auth/too-many-requests':
            setSettingsError(
              'Too many unsuccessful attempts. Please try again later'
            )
            break
          default:
            setSettingsError(`Authentication error: ${error.message}`)
        }
      } else {
        // Regular Error object
        setSettingsError(error.message || 'Failed to update settings')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle removing an item from watchlist with controlled reload
  const handleRemoveFromWatchlist = async (mediaId) => {
    try {
      setLoading((prev) => ({ ...prev, watchlist: true }))
      await removeFromWatchlist(mediaId, 'movie')

      // Update local state instead of reloading the entire profile
      setWatchlistMovies((prev) => prev.filter((movie) => movie.id !== mediaId))

      // Also update the userProfile state to keep it in sync
      setUserProfile((prev) => ({
        ...prev,
        watchlist: (prev.watchlist || []).filter((item) => item.id !== mediaId),
      }))
    } catch (error) {
      console.error('Error removing from watchlist:', error)
    } finally {
      setLoading((prev) => ({ ...prev, watchlist: false }))
    }
  }

  // Handle removing an item from favorites with controlled reload
  const handleRemoveFromFavorites = async (mediaId) => {
    try {
      setLoading((prev) => ({ ...prev, liked: true }))
      await removeFromFavorites(mediaId, 'movie')

      // Update local state instead of reloading the entire profile
      // setLikedMovies((prev) => prev.filter((movie) => movie.id !== mediaId))

      // Also update the userProfile state to keep it in sync
      setUserProfile((prev) => ({
        ...prev,
        favorites: (prev.favorites || []).filter((item) => item.id !== mediaId),
      }))
    } catch (error) {
      console.error('Error removing from favorites:', error)
    } finally {
      setLoading((prev) => ({ ...prev, liked: false }))
    }
  }

  // Handle removing an item from watched with controlled reload
  const handleRemoveFromWatched = async (mediaId) => {
    try {
      setLoading((prev) => ({ ...prev, watched: true }))
      await removeFromWatched(mediaId, 'movie')

      // Update local state instead of reloading the entire profile
      // setWatchedMovies((prev) => prev.filter((movie) => movie.id !== mediaId))

      // Also update the userProfile state to keep it in sync
      setUserProfile((prev) => ({
        ...prev,
        watched: (prev.watched || []).filter((item) => item.id !== mediaId),
      }))
    } catch (error) {
      console.error('Error removing from watched movies:', error)
    } finally {
      setLoading((prev) => ({ ...prev, watched: false }))
    }
  }

  // Movie collection actions
  const collectionActions = {
    liked: (movie) => (
      <>
        <button
          className="text-red-500 hover:text-red-400"
          aria-label="Unlike"
          onClick={() => handleRemoveFromFavorites(movie.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          className="text-[#5ccfee] hover:text-[#4ab3d3]"
          aria-label="View details"
          onClick={() => navigate(`/movie/${movie.id}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </>
    ),
    watchlist: (movie) => (
      <>
        <button
          className="text-[#5ccfee] hover:text-[#4ab3d3]"
          aria-label="View details"
          onClick={() => navigate(`/movie/${movie.id}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          className="text-gray-400 hover:text-gray-300"
          aria-label="Remove from watchlist"
          onClick={() => handleRemoveFromWatchlist(movie.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </>
    ),
    watched: (movie) => (
      <>
        <button
          className="text-[#5ccfee] hover:text-[#4ab3d3]"
          aria-label="View details"
          onClick={() => navigate(`/movie/${movie.id}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          className="text-gray-400 hover:text-gray-300"
          aria-label="Remove from watched"
          onClick={() => handleRemoveFromWatched(movie.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </>
    ),
  }

  // Render a movie collection section
  const MovieCollection = ({
    title,
    movies,
    actions,
    isLoading,
    description,
  }) => (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-gray-200">{title}</h3>
      {description && (
        <p className="text-gray-400 text-xs mb-3">{description}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5ccfee]"></div>
        </div>
      ) : movies.length > 0 ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-3 min-w-max">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                actions={actions(movie)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm py-4 text-center">
          {title === 'Recommended For You'
            ? userProfile?.favoriteGenres?.length > 0
              ? 'No recommended movies found based on your genres. Try selecting different genres!'
              : 'Select favorite genres in your profile to get recommendations'
            : `No ${title.toLowerCase()} found`}
        </div>
      )}
    </div>
  )

  if (!currentUser) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button at the top */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="text-gray-400 hover:text-white flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Side-by-side layout container */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* User Profile Section - Take 60% on larger screens */}
          <div className="md:w-[60%]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Profile</h2>

              <div className="flex gap-3">
                {!isEditingProfile && (
                  <button
                    onClick={handleProfileEdit}
                    className="flex items-center gap-1 text-sm font-medium text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] px-3 py-1.5 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={handleSettingsToggle}
                  className="flex items-center gap-1 text-sm font-medium text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] px-3 py-1.5 rounded-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </button>
              </div>
            </div>

            {/* User info card */}
            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
              {/* Profile header with background */}
              <div className="h-32 bg-gradient-to-r from-[#00BFFF] to-[#5ccfee] relative">
                <div className="absolute -bottom-12 left-8 h-24 w-24 bg-[#1a1a1a] rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                  <div className="h-full w-full bg-[#5ccfee] flex items-center justify-center text-3xl font-bold text-[#1a1a1a]">
                    {userProfile?.displayName?.charAt(0).toUpperCase() ||
                      currentUser?.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </div>
                </div>
              </div>

              {/* Profile content */}
              <div className="pt-16 pb-6 px-8">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold">
                    {isEditingProfile ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full max-w-md"
                        placeholder="Display Name"
                      />
                    ) : (
                      userProfile?.displayName || 'Webflix User'
                    )}
                  </h1>
                  {isEditingProfile ? (
                    <div className="mt-2 mb-2">
                      <label className="block text-sm font-bold text-gray-300 mb-1">
                        USERNAME
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditFormChange}
                        className={`bg-[#252525] text-white px-3 py-1.5 rounded border ${
                          editForm.username && editForm.username.includes(' ')
                            ? 'border-red-500'
                            : 'border-[#333]'
                        } w-full max-w-md`}
                        placeholder="Username (no spaces)"
                      />
                      {editForm.username && editForm.username.includes(' ') && (
                        <p className="text-xs text-red-400 mt-1">
                          Username cannot contain spaces
                        </p>
                      )}
                    </div>
                  ) : (
                    userProfile?.username && (
                      <p className="text-[#5ccfee] font-medium">
                        @{userProfile.username}
                      </p>
                    )
                  )}
                  <p className="text-gray-400">{currentUser?.email}</p>
                </div>

                {/* Bio section */}
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-gray-300 mb-2">
                    ABOUT ME
                  </h2>
                  {isEditingProfile ? (
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleEditFormChange}
                      rows="3"
                      className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full max-w-lg"
                      placeholder="Tell us about yourself and what you like to watch..."
                    ></textarea>
                  ) : (
                    <p className="text-gray-300">
                      {userProfile?.bio ||
                        'No bio yet. Click Edit Profile to add one!'}
                    </p>
                  )}
                </div>

                {/* Display error message for profile form */}
                {isEditingProfile && profileError && (
                  <div className="mb-6 bg-red-500/10 text-red-500 p-3 rounded-md max-w-lg">
                    {profileError}
                  </div>
                )}

                {/* Favorite Genres section */}
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-gray-300 mb-2">
                    FAVORITE GENRES
                  </h2>
                  {isEditingProfile ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {loading.genres ? (
                        <div className="flex items-center text-gray-400 text-xs py-1">
                          <div className="animate-spin h-3 w-3 border-b border-[#5ccfee] rounded-full mr-2"></div>
                          Loading genres...
                        </div>
                      ) : availableGenres.length > 0 ? (
                        availableGenres.map((genre) => (
                          <GenreToggle
                            key={genre}
                            genre={genre}
                            selected={editForm.selectedGenres.includes(genre)}
                            onToggle={handleGenreToggle}
                          />
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No genres available
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userProfile?.favoriteGenres?.length > 0 ? (
                        userProfile.favoriteGenres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-[#252525] text-[#5ccfee] rounded-md text-sm"
                          >
                            {genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No favorite genres selected yet. Click Edit Profile to
                          add some!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatItem
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-2 text-[#5ccfee]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    }
                    label="Watched"
                    value={userStats.totalWatched}
                  />
                  <StatItem
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-2 text-[#5ccfee]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    }
                    label="Favorites"
                    value={userStats.favoriteCount}
                  />
                  <StatItem
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-2 text-[#5ccfee]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    }
                    label="Watchlist"
                    value={userStats.watchlistCount}
                  />
                </div>

                {/* Settings form */}
                {isSettingsOpen && (
                  <div className="bg-[#1e1e1e] rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4">Account Settings</h2>
                    <form onSubmit={handleSettingsSubmit}>
                      <div className="grid gap-4 max-w-md">
                        {/* Error message */}
                        {settingsError && (
                          <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
                            {settingsError}
                          </div>
                        )}

                        {/* Success message */}
                        {settingsSuccess && (
                          <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                            {settingsSuccess}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={settingsForm.email}
                            onChange={handleSettingsFormChange}
                            className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full"
                            placeholder="Email"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Current Password{' '}
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={settingsForm.currentPassword}
                            onChange={handleSettingsFormChange}
                            className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full"
                            placeholder="Current Password"
                            required
                            disabled={isSubmitting}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Required for any account changes
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={settingsForm.newPassword}
                            onChange={handleSettingsFormChange}
                            className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full"
                            placeholder="New Password"
                            disabled={isSubmitting}
                          />
                          {settingsForm.newPassword &&
                            settingsForm.newPassword.length < 6 && (
                              <p className="text-xs text-yellow-400 mt-1">
                                Password must be at least 6 characters
                              </p>
                            )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={settingsForm.confirmPassword}
                            onChange={handleSettingsFormChange}
                            className="bg-[#252525] text-white px-3 py-1.5 rounded border border-[#333] w-full"
                            placeholder="Confirm New Password"
                            disabled={isSubmitting}
                          />
                          {settingsForm.newPassword &&
                            settingsForm.confirmPassword &&
                            settingsForm.newPassword !==
                              settingsForm.confirmPassword && (
                              <p className="text-xs text-red-400 mt-1">
                                Passwords do not match
                              </p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleSettingsToggle}
                            className="px-4 py-2 text-sm font-medium rounded bg-[#252525] text-gray-200 hover:bg-[#333] disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium rounded bg-[#5ccfee] text-black hover:bg-[#4abfe0] disabled:opacity-50 flex items-center justify-center"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></span>
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit profile form submission buttons */}
                {isEditingProfile && (
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded text-white bg-[#333] hover:bg-[#444] disabled:opacity-50"
                      disabled={profileSubmitting}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileSubmit}
                      className="px-4 py-2 rounded text-black bg-[#5ccfee] hover:bg-[#4abfe0] disabled:opacity-50 flex items-center justify-center"
                      disabled={profileSubmitting}
                      type="button"
                    >
                      {profileSubmitting ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Movies Collections Section - Take 40% on larger screens */}
          <div className="md:w-[40%]">
            {loading.profile ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-[#5ccfee] rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Only Watchlist Collection */}
                <div className="bg-[#1e1e1e] rounded-lg shadow-md overflow-hidden border border-[#2a2a2a]">
                  <div className="p-4">
                    <MovieCollection
                      title="My Watchlist"
                      movies={watchlistMovies}
                      actions={collectionActions.watchlist}
                      isLoading={loading.watchlist}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default User
