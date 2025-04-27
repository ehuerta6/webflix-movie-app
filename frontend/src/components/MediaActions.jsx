import { useState, useEffect, useCallback, memo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Spinner } from './common'

/**
 * MediaActions component displays buttons for adding content to watchlist, favorites, and marking as watched
 * @param {Object} props
 * @param {Object} props.mediaData - The movie or TV show data
 * @param {Object} props.collectionStatus - Optional object containing current collection status
 * @param {Function} props.onActionComplete - Optional callback that fires when an action completes
 */
const MediaActions = memo(function MediaActions({
  mediaData,
  collectionStatus,
  onActionComplete,
}) {
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

  // State for loading indicators and action states
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
  // This avoids re-renders when parent components change by keeping state locally
  const [localCollectionStatus, setLocalCollectionStatus] = useState({
    isInWatchlist: false,
    isInFavorites: false,
    isWatched: false,
  })

  // Clear success state after delay
  const clearSuccessState = useCallback((key) => {
    setTimeout(() => {
      setActionStates((prev) => ({ ...prev, [key]: false }))
    }, 3000)
  }, [])

  // Handle adding to watchlist with optimistic updates
  const handleWatchlist = useCallback(async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, watchlist: true }))
    setActionStates((prev) => ({ ...prev, watchlistSuccess: false, error: '' }))

    try {
      // Optimistic update - update UI immediately
      const newStatus = !localCollectionStatus.isInWatchlist
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isInWatchlist: newStatus,
      }))

      if (!newStatus) {
        // Remove from watchlist
        await removeFromWatchlist(mediaData.id, mediaData.media_type || 'movie')
      } else {
        // Add to watchlist
        await addToWatchlist(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )

        // Only show success state when adding to watchlist
        setActionStates((prev) => ({ ...prev, watchlistSuccess: true }))
        clearSuccessState('watchlistSuccess')
      }

      // Notify parent component if callback provided
      if (onActionComplete) {
        onActionComplete({
          type: 'watchlist',
          added: newStatus,
          mediaId: mediaData.id,
          mediaType: mediaData.media_type || 'movie',
        })
      }
    } catch (error) {
      console.error('Watchlist action failed:', error)

      // Rollback optimistic update if operation failed
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isInWatchlist: !localCollectionStatus.isInWatchlist,
      }))

      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update watchlist',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, watchlist: false }))
    }
  }, [
    currentUser,
    navigate,
    localCollectionStatus.isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    mediaData,
    clearSuccessState,
    onActionComplete,
  ])

  // Handle adding to favorites with optimistic updates
  const handleFavorites = useCallback(async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, favorites: true }))
    setActionStates((prev) => ({ ...prev, favoritesSuccess: false, error: '' }))

    try {
      // Optimistic update - update UI immediately
      const newStatus = !localCollectionStatus.isInFavorites
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isInFavorites: newStatus,
      }))

      if (!newStatus) {
        // Remove from favorites
        await removeFromFavorites(mediaData.id, mediaData.media_type || 'movie')
      } else {
        // Add to favorites
        await addToFavorites(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )

        // Only show success state when adding to favorites
        setActionStates((prev) => ({ ...prev, favoritesSuccess: true }))
        clearSuccessState('favoritesSuccess')
      }

      // Notify parent component if callback provided
      if (onActionComplete) {
        onActionComplete({
          type: 'favorites',
          added: newStatus,
          mediaId: mediaData.id,
          mediaType: mediaData.media_type || 'movie',
        })
      }
    } catch (error) {
      console.error('Favorites action failed:', error)

      // Rollback optimistic update if operation failed
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isInFavorites: !localCollectionStatus.isInFavorites,
      }))

      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update favorites',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, favorites: false }))
    }
  }, [
    currentUser,
    navigate,
    localCollectionStatus.isInFavorites,
    addToFavorites,
    removeFromFavorites,
    mediaData,
    clearSuccessState,
    onActionComplete,
  ])

  // Handle marking as watched with optimistic updates
  const handleWatched = useCallback(async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setIsLoading((prev) => ({ ...prev, watched: true }))
    setActionStates((prev) => ({ ...prev, watchedSuccess: false, error: '' }))

    try {
      // Optimistic update - update UI immediately
      const newStatus = !localCollectionStatus.isWatched
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isWatched: newStatus,
      }))

      if (!newStatus) {
        // Remove from watched
        await removeFromWatched(mediaData.id, mediaData.media_type || 'movie')
      } else {
        // Add to watched
        await addToWatched(
          currentUser.uid,
          mediaData.id,
          JSON.stringify(mediaData)
        )

        // Only show success state when adding to watched
        setActionStates((prev) => ({ ...prev, watchedSuccess: true }))
        clearSuccessState('watchedSuccess')
      }

      // Notify parent component if callback provided
      if (onActionComplete) {
        onActionComplete({
          type: 'watched',
          added: newStatus,
          mediaId: mediaData.id,
          mediaType: mediaData.media_type || 'movie',
        })
      }
    } catch (error) {
      console.error('Watched action failed:', error)

      // Rollback optimistic update if operation failed
      setLocalCollectionStatus((prev) => ({
        ...prev,
        isWatched: !localCollectionStatus.isWatched,
      }))

      setActionStates((prev) => ({
        ...prev,
        error: 'Failed to update watched status',
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, watched: false }))
    }
  }, [
    currentUser,
    navigate,
    localCollectionStatus.isWatched,
    addToWatched,
    removeFromWatched,
    mediaData,
    clearSuccessState,
    onActionComplete,
  ])

  // Memoized button rendering - better than creating DOM nodes each render
  const WatchlistButton = useCallback(
    () => (
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
          <Spinner size="sm" color="secondary" />
        ) : (
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
        <span>
          {localCollectionStatus.isInWatchlist
            ? 'In Watchlist'
            : 'Add to Watchlist'}
        </span>
      </button>
    ),
    [
      handleWatchlist,
      isLoading.watchlist,
      actionStates.watchlistSuccess,
      localCollectionStatus.isInWatchlist,
    ]
  )

  // Memoized button rendering - better than creating DOM nodes each render
  const FavoritesButton = useCallback(
    () => (
      <button
        onClick={handleFavorites}
        disabled={isLoading.favorites}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          actionStates.favoritesSuccess
            ? 'bg-pink-600 text-white'
            : localCollectionStatus.isInFavorites
            ? 'bg-[#2a2a2a] text-white border border-[#5ccfee]'
            : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
        }`}
      >
        {isLoading.favorites ? (
          <Spinner size="sm" color="secondary" />
        ) : localCollectionStatus.isInFavorites ? (
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
        <span>{localCollectionStatus.isInFavorites ? 'Liked' : 'Like'}</span>
      </button>
    ),
    [
      handleFavorites,
      isLoading.favorites,
      actionStates.favoritesSuccess,
      localCollectionStatus.isInFavorites,
    ]
  )

  // Memoized button rendering - better than creating DOM nodes each render
  const WatchedButton = useCallback(
    () => (
      <button
        onClick={handleWatched}
        disabled={isLoading.watched}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          actionStates.watchedSuccess
            ? 'bg-green-600 text-white'
            : localCollectionStatus.isWatched
            ? 'bg-[#2a2a2a] text-white border border-[#5ccfee]'
            : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
        }`}
      >
        {isLoading.watched ? (
          <Spinner size="sm" color="secondary" />
        ) : localCollectionStatus.isWatched ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        <span>
          {localCollectionStatus.isWatched ? 'Watched' : 'Mark as Watched'}
        </span>
      </button>
    ),
    [
      handleWatched,
      isLoading.watched,
      actionStates.watchedSuccess,
      localCollectionStatus.isWatched,
    ]
  )

  // Update local state when props or userProfile changes (only when needed)
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

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <WatchlistButton />
        <FavoritesButton />
        <WatchedButton />
      </div>

      {actionStates.error && (
        <div className="mt-2 text-red-500 text-sm">{actionStates.error}</div>
      )}
    </div>
  )
})

export default MediaActions
