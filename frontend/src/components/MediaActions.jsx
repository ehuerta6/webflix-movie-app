import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/**
 * MediaActions component displays buttons for adding content to watchlist, favorites, and marking as watched
 * @param {Object} props
 * @param {Object} props.mediaData - The movie or TV show data
 * @param {Object} props.collectionStatus - Optional object containing current collection status
 */
function MediaActions({ mediaData, collectionStatus }) {
  const {
    currentUser,
    userProfile,
    addToWatchlist,
    addToFavorites,
    addToWatched,
    removeFromWatchlist,
    removeFromFavorites,
    removeFromWatched,
  } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState({
    watchlist: false,
    favorites: false,
    watched: false,
  })
  const [actionStates, setActionStates] = useState({
    watchlistSuccess: false,
    favoritesSuccess: false,
    watchedSuccess: false,
    error: '',
  })

  // Initialize local state based on props or userProfile
  const [localCollectionStatus, setLocalCollectionStatus] = useState({
    isInWatchlist: false,
    isInFavorites: false,
    isWatched: false,
  })

  // Update local state when props or userProfile changes
  useEffect(() => {
    if (collectionStatus) {
      // If collectionStatus is provided via props, use it
      setLocalCollectionStatus({
        isInWatchlist: collectionStatus.isInWatchlist || false,
        isInFavorites: collectionStatus.isInFavorites || false,
        isWatched: collectionStatus.isWatched || false,
      })
    } else {
      // Otherwise, check against userProfile
      setLocalCollectionStatus({
        isInWatchlist:
          userProfile?.watchlist?.some(
            (item) =>
              item.id === mediaData.id &&
              item.type === (mediaData.media_type || mediaData.type)
          ) || false,
        isInFavorites:
          userProfile?.favorites?.some(
            (item) =>
              item.id === mediaData.id &&
              item.type === (mediaData.media_type || mediaData.type)
          ) || false,
        isWatched:
          userProfile?.watched?.some(
            (item) =>
              item.id === mediaData.id &&
              item.type === (mediaData.media_type || mediaData.type)
          ) || false,
      })
    }
  }, [collectionStatus, userProfile, mediaData])

  // Return early if user not logged in or no media data
  if (!currentUser || !mediaData) return null

  // Handle adding to watchlist
  const handleWatchlist = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, watchlist: true }))
    setActionStates((prev) => ({ ...prev, watchlistSuccess: false, error: '' }))

    try {
      if (localCollectionStatus.isInWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(mediaData.id, mediaData.media_type || 'movie')
        // Update local state immediately without showing success state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isInWatchlist: false,
        }))
      } else {
        // Add to watchlist
        await addToWatchlist(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )
        // Update local state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isInWatchlist: true,
        }))

        // Only show success state when adding to watchlist
        setActionStates((prev) => ({ ...prev, watchlistSuccess: true }))

        // Auto-clear success state after 3 seconds
        setTimeout(() => {
          setActionStates((prev) => ({ ...prev, watchlistSuccess: false }))
        }, 3000)
      }
    } catch (error) {
      console.error('Watchlist action failed:', error)
      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update watchlist',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, watchlist: false }))
    }
  }

  // Handle adding to favorites
  const handleFavorites = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, favorites: true }))
    setActionStates((prev) => ({ ...prev, favoritesSuccess: false, error: '' }))

    try {
      if (localCollectionStatus.isInFavorites) {
        // Remove from favorites
        await removeFromFavorites(mediaData.id, mediaData.media_type || 'movie')
        // Update local state immediately without showing success state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isInFavorites: false,
        }))
      } else {
        // Add to favorites
        await addToFavorites(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )
        // Update local state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isInFavorites: true,
        }))

        // Only show success state when adding to favorites
        setActionStates((prev) => ({ ...prev, favoritesSuccess: true }))

        // Auto-clear success state after 3 seconds
        setTimeout(() => {
          setActionStates((prev) => ({ ...prev, favoritesSuccess: false }))
        }, 3000)
      }
    } catch (error) {
      console.error('Favorites action failed:', error)
      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update favorites',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, favorites: false }))
    }
  }

  // Handle marking as watched
  const handleWatched = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, watched: true }))
    setActionStates((prev) => ({ ...prev, watchedSuccess: false, error: '' }))

    try {
      if (localCollectionStatus.isWatched) {
        // Remove from watched
        await removeFromWatched(mediaData.id, mediaData.media_type || 'movie')
        // Update local state immediately without showing success state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isWatched: false,
        }))
      } else {
        // Add to watched
        await addToWatched(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )
        // Update local state
        setLocalCollectionStatus((prev) => ({
          ...prev,
          isWatched: true,
        }))

        // Only show success state when adding to watched
        setActionStates((prev) => ({ ...prev, watchedSuccess: true }))

        // Auto-clear success state after 3 seconds
        setTimeout(() => {
          setActionStates((prev) => ({ ...prev, watchedSuccess: false }))
        }, 3000)
      }
    } catch (error) {
      console.error('Watched action failed:', error)
      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update watched status',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, watched: false }))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {/* Watchlist Button */}
        <button
          onClick={handleWatchlist}
          disabled={isLoading.watchlist}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            actionStates.watchlistSuccess
              ? 'bg-purple-600 text-white'
              : localCollectionStatus.isInWatchlist
              ? 'bg-[#2a2a2a] text-white border border-[#5ccfee]'
              : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          {isLoading.watchlist ? (
            <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          )}
          {localCollectionStatus.isInWatchlist
            ? 'In Watchlist'
            : 'Add to Watchlist'}
        </button>

        {/* Favorites Button */}
        <button
          onClick={handleFavorites}
          disabled={isLoading.favorites}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            actionStates.favoritesSuccess
              ? 'bg-red-600 text-white'
              : localCollectionStatus.isInFavorites
              ? 'bg-[#2a2a2a] text-red-500 border border-red-500'
              : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          {isLoading.favorites ? (
            <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill={
                localCollectionStatus.isInFavorites ? 'currentColor' : 'none'
              }
              stroke="currentColor"
              strokeWidth={localCollectionStatus.isInFavorites ? '0' : '2'}
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {localCollectionStatus.isInFavorites
            ? 'Favorite'
            : 'Add to Favorites'}
        </button>

        {/* Watched Button */}
        <button
          onClick={handleWatched}
          disabled={isLoading.watched}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            actionStates.watchedSuccess
              ? 'bg-green-600 text-white'
              : localCollectionStatus.isWatched
              ? 'bg-[#2a2a2a] text-[#5ccfee] border border-[#5ccfee]'
              : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          {isLoading.watched ? (
            <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {localCollectionStatus.isWatched ? 'Watched' : 'Mark as Watched'}
        </button>
      </div>

      {/* Error Message */}
      {actionStates.error && (
        <p className="text-red-500 text-sm mt-2">{actionStates.error}</p>
      )}
    </div>
  )
}

export default MediaActions
