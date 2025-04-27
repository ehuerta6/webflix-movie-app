import { useState, useEffect, useCallback } from 'react'
import { fetchTrending, fetchMovies, fetchShows } from '../services/api'
import EnhancedFeaturedMovie from '../components/EnhancedFeaturedMovie'
import MovieSection from '../components/MovieSection'
import { LoadingState } from '../components/common'
import { useLoadingError } from '../hooks'
import { formatMovieData, isValidContent } from '../utils/movieUtils'

/**
 * Optimized Home component that doesn't re-render when featured movie changes
 */
function Home() {
  // State for different movie/show categories
  const [popular, setPopular] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [topRatedShows, setTopRatedShows] = useState([])

  // Use the custom loading/error hook
  const { isLoading, error, execute } = useLoadingError()

  // Optional callback for movie actions that won't cause re-renders
  const handleMovieAction = useCallback((actionData) => {
    console.log('Movie action occurred:', actionData)
    // We don't need to update state here since each MovieCardContainer
    // manages its own state independently
  }, [])

  // Fetch data from API - only fetch movie sections, not featured content
  useEffect(() => {
    const fetchHomeData = async () => {
      await execute(
        async () => {
          // Fetch trending content for popular section
          const trendingData = await fetchTrending('all', 'week')

          if (trendingData.results && trendingData.results.length > 0) {
            // Filter valid content first
            const validTrendingResults = trendingData.results.filter((item) =>
              isValidContent(item)
            )

            if (validTrendingResults.length > 0) {
              // Use trending items for the "What's Popular" section
              // Skip the first 5 as those are used for featured content
              const formattedPopular = validTrendingResults
                .slice(5, 20) // Get more for horizontal scrolling
                .map(formatMovieData)
                .slice(0, 12) // Take up to 12 valid items
              setPopular(formattedPopular)
            }
          }

          // Fetch top rated movies
          const topMoviesData = await fetchMovies({
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100,
          })

          if (topMoviesData.results) {
            // Filter valid content
            const validTopMovies = topMoviesData.results.filter((item) =>
              isValidContent(item)
            )

            const formattedTopMovies = validTopMovies
              .slice(0, 20) // Get more for horizontal scrolling
              .map((movie) =>
                formatMovieData({ ...movie, media_type: 'movie' })
              )
              .slice(0, 12) // Take up to 12 valid items
            setTopRatedMovies(formattedTopMovies)
          }

          // Fetch top rated TV shows
          const topShowsData = await fetchShows({
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100,
          })

          if (topShowsData.results) {
            // Filter valid content
            const validTopShows = topShowsData.results.filter((item) =>
              isValidContent(item)
            )

            const formattedTopShows = validTopShows
              .slice(0, 20) // Get more for horizontal scrolling
              .map((show) => formatMovieData({ ...show, media_type: 'tv' }))
              .slice(0, 12) // Take up to 12 valid items
            setTopRatedShows(formattedTopShows)
          }
        },
        {
          errorMessage: 'Failed to load content',
        }
      )
    }

    fetchHomeData()
  }, [execute])

  return (
    <div className="page-container">
      <div className="w-full mx-auto">
        {/* Self-contained featured movie component that manages its own state */}
        <EnhancedFeaturedMovie />

        <LoadingState
          isLoading={isLoading}
          error={error}
          isEmpty={
            !popular.length && !topRatedMovies.length && !topRatedShows.length
          }
          onRetry={() => window.location.reload()}
        >
          <div className="content-container">
            {popular.length > 0 && (
              <MovieSection
                title="What's Popular"
                movies={popular}
                showActions={false}
                onMovieAction={handleMovieAction}
              />
            )}

            {topRatedMovies.length > 0 && (
              <MovieSection
                title="Top Rated Movies"
                movies={topRatedMovies}
                showActions={false}
                onMovieAction={handleMovieAction}
              />
            )}

            {topRatedShows.length > 0 && (
              <MovieSection
                title="Top Rated TV Shows"
                movies={topRatedShows}
                showActions={false}
                onMovieAction={handleMovieAction}
              />
            )}
          </div>
        </LoadingState>
      </div>
    </div>
  )
}

export default Home
