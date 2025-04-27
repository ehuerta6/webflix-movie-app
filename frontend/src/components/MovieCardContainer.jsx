import { memo, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './common'
import Card from './common/Card'

/**
 * MovieCardContainer - A wrapper for MovieCard that handles its own collection actions
 * This component locally manages state for watchlist/favorites/watched actions
 * to prevent parent components from re-rendering when actions occur
 */
const MovieCardContainer = memo(function MovieCardContainer({
  movie,
  showActions = false,
  onActionComplete = null,
}) {
  const navigate = useNavigate()
  const {
    currentUser,
    userProfile,
    addToWatchlist,
    removeFromWatchlist,
    addToFavorites,
    removeFromFavorites,
    addToWatched,
    removeFromWatched,
  } = useAuth()

  // Track loading states locally to this card only
  const [loading, setLoading] = useState({
    image: !movie.poster,
    watchlist: false,
    favorites: false,
    watched: false,
  })

  // Track collection status locally in this component
  const [inCollections, setInCollections] = useState({
    watchlist: false,
    favorites: false,
    watched: false,
  })

  // Initialize collection status from userProfile
  useEffect(() => {
    if (currentUser && userProfile && movie) {
      const mediaType = movie.media_type || movie.type || 'movie'
      setInCollections({
        watchlist:
          userProfile?.watchlist?.some(
            (item) => item.id === movie.id && item.type === mediaType
          ) || false,
        favorites:
          userProfile?.favorites?.some(
            (item) => item.id === movie.id && item.type === mediaType
          ) || false,
        watched:
          userProfile?.watched?.some(
            (item) => item.id === movie.id && item.type === mediaType
          ) || false,
      })
    }
  }, [currentUser, userProfile, movie])

  // Process movie props to ensure consistent format
  const {
    id,
    type = movie.media_type || 'movie',
    title = movie.title || movie.name || 'Unknown',
    poster = movie.poster ||
      (movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : null),
    rating = movie.rating ||
      (movie.vote_average ? movie.vote_average.toFixed(1) : null),
    genre = movie.genre || (movie.genres && movie.genres[0]?.name),
    year = movie.year ||
      (movie.release_date
        ? movie.release_date.substring(0, 4)
        : movie.first_air_date
        ? movie.first_air_date.substring(0, 4)
        : null),
  } = movie

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setLoading((prev) => ({ ...prev, image: false }))
  }, [])

  // Optimistic update to collection - update UI immediately before API completes
  const toggleCollection = useCallback(
    async (collectionType) => {
      if (!currentUser) {
        navigate('/login')
        return
      }

      // Start loading
      setLoading((prev) => ({ ...prev, [collectionType]: true }))

      try {
        // Optimistically update UI
        const newStatus = !inCollections[collectionType]
        setInCollections((prev) => ({
          ...prev,
          [collectionType]: newStatus,
        }))

        // Format movie data once for all actions
        const movieData = JSON.stringify({
          id,
          media_type: type,
          type,
          title: title || movie.name,
          name: movie.name || title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average || rating,
          release_date: movie.release_date,
          first_air_date: movie.first_air_date,
          genres: movie.genres || (genre ? [{ name: genre }] : []),
          genre_ids: movie.genre_ids || [],
        })

        // Perform the appropriate action
        if (collectionType === 'watchlist') {
          if (newStatus) {
            await addToWatchlist(currentUser.uid, id, movieData)
          } else {
            await removeFromWatchlist(id, type)
          }
        } else if (collectionType === 'favorites') {
          if (newStatus) {
            await addToFavorites(currentUser.uid, id, movieData)
          } else {
            await removeFromFavorites(id, type)
          }
        } else if (collectionType === 'watched') {
          if (newStatus) {
            await addToWatched(currentUser.uid, id, movieData)
          } else {
            await removeFromWatched(id, type)
          }
        }

        // Notify parent if needed, but don't require parent re-render
        if (onActionComplete) {
          onActionComplete({
            id,
            type,
            action: collectionType,
            added: newStatus,
          })
        }
      } catch (error) {
        console.error(`Error updating ${collectionType}:`, error)

        // Rollback optimistic update on error
        setInCollections((prev) => ({
          ...prev,
          [collectionType]: !inCollections[collectionType],
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [collectionType]: false }))
      }
    },
    [
      currentUser,
      navigate,
      inCollections,
      id,
      type,
      movie,
      title,
      genre,
      rating,
      addToWatchlist,
      removeFromWatchlist,
      addToFavorites,
      removeFromFavorites,
      addToWatched,
      removeFromWatched,
      onActionComplete,
    ]
  )

  // Memoized handler functions to prevent recreation on each render
  const handleWatchlist = useCallback(
    () => toggleCollection('watchlist'),
    [toggleCollection]
  )
  const handleFavorites = useCallback(
    () => toggleCollection('favorites'),
    [toggleCollection]
  )
  const handleWatched = useCallback(
    () => toggleCollection('watched'),
    [toggleCollection]
  )
  const goToDetails = useCallback(
    () => navigate(`/${type}/${id}`),
    [navigate, type, id]
  )

  // If there's no poster, don't render the card
  if (!poster) return null

  return (
    <div className="relative">
      <Card hover>
        <Link to={`/${type}/${id}`} className="block cursor-pointer">
          <div className="aspect-[2/3] relative">
            {loading.image && (
              <div className="absolute inset-0 bg-[#333] flex items-center justify-center">
                <Spinner color="primary" size="md" />
              </div>
            )}
            <img
              src={poster}
              alt={title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                loading.image ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              loading="lazy"
            />
            {rating && (
              <div className="absolute top-0 right-0 bg-black/50 px-1.5 py-0.5 m-1.5 rounded text-xs">
                <span className="text-[#5ccfee]">{rating}</span>
              </div>
            )}

            {/* Genre badge */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
              <div className="flex items-center justify-between">
                {genre && (
                  <span className="text-xs text-[#5ccfee] font-medium">
                    {genre}
                  </span>
                )}
                {year && <span className="text-xs text-gray-300">{year}</span>}
              </div>
            </div>
          </div>
          <Card.Body className="p-2">
            <h3 className="text-sm text-gray-200 font-medium truncate">
              {title}
            </h3>
          </Card.Body>
        </Link>
      </Card>

      {/* Action buttons - only shown when showActions is true */}
      {showActions && currentUser && (
        <div className="absolute bottom-0 left-0 right-0 p-1 bg-[#121212]/90 flex justify-between gap-1 border-t border-[#333]">
          {/* View details */}
          <button
            onClick={goToDetails}
            className="text-[#5ccfee] p-1 rounded hover:bg-[#333]/50"
            aria-label="View details"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Watchlist button */}
          <button
            onClick={handleWatchlist}
            disabled={loading.watchlist}
            className={`p-1 rounded ${
              inCollections.watchlist
                ? 'text-[#00BFFF] hover:bg-[#333]/50'
                : 'text-gray-400 hover:text-[#00BFFF] hover:bg-[#333]/50'
            }`}
            aria-label={
              inCollections.watchlist
                ? 'Remove from watchlist'
                : 'Add to watchlist'
            }
          >
            {loading.watchlist ? (
              <Spinner size="sm" color="primary" className="w-4 h-4" />
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill={inCollections.watchlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={inCollections.watchlist ? '0' : '2'}
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            )}
          </button>

          {/* Favorites button */}
          <button
            onClick={handleFavorites}
            disabled={loading.favorites}
            className={`p-1 rounded ${
              inCollections.favorites
                ? 'text-red-500 hover:bg-[#333]/50'
                : 'text-gray-400 hover:text-red-500 hover:bg-[#333]/50'
            }`}
            aria-label={
              inCollections.favorites
                ? 'Remove from favorites'
                : 'Add to favorites'
            }
          >
            {loading.favorites ? (
              <Spinner size="sm" color="primary" className="w-4 h-4" />
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill={inCollections.favorites ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={inCollections.favorites ? '0' : '2'}
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Watched button */}
          <button
            onClick={handleWatched}
            disabled={loading.watched}
            className={`p-1 rounded ${
              inCollections.watched
                ? 'text-green-500 hover:bg-[#333]/50'
                : 'text-gray-400 hover:text-green-500 hover:bg-[#333]/50'
            }`}
            aria-label={
              inCollections.watched ? 'Remove from watched' : 'Mark as watched'
            }
          >
            {loading.watched ? (
              <Spinner size="sm" color="primary" className="w-4 h-4" />
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill={inCollections.watched ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={inCollections.watched ? '0' : '2'}
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
})

export default MovieCardContainer
