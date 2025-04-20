import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchGenres } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

// Rainbow colors array for the user to choose from
const RAINBOW_COLORS = [
  { name: 'Red', bg: 'from-red-500 to-red-600', profile: 'bg-red-500' },
  {
    name: 'Orange',
    bg: 'from-orange-500 to-orange-600',
    profile: 'bg-orange-500',
  },
  {
    name: 'Yellow',
    bg: 'from-yellow-500 to-yellow-600',
    profile: 'bg-yellow-500',
  },
  { name: 'Green', bg: 'from-green-500 to-green-600', profile: 'bg-green-500' },
  { name: 'Blue', bg: 'from-blue-500 to-blue-600', profile: 'bg-blue-500' },
  {
    name: 'Indigo',
    bg: 'from-indigo-500 to-indigo-600',
    profile: 'bg-indigo-500',
  },
  {
    name: 'Violet',
    bg: 'from-purple-500 to-purple-600',
    profile: 'bg-purple-500',
  },
  { name: 'Teal', bg: 'from-[#00BFFF] to-[#5ccfee]', profile: 'bg-[#5ccfee]' }, // Default color
]

// Default colors
const DEFAULT_PROFILE_COLOR = '#5ccfee'
const DEFAULT_BANNER_COLOR = '#00BFFF'

// Color utility function to convert HEX to tailwind-compatible format for background
const colorToTailwindBg = (color) => {
  if (!color.startsWith('#')) color = '#' + color
  return `bg-[${color}]`
}

// Generate gradient from a single color using tailwind classes
const generateGradient = (color) => {
  if (!color.startsWith('#')) color = '#' + color
  // Get a slightly darker variant for the gradient
  const darkerHex = darkenColor(color, 20)
  return `from-[${color}] to-[${darkerHex}]`
}

