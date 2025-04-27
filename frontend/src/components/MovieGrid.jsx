import { memo, useCallback } from 'react'
import MovieCardContainer from './MovieCardContainer'
import { Spinner } from './common'

/**
 * MovieGrid - Renders a responsive grid of movie cards
 * This component handles the overall grid layout while each individual
 * MovieCardContainer manages its own state, preventing parent re-renders
 */
const MovieGrid = memo(function MovieGrid({
  movies = [],
  isLoading = false,
  showActions = false,
  emptyMessage = 'No movies found',
  onMovieActionComplete = null,
}) {
  // Optional tracking of actions at the grid level without causing re-renders
  const handleMovieAction = useCallback(
    (actionData) => {
      console.log('Movie action occurred:', actionData)

      // Pass to parent if needed, but parent shouldn't re-render the whole grid
      if (onMovieActionComplete) {
        onMovieActionComplete(actionData)
      }
    },
    [onMovieActionComplete]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10 min-h-[200px]">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="flex justify-center items-center p-10 min-h-[200px] text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {movies.map((movie) => (
        <div
          key={`${movie.id}-${movie.media_type || movie.type || 'movie'}`}
          className="movie-card-wrapper"
        >
          <MovieCardContainer
            movie={movie}
            showActions={showActions}
            onActionComplete={handleMovieAction}
          />
        </div>
      ))}
    </div>
  )
})

export default MovieGrid
