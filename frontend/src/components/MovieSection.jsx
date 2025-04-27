import { memo } from 'react'
import MovieCardContainer from './MovieCardContainer'

/**
 * MovieSection - A memoized component for displaying a section of movies
 * This component will not re-render when its parent re-renders
 * unless its props actually change
 */
const MovieSection = memo(function MovieSection({
  title,
  movies = [],
  showActions = false,
  onMovieAction = null,
}) {
  if (!movies || movies.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="text-lg md:text-xl font-medium text-white mb-4 px-4 md:px-6">
        {title}
      </h2>
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
          {movies.map((movie) => (
            <div
              key={`${movie.id}-${movie.type || 'movie'}`}
              className="w-36 md:w-40 flex-shrink-0"
            >
              <MovieCardContainer
                movie={movie}
                showActions={showActions}
                onActionComplete={onMovieAction}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default MovieSection
