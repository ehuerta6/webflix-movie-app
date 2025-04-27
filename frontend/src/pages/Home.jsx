import { useState, useEffect, useCallback } from 'react'
import { fetchTrending, fetchMovies, fetchShows } from '../services/api'
import EnhancedFeaturedMovie from '../components/EnhancedFeaturedMovie'
import MovieSection from '../components/MovieSection'

// Helper function to validate if a movie/show has all required fields
const isValidContent = (item) => {
  if (!item) return false

  return (
    // Check for valid title/name
    (item.title || item.name) &&
    // Check for valid poster (required)
    item.poster_path &&
    // Check for non-empty overview
    item.overview &&
    item.overview.trim() !== '' &&
    // Check for defined release date
    ((item.release_date && item.release_date.trim() !== '') ||
      (item.first_air_date && item.first_air_date.trim() !== '')) &&
    // Check for valid rating (must exist and be > 0)
    typeof item.vote_average === 'number' &&
    item.vote_average > 0
  )
}

/**
 * Optimized Home component that doesn't re-render when featured movie changes
 */
function Home() {
  // State for different movie/show categories - NOT for featured content
  const [popular, setPopular] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [topRatedShows, setTopRatedShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Memoized formatMovieData function
  const formatMovieData = useCallback(
    (movie) => ({
      id: movie.id,
      type: movie.media_type || 'movie',
      title: movie.title || movie.name,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      backdrop: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null,
      rating: movie.vote_average.toFixed(1),
      genre: movie.genre_ids
        ? getGenreNames(movie.genre_ids)[0] || 'Unknown'
        : 'Unknown',
      year:
        movie.release_date || movie.first_air_date
          ? (movie.release_date || movie.first_air_date).substring(0, 4)
          : 'Unknown',
      description: movie.overview,
      genres: getGenreNames(movie.genre_ids),
    }),
    []
  )

  // Helper function to convert genre IDs to names
  const getGenreNames = (genreIds = []) => {
    // Common genre map (simplified)
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

    return genreIds
      ? genreIds
          .map((id) => genreMap[id] || 'Unknown')
          .filter((name) => name !== 'Unknown')
      : []
  }

  // Optional callback for movie actions that won't cause re-renders
  const handleMovieAction = useCallback((actionData) => {
    console.log('Movie action occurred:', actionData)
    // We don't need to update state here since each MovieCardContainer
    // manages its own state independently
  }, [])

  // Fetch data from API - only fetch movie sections, not featured content
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch trending content for popular section
        const trendingData = await fetchTrending('all', 'week')

        if (trendingData.results && trendingData.results.length > 0) {
          // Filter valid content first
          const validTrendingResults =
            trendingData.results.filter(isValidContent)

          if (validTrendingResults.length > 0) {
            // Use trending items for the "What's Popular" section
            // Skip the first 5 as those are used for featured content
            const formattedPopular = validTrendingResults
              .slice(5, 20) // Get more for horizontal scrolling
              .map((item) => formatMovieData(item))
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
          const validTopMovies = topMoviesData.results.filter(isValidContent)

          const formattedTopMovies = validTopMovies
            .slice(0, 20) // Get more for horizontal scrolling
            .map((movie) => formatMovieData({ ...movie, media_type: 'movie' }))
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
          const validTopShows = topShowsData.results.filter(isValidContent)

          const formattedTopShows = validTopShows
            .slice(0, 20) // Get more for horizontal scrolling
            .map((show) => formatMovieData({ ...show, media_type: 'tv' }))
            .slice(0, 12) // Take up to 12 valid items
          setTopRatedShows(formattedTopShows)
        }
      } catch (err) {
        console.error('Error fetching home page data:', err)
        setError('Failed to load movie data')
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [formatMovieData]) // Only depend on formatMovieData

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-white">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#5ccfee] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-white">
        <div className="flex flex-col items-center">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#5ccfee] text-black rounded hover:bg-[#4ab9d9]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#121212] min-h-screen pb-8">
      <div className="w-full mx-auto">
        {/* Self-contained featured movie component that manages its own state */}
        <EnhancedFeaturedMovie />

        <div className="max-w-screen-2xl mx-auto">
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
      </div>
    </div>
  )
}

export default Home