// Function to darken a hex color
const darkenColor = (hex, percent) => {
  // Remove the # if present
  hex = hex.replace('#', '')

  // Parse the hex color to RGB
  let r = parseInt(hex.substring(0, 2), 16)
  let g = parseInt(hex.substring(2, 4), 16)
  let b = parseInt(hex.substring(4, 6), 16)

  // Darken each channel
  r = Math.floor((r * (100 - percent)) / 100)
  g = Math.floor((g * (100 - percent)) / 100)
  b = Math.floor((b * (100 - percent)) / 100)

  // Convert back to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
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
  const [favoritesMovies, setFavoritesMovies] = useState([])
  const [watchedMovies, setWatchedMovies] = useState([])
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
  const [isProfileReady, setIsProfileReady] = useState(false)

  // Form state - initialize once we have userProfile
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    selectedGenres: [],
    profileColor: '',
    bannerColor: '',
    rawProfileColor: '#5ccfee', // Raw hex color for the color picker
    rawBannerColor: '#00BFFF', // Raw hex color for the banner picker
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
        .then(() => {
          setLoading((prev) => ({ ...prev, profile: false }))
          setIsProfileReady(true)
        })
        .catch(() => {
          setLoading((prev) => ({ ...prev, profile: false }))
          setIsProfileReady(true)
        })
    }
  }, [currentUser?.uid])

  // Extract hex color from Tailwind class
  const extractColorFromClass = (colorClass) => {
    if (!colorClass) return DEFAULT_PROFILE_COLOR
    // Extract hex color from classes like bg-[#color] or from-[#color]
    const match = colorClass.match(/\[(#[0-9A-Fa-f]{6})\]/)
    return match ? match[1] : DEFAULT_PROFILE_COLOR
  }

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (isEditingProfile) {
      // Extract raw colors from Tailwind classes if they exist
      const profileRawColor =
        extractColorFromClass(userProfile?.profileColor) ||
        DEFAULT_PROFILE_COLOR
      const bannerRawColor =
        extractColorFromClass(userProfile?.bannerColor) || DEFAULT_BANNER_COLOR

      setEditForm({
        name: userProfile?.displayName || '',
        username: userProfile?.username || '',
        bio: userProfile?.bio || '',
        selectedGenres: userProfile?.favoriteGenres || [],
        profileColor:
          userProfile?.profileColor || colorToTailwindBg(DEFAULT_PROFILE_COLOR),
        bannerColor:
          userProfile?.bannerColor || generateGradient(DEFAULT_BANNER_COLOR),
        rawProfileColor: profileRawColor,
        rawBannerColor: bannerRawColor,
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

    // Helper function to extract genre from various possible formats
    const extractGenre = (movie) => {
      let genre = undefined // No default genre

      console.log('Extracting genre from movie:', movie.id || 'unknown')

      // Check for _directGenre which is our preprocessed value for reliable genre
      if (movie._directGenre) {
        genre = movie._directGenre
        console.log('Using preprocessed _directGenre property:', genre)
        return genre
      }

      // Try the direct genre property next as it's most reliable
      if (movie.genre && typeof movie.genre === 'string') {
        genre = movie.genre
        console.log('Found direct genre property:', genre)
        return genre
      }

      // Next check for hasGenreIds flag or direct genre_ids
      if (
        (movie.hasGenreIds || movie.genre_ids) &&
        Array.isArray(movie.genre_ids) &&
        movie.genre_ids.length > 0
      ) {
        // In a real app, we would map these IDs to names using a genre map
        // For now, just indicate we found the genre ID
        genre = `Genre ${movie.genre_ids[0]}`
        console.log('Using genre from genre_ids:', genre)
        return genre
      }

      // Then check if the raw data has genres property (could be from parsed JSON)
      if (movie.genres) {
        console.log('Movie has genres property:', typeof movie.genres)

        // Handle genres if it's already an array
        if (Array.isArray(movie.genres)) {
          if (movie.genres.length > 0) {
            // Could be array of objects with name
            if (typeof movie.genres[0] === 'object' && movie.genres[0].name) {
              genre = movie.genres[0].name
              console.log('Genre from array of objects:', genre)
              return genre
            }
            // Or array of strings
            else if (typeof movie.genres[0] === 'string') {
              genre = movie.genres[0]
              console.log('Genre from array of strings:', genre)
              return genre
            }
            // Or array of numbers (genre IDs)
            else if (typeof movie.genres[0] === 'number') {
              genre = `Genre ${movie.genres[0]}`
              console.log('Genre from array of numbers (IDs):', genre)
              return genre
            }
          }
        }
        // Could be a string that needs parsing
        else if (typeof movie.genres === 'string') {
          // First see if it's a simple genre name
          if (!movie.genres.includes('{') && !movie.genres.includes('[')) {
            genre = movie.genres
            console.log('Using genres string directly as genre:', genre)
            return genre
          }

          // Try to parse it as JSON
          try {
            const parsedGenres = JSON.parse(movie.genres)
            console.log('Parsed genres from string:', typeof parsedGenres)

            if (Array.isArray(parsedGenres)) {
              if (parsedGenres.length > 0) {
                if (
                  typeof parsedGenres[0] === 'object' &&
                  parsedGenres[0].name
                ) {
                  genre = parsedGenres[0].name
                  console.log('Genre from parsed JSON object:', genre)
                  return genre
                } else if (typeof parsedGenres[0] === 'string') {
                  genre = parsedGenres[0]
                  console.log('Genre from parsed JSON string array:', genre)
                  return genre
                } else if (typeof parsedGenres[0] === 'number') {
                  genre = `Genre ${parsedGenres[0]}`
                  console.log(
                    'Genre from parsed JSON number array (IDs):',
                    genre
                  )
                  return genre
                } else {
                  genre = String(parsedGenres[0])
                  console.log('Genre from generic parsed JSON:', genre)
                  return genre
                }
              }
            } else if (typeof parsedGenres === 'object') {
              // Maybe it's a single object with a name
              if (parsedGenres.name) {
                genre = parsedGenres.name
                console.log('Genre from parsed JSON single object:', genre)
                return genre
              }
            }
          } catch (error) {
            // Not JSON, just use the string
            console.log('Error parsing JSON genres:', error.message)
            genre = movie.genres
            console.log('Using raw genres string as genre:', genre)
            return genre
          }
        }
      }

      // Last resort: look for other fields that might contain genre-related info
      if (movie.type === 'movie' && typeof movie.media_type === 'string') {
        console.log('Using media_type as genre:', movie.media_type)
        return (
          movie.media_type.charAt(0).toUpperCase() + movie.media_type.slice(1)
        )
      }

      console.log('No genre found for movie')
      return genre // Return undefined if no genre found
    }

    // Helper function to format movie data consistently
    const formatMovieData = (movie) => {
      const extractedGenre = extractGenre(movie)
      console.log(
        `Formatted movie ${movie.id || 'unknown'} with genre: ${
          extractedGenre || 'none'
        }`
      )

      // Make sure all fields match what the MovieCard component expects
      return {
        id: movie.id,
        title: movie.title || movie.name || 'Unknown Title',
        // The poster will be formatted by UserMovieCard wrapper
        poster: movie.poster || null,
        poster_path: movie.poster_path || null,
        year:
          movie.year ||
          (movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'),
        rating:
          typeof movie.rating === 'number'
            ? movie.rating.toFixed(1)
            : movie.rating || movie.vote_average || 'N/A',
        genre: extractedGenre, // Can be undefined now
        type: movie.type || movie.media_type || 'movie',
        watchedAt: movie.watchedAt || null, // Only used for watched movies
      }
    }

    try {
      // Format favorites data
      setLoading((prev) => ({ ...prev, liked: true }))
      if (userProfile.favorites && userProfile.favorites.length > 0) {
        console.log(
          'Processing favorites from Firestore:',
          userProfile.favorites
        )

        // First, check if we need to parse genre IDs to names using our genre mapping
        const favoriteMoviesWithGenres = userProfile.favorites
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            // Log the raw movie data to diagnose genre issues
            console.log(
              'Raw favorite movie data:',
              JSON.stringify(movie, null, 2)
            )

            // Pre-process genre data if it's in a different format
            if (
              movie.genre_ids &&
              Array.isArray(movie.genre_ids) &&
              movie.genre_ids.length > 0
            ) {
              // This is likely from TMDB API with numeric IDs
              // We'll just save the fact that we have genre IDs and handle it in formatMovieData
              console.log('Movie has genre_ids:', movie.genre_ids)
              movie.hasGenreIds = true
            }

            // If genre name is available directly in the genre field, prioritize it
            if (movie.genre && typeof movie.genre === 'string') {
              console.log('Movie has direct genre name:', movie.genre)
              // Ensure it's preserved
              movie._directGenre = movie.genre
            }

            return movie
          })

        const formattedFavorites = favoriteMoviesWithGenres.map((movie) => {
          const formatted = formatMovieData(movie)
          // Double-check if we have a direct genre that should be used
          if (movie._directGenre && !formatted.genre) {
            formatted.genre = movie._directGenre
            console.log(
              `Using direct genre for movie ${movie.id}: ${formatted.genre}`
            )
          }
          return formatted
        })

        // Debug: log all formatted favorites with their genres
        console.log('All formatted favorites with genres:')
        formattedFavorites.forEach((movie) => {
          console.log(
            `Movie ${movie.id}: "${movie.title}" - Genre: ${
              movie.genre || 'MISSING'
            }`
          )
        })

        setFavoritesMovies(formattedFavorites)
        console.log('Formatted favorites:', formattedFavorites)
      } else {
        setFavoritesMovies([])
        console.log('No favorites found in user profile')
      }
      setLoading((prev) => ({ ...prev, liked: false }))

      // Format watchlist data
      setLoading((prev) => ({ ...prev, watchlist: true }))
      if (userProfile.watchlist && userProfile.watchlist.length > 0) {
        console.log(
          'Processing watchlist from Firestore:',
          userProfile.watchlist
        )

        // Pre-process similar to favorites
        const watchlistWithGenres = userProfile.watchlist
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            // Log the raw movie data to diagnose genre issues
            console.log(
              'Raw watchlist movie data:',
              JSON.stringify(movie, null, 2)
            )

            // Pre-process genre data if it's in a different format
            if (
              movie.genre_ids &&
              Array.isArray(movie.genre_ids) &&
              movie.genre_ids.length > 0
            ) {
              // This is likely from TMDB API with numeric IDs
              movie.hasGenreIds = true
            }

            // If genre name is available directly in the genre field, prioritize it
            if (movie.genre && typeof movie.genre === 'string') {
              console.log('Movie has direct genre name:', movie.genre)
              // Ensure it's preserved
              movie._directGenre = movie.genre
            }

            return movie
          })

        const formattedWatchlist = watchlistWithGenres.map((movie) => {
          const formatted = formatMovieData(movie)
          // Double-check if we have a direct genre that should be used
          if (movie._directGenre && !formatted.genre) {
            formatted.genre = movie._directGenre
            console.log(
              `Using direct genre for movie ${movie.id}: ${formatted.genre}`
            )
          }
          return formatted
        })

        setWatchlistMovies(formattedWatchlist)
        console.log('Formatted watchlist movies:', formattedWatchlist)
      } else {
        setWatchlistMovies([])
        console.log('No watchlist items found in user profile')
      }
      setLoading((prev) => ({ ...prev, watchlist: false }))

      // Format watched movies data
      setLoading((prev) => ({ ...prev, watched: true }))
      if (userProfile.watched && userProfile.watched.length > 0) {
        console.log(
          'Processing watched movies from Firestore:',
          userProfile.watched
        )

        // Pre-process similar to favorites and watchlist
        const watchedWithGenres = userProfile.watched
          .filter((item) => item && item.id) // Ensure the item is valid
          .map((movie) => {
            // Log the raw movie data to diagnose genre issues
            console.log(
              'Raw watched movie data:',
              JSON.stringify(movie, null, 2)
            )

            // Pre-process genre data if it's in a different format
            if (
              movie.genre_ids &&
              Array.isArray(movie.genre_ids) &&
              movie.genre_ids.length > 0
            ) {
              // This is likely from TMDB API with numeric IDs
              movie.hasGenreIds = true
            }

            // If genre name is available directly in the genre field, prioritize it
            if (movie.genre && typeof movie.genre === 'string') {
              console.log('Movie has direct genre name:', movie.genre)
              // Ensure it's preserved
              movie._directGenre = movie.genre
            }

            return movie
          })

        const formattedWatched = watchedWithGenres.map((movie) => {
          const formattedMovie = formatMovieData(movie)
          formattedMovie.watchedAt = movie.watchedAt || 'N/A' // Add watchedAt date

          // Double-check if we have a direct genre that should be used
          if (movie._directGenre && !formattedMovie.genre) {
            formattedMovie.genre = movie._directGenre
            console.log(
              `Using direct genre for movie ${movie.id}: ${formattedMovie.genre}`
            )
          }

          return formattedMovie
        })

        // Debug: log all formatted watched movies with their genres
        console.log('All formatted watched movies with genres:')
        formattedWatched.forEach((movie) => {
          console.log(
            `Movie ${movie.id}: "${movie.title}" - Genre: ${
              movie.genre || 'MISSING'
            }`
          )
        })

        setWatchedMovies(formattedWatched)
        console.log('Formatted watched movies:', formattedWatched)
      } else {
        setWatchedMovies([])
        console.log('No watched movies found in user profile')
      }
      setLoading((prev) => ({ ...prev, watched: false }))
    } catch (error) {
      console.error('Error formatting user profile data:', error)
      setLoading((prev) => ({
        ...prev,
        liked: false,
        watchlist: false,
        watched: false,
      }))
    }
  }, [userProfile]) // Only depend on userProfile changes

  // Event handlers
  const handleGoBack = () => navigate(-1)

  const handleProfileEdit = () => {
    // Get raw colors - either from the userProfile object or extract from Tailwind classes
    const rawProfileColor =
      userProfile?.rawProfileColor ||
      extractColorFromClass(userProfile?.profileColor) ||
      DEFAULT_PROFILE_COLOR

    const rawBannerColor =
      userProfile?.rawBannerColor ||
      extractColorFromClass(userProfile?.bannerColor) ||
      DEFAULT_BANNER_COLOR

    // Initialize the form with current userProfile data
    setEditForm({
      name: userProfile?.displayName || '',
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
      selectedGenres: userProfile?.favoriteGenres || [],
      profileColor:
        userProfile?.profileColor || colorToTailwindBg(DEFAULT_PROFILE_COLOR),
      bannerColor:
        userProfile?.bannerColor || generateGradient(DEFAULT_BANNER_COLOR),
      rawProfileColor: rawProfileColor,
      rawBannerColor: rawBannerColor,
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

    // Validate color format
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (
      !hexRegex.test(editForm.rawProfileColor) ||
      !hexRegex.test(editForm.rawBannerColor)
    ) {
      setProfileError('Invalid color format. Please use valid hex colors.')
      return
    }

    setLoading((prev) => ({ ...prev, profile: true }))
    setProfileSubmitting(true)
    setProfileError('') // Clear any errors

    try {
      // Store both raw color values and Tailwind classes
      // This ensures backward compatibility and provides raw values for extraction
      const rawProfileColor = editForm.rawProfileColor
      const rawBannerColor = editForm.rawBannerColor

      // Convert to Tailwind classes
      const profileColor = colorToTailwindBg(rawProfileColor)
      const bannerColor = generateGradient(rawBannerColor)

      // Update the user profile data with both raw and formatted values
      const profileData = {
        displayName: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        profileColor: profileColor,
        bannerColor: bannerColor,
        rawProfileColor: rawProfileColor,
        rawBannerColor: rawBannerColor,
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

      // Update local userProfile to reflect the changes immediately
      setUserProfile((prev) => ({
        ...prev,
        displayName: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        profileColor: profileColor,
        bannerColor: bannerColor,
        rawProfileColor: rawProfileColor,
        rawBannerColor: rawBannerColor,
      }))

      // Success! Close the editing form
      setIsEditingProfile(false)

      // Display success message (could be implemented with a toast notification)
      console.log(
        'Profile successfully updated with colors:',
        profileColor,
        bannerColor
      )
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
      setFavoritesMovies((prev) => prev.filter((movie) => movie.id !== mediaId))

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
      setWatchedMovies((prev) => prev.filter((movie) => movie.id !== mediaId))

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

  // Custom wrapper for MovieCard to support actions in user collections
  const UserMovieCard = ({ movie, actions }) => {
    // Process the movie data to ensure proper genre display
    const processedMovie = {
      ...movie,
      // Format the poster URL properly
      poster:
        movie.poster && movie.poster.includes('http')
          ? movie.poster
          : movie.poster_path
          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
          : 'https://via.placeholder.com/342x513?text=No+Image',
    }

    // Create a custom MovieCard to handle genre display for user collections
    const UserMovieCardDisplay = () => {
      const { id, type = 'movie', title, poster, rating, year } = processedMovie
      const [imageLoaded, setImageLoaded] = useState(false)

      // Always display media type instead of genre
      const displayMediaType = type === 'movie' ? 'Movie' : 'TV Show'

      if (!poster) return null

      return (
        <div className="relative bg-[#1e1e1e] rounded overflow-hidden h-full">
          <Link
            to={`/${type}/${id}`}
            className="block hover:translate-y-[-4px] transition-transform duration-200 cursor-pointer"
          >
            <div className="aspect-[2/3] relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[#333] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={poster}
                alt={title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
              {rating && (
                <div className="absolute top-0 right-0 bg-black/50 px-1.5 py-0.5 m-1.5 rounded text-xs">
                  <span className="text-[#5ccfee]">{rating}</span>
                </div>
              )}

              {/* Show media type (Movie/TV Show) instead of genre */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5ccfee] font-medium">
                    {displayMediaType}
                  </span>
                  {year && (
                    <span className="text-xs text-gray-300">{year}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2">
              <h3 className="text-sm text-gray-200 font-medium truncate">
                {title}
              </h3>
            </div>
          </Link>
        </div>
      )
    }

    return (
      <div className="relative flex-shrink-0 w-36 mb-6">
        <UserMovieCardDisplay />
        {actions && (
          <div className="absolute -bottom-6 left-0 right-0 px-2 py-1 bg-[#1e1e1e] flex justify-center gap-4 border-t border-[#333]">
            {actions}
          </div>
        )}
      </div>
    )
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
        <div className="overflow-x-auto pb-8 pt-1">
          <div className="flex space-x-4 min-w-max">
            {movies.map((movie) => (
              <UserMovieCard
                key={movie.id}
                movie={movie}
                actions={actions(movie)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm py-4 text-center">
          {title === 'My Watchlist'
            ? "You haven't added any movies to your watchlist yet"
            : title === 'My Favorites'
            ? "You haven't favorited any movies yet"
            : title === 'Watched Movies'
            ? "You haven't marked any movies as watched yet"
            : title === 'Recommended For You'
            ? userProfile?.favoriteGenres?.length > 0
              ? 'No recommended movies found based on your genres. Try selecting different genres!'
              : 'Select favorite genres in your profile to get recommendations'
            : `No ${title.toLowerCase()} found`}
        </div>
      )}
    </div>
  )

  // Handle color selection for profile and banner
  const handleColorChange = (e) => {
    const { name, value } = e.target
    let colorHex = value

    // Ensure hex has # prefix
    if (!colorHex.startsWith('#') && colorHex.length > 0) {
      colorHex = '#' + colorHex
    }

    // Check if it's a valid hex color
    const isValidHex = /^#([0-9A-Fa-f]{3}){1,2}$/.test(colorHex)

    if (name === 'rawProfileColor') {
      // Always update the raw color
      const newState = {
        ...editForm,
        rawProfileColor: colorHex,
      }

      // Only update the Tailwind class if it's a valid hex
      if (isValidHex) {
        newState.profileColor = colorToTailwindBg(colorHex)
      }

      setEditForm(newState)
    } else if (name === 'rawBannerColor') {
      // Always update the raw color
      const newState = {
        ...editForm,
        rawBannerColor: colorHex,
      }

      // Only update the Tailwind class if it's a valid hex
      if (isValidHex) {
        newState.bannerColor = generateGradient(colorHex)
      }

      setEditForm(newState)
    }
  }

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
              {/* Profile header with background - show loading state until ready */}
              {!isProfileReady && !isEditingProfile ? (
                <div className="h-32 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse relative">
                  <div className="absolute -bottom-12 left-8 h-24 w-24 bg-[#1a1a1a] rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                    <div className="h-full w-full bg-gray-600 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    isEditingProfile ? 'h-32 relative' : 'h-32 relative'
                  }
                  style={
                    isEditingProfile
                      ? {
                          background: `linear-gradient(to right, ${
                            editForm.rawBannerColor || '#00BFFF'
                          }, ${darkenColor(
                            editForm.rawBannerColor || '#00BFFF',
                            20
                          )})`,
                        }
                      : {
                          background: userProfile?.rawBannerColor
                            ? `linear-gradient(to right, ${
                                userProfile.rawBannerColor
                              }, ${darkenColor(
                                userProfile.rawBannerColor,
                                20
                              )})`
                            : `linear-gradient(to right, #00BFFF, ${darkenColor(
                                '#00BFFF',
                                20
                              )})`,
                        }
                  }
                >
                  <div className="absolute -bottom-12 left-8 h-24 w-24 bg-[#1a1a1a] rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full w-full flex items-center justify-center text-3xl font-bold text-[#1a1a1a]"
                      style={
                        isEditingProfile
                          ? {
                              backgroundColor:
                                editForm.rawProfileColor || '#5ccfee',
                            }
                          : {
                              backgroundColor:
                                userProfile?.rawProfileColor || '#5ccfee',
                            }
                      }
                    >
                      {userProfile?.displayName?.charAt(0).toUpperCase() ||
                        currentUser?.email?.charAt(0).toUpperCase() ||
                        'U'}
                    </div>
                  </div>
                </div>
              )}

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

                {/* Color settings section (only in edit mode) */}
                {isEditingProfile && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-300 mb-2">
                      PROFILE COLORS
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Profile Logo Color Picker */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Profile Logo Color
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              name="rawProfileColor"
                              value={editForm.rawProfileColor || '#5ccfee'}
                              onChange={handleColorChange}
                              className="w-10 h-10 rounded-full overflow-hidden appearance-none cursor-pointer"
                              style={{
                                opacity: 0,
                                position: 'absolute',
                                zIndex: 10,
                              }}
                            />
                            <div
                              className={`w-10 h-10 rounded-full cursor-pointer border-2 border-white`}
                              style={{
                                backgroundColor: editForm.rawProfileColor,
                              }}
                            ></div>
                          </div>
                          <div className="flex-1">
                            <div className="relative flex items-center">
                              <span className="px-3 bg-[#1e1e1e] text-gray-400 absolute">
                                #
                              </span>
                              <input
                                type="text"
                                value={(
                                  editForm.rawProfileColor || '#5ccfee'
                                ).replace('#', '')}
                                onChange={(e) =>
                                  handleColorChange({
                                    target: {
                                      name: 'rawProfileColor',
                                      value: `#${e.target.value}`,
                                    },
                                  })
                                }
                                className="bg-[#1e1e1e] text-white px-7 py-1 rounded border border-[#333] w-full focus:outline-none focus:ring-1 focus:ring-[#5ccfee]"
                                placeholder="Color hex code"
                                maxLength="6"
                                pattern="[0-9A-Fa-f]{6}"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Click on the color circle to open the color picker
                        </div>
                      </div>

                      {/* Banner Color Picker */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Banner Gradient Color
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              name="rawBannerColor"
                              value={editForm.rawBannerColor || '#00BFFF'}
                              onChange={handleColorChange}
                              className="w-10 h-10 rounded cursor-pointer appearance-none"
                              style={{
                                opacity: 0,
                                position: 'absolute',
                                zIndex: 10,
                              }}
                            />
                            <div
                              className="w-16 h-10 rounded cursor-pointer border-2 border-white"
                              style={{
                                background: `linear-gradient(to right, ${
                                  editForm.rawBannerColor
                                }, ${darkenColor(
                                  editForm.rawBannerColor,
                                  20
                                )})`,
                              }}
                            ></div>
                          </div>
                          <div className="flex-1">
                            <div className="relative flex items-center">
                              <span className="px-3 bg-[#1e1e1e] text-gray-400 absolute">
                                #
                              </span>
                              <input
                                type="text"
                                value={(
                                  editForm.rawBannerColor || '#00BFFF'
                                ).replace('#', '')}
                                onChange={(e) =>
                                  handleColorChange({
                                    target: {
                                      name: 'rawBannerColor',
                                      value: `#${e.target.value}`,
                                    },
                                  })
                                }
                                className="bg-[#1e1e1e] text-white px-7 py-1 rounded border border-[#333] w-full focus:outline-none focus:ring-1 focus:ring-[#5ccfee]"
                                placeholder="Color hex code"
                                maxLength="6"
                                pattern="[0-9A-Fa-f]{6}"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          A gradient will be automatically created from your
                          selected color
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                {/* Watchlist Collection */}
                <div className="bg-[#1e1e1e] rounded-lg shadow-md overflow-hidden border border-[#2a2a2a]">
                  <div className="p-4">
                    <MovieCollection
                      title="My Watchlist"
                      movies={watchlistMovies}
                      actions={collectionActions.watchlist}
                      isLoading={loading.watchlist}
                      description="Movies and shows you want to watch later"
                    />
                  </div>
                </div>

                {/* Favorites Collection */}
                <div className="bg-[#1e1e1e] rounded-lg shadow-md overflow-hidden border border-[#2a2a2a]">
                  <div className="p-4">
                    <MovieCollection
                      title="My Favorites"
                      movies={favoritesMovies}
                      actions={collectionActions.liked}
                      isLoading={loading.liked}
                      description="Movies and shows you've marked as favorites"
                    />
                  </div>
                </div>

                {/* Watched Collection */}
                <div className="bg-[#1e1e1e] rounded-lg shadow-md overflow-hidden border border-[#2a2a2a]">
                  <div className="p-4">
                    <MovieCollection
                      title="Watched Movies"
                      movies={watchedMovies}
                      actions={collectionActions.watched}
                      isLoading={loading.watched}
                      description="Movies and shows you've already watched"
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
