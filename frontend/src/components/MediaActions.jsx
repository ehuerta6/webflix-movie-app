import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * MediaActions component - Provides UI for user to interact with media items
 * (add to favorites, watchlist, etc.)
 */
function MediaActions({ media }) {
  const {
    currentUser,
    userProfile,
    addToWatchlist,
    removeFromWatchlist,
    addToFavorites,
    removeFromFavorites,
    fetchUserProfile,
  } = useAuth()

  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isInFavorites, setIsInFavorites] = useState(false)
  const [isLoading, setIsLoading] = useState({
    watchlist: false,
    favorites: false,
  })

  // Check if the media is in the user's watchlist or favorites
  useEffect(() => {
    if (userProfile) {
      // Check watchlist
      const watchlistItem = userProfile.watchlist?.find(
        (item) =>
          item.id === media.id && item.type === (media.media_type || media.type)
      )
      setIsInWatchlist(!!watchlistItem)

      // Check favorites
      const favoritesItem = userProfile.favorites?.find(
        (item) =>
          item.id === media.id && item.type === (media.media_type || media.type)
      )
      setIsInFavorites(!!favoritesItem)
    } else {
      // Reset states if userProfile is null
      setIsInWatchlist(false)
      setIsInFavorites(false)
    }
  }, [userProfile, media])

  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    if (!currentUser) return

    setIsLoading((prev) => ({ ...prev, watchlist: true }))

    try {
      if (isInWatchlist) {
        // Format needed for removeFromWatchlist
        const mediaId = media.id
        const mediaType = media.media_type || media.type

        console.log('Removing from watchlist:', { mediaId, mediaType })
        await removeFromWatchlist(mediaId, mediaType)
      } else {
        // Format media data for addToWatchlist
        const formattedMedia = {
          id: media.id,
          title: media.title || media.name,
          poster_path: media.poster || media.poster_path,
          media_type: media.media_type || media.type,
          vote_average: media.rating
            ? parseFloat(media.rating)
            : media.vote_average || 0,
          release_date: media.year
            ? `${media.year}-01-01`
            : media.release_date || media.first_air_date || null,
          overview: media.description || media.overview || '',
        }

        console.log('Adding to watchlist:', formattedMedia)
        // Pass all three required parameters: userId, mediaId, and stringified media data
        await addToWatchlist(
          currentUser.uid,
          formattedMedia.id,
          JSON.stringify(formattedMedia)
        )
      }

      // Refresh user profile data to get updated watchlist
      await fetchUserProfile()
    } catch (error) {
      console.error('Error updating watchlist:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, watchlist: false }))
    }
  }

  // Handle favorites toggle
  const handleFavoritesToggle = async () => {
    if (!currentUser) return

    setIsLoading((prev) => ({ ...prev, favorites: true }))

    try {
      if (isInFavorites) {
        // Format needed for removeFromFavorites
        const mediaId = media.id
        const mediaType = media.media_type || media.type

        console.log('Removing from favorites:', { mediaId, mediaType })
        await removeFromFavorites(mediaId, mediaType)
      } else {
        // Format media data for addToFavorites
        const formattedMedia = {
          id: media.id,
          title: media.title || media.name,
          poster_path: media.poster || media.poster_path,
          media_type: media.media_type || media.type,
          vote_average: media.rating
            ? parseFloat(media.rating)
            : media.vote_average || 0,
          release_date: media.year
            ? `${media.year}-01-01`
            : media.release_date || media.first_air_date || null,
          overview: media.description || media.overview || '',
        }

        console.log('Adding to favorites:', formattedMedia)
        // Update to match the updated addToFavorites function signature
        await addToFavorites(
          currentUser.uid,
          formattedMedia.id,
          JSON.stringify(formattedMedia)
        )
      }

      // Refresh user profile data to get updated favorites
      await fetchUserProfile()
    } catch (error) {
      console.error('Error updating favorites:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, favorites: false }))
    }
  }

  // Don't show actions if user is not logged in
  if (!currentUser) return null

  return (
    <div className="flex gap-2">
      <button
        onClick={handleWatchlistToggle}
        disabled={isLoading.watchlist}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isInWatchlist
            ? 'bg-[#5ccfee] text-black hover:bg-[#4ab3d3]'
            : 'bg-[#252525] text-white hover:bg-[#333]'
        }`}
      >
        {isLoading.watchlist ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <>
            {isInWatchlist ? (
              /* Filled watchlist icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              /* Outline watchlist icon */
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            )}
          </>
        )}
        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
      </button>

      <button
        onClick={handleFavoritesToggle}
        disabled={isLoading.favorites}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isInFavorites
            ? 'bg-[#5ccfee] text-black hover:bg-[#4ab3d3]'
            : 'bg-[#252525] text-white hover:bg-[#333]'
        }`}
      >
        {isLoading.favorites ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <>
            {isInFavorites ? (
              /* Filled heart icon */
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
            ) : (
              /* Outline heart icon */
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </>
        )}
        {isInFavorites ? 'Favorited' : 'Add to Favorites'}
      </button>
    </div>
  )
}

export default MediaActions
