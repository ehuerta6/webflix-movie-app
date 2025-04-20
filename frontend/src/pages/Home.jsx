import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import { fetchTrending, fetchMovies, fetchShows } from '../services/api'
import { useAuth } from '../context/AuthContext'

// Utility function to preload images for smoother UI
const preloadImages = (imageUrls) => {
  if (!imageUrls || !imageUrls.length) return

  imageUrls.forEach((url) => {
    if (url) {
      const img = new Image()
      img.src = url
    }
  })
}

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

function Home() {
  // State for different movie/show categories
  const [featured, setFeatured] = useState(null)
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const [popular, setPopular] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [topRatedShows, setTopRatedShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const carouselTimerRef = useRef(null)
  const {
    currentUser,
    addToWatchlist,
    addToWatched,
    userProfile,
    removeFromWatchlist,
    removeFromWatched,
    addToFavorites,
    removeFromFavorites,
  } = useAuth()

  // Format movie data to be consistent with MovieCard component
  const formatMovieData = (movie) => ({
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
  })

  // Helper function to convert genre IDs to names
  // This is a simplified version since we don't have the full genre list here
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

  // Auto-rotate featured items
  const rotateFeatured = useCallback(() => {
    setCurrentFeaturedIndex((prevIndex) =>
      prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
    )
  }, [featuredItems.length])

  // Set up carousel timer
  useEffect(() => {
    if (featuredItems.length > 1) {
      carouselTimerRef.current = setInterval(rotateFeatured, 8000)
    }
    return () => {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
      }
    }
  }, [featuredItems.length, rotateFeatured])

  // Function to manually change featured item
  const changeFeaturedItem = (index) => {
    // Reset the timer when manually changed
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current)
      carouselTimerRef.current = setInterval(rotateFeatured, 8000)
    }
    setCurrentFeaturedIndex(index)
  }

  // Handle adding to watchlist
  const handleAddToWatchlist = async (media) => {
    try {
      if (!currentUser) {
        console.log('User not logged in')
        return
      }

      // Check if movie is already in watchlist
      const isInWatchlist = userProfile?.watchlist?.some(
        (item) => item.id === media.id && item.type === media.type
      )

      if (isInWatchlist) {
        // Remove from watchlist
        console.log('Removing from watchlist:', media)
        await removeFromWatchlist(media.id, media.type)
        console.log('Successfully removed from watchlist!')
      } else {
        // Add to watchlist
        console.log('Adding to watchlist:', media)

        // Format the media data for the addToWatchlist function
        const formattedMedia = {
          id: media.id,
          title: media.title,
          poster_path: media.poster,
          media_type: media.type,
          vote_average: parseFloat(media.rating),
          release_date: `${media.year}-01-01`,
          overview: media.description,
        }

        // Call the Firestore function with the right parameters
        await addToWatchlist(
          currentUser.uid,
          media.id,
          JSON.stringify(formattedMedia)
        )
        console.log('Successfully added to watchlist!')
      }
    } catch (error) {
      console.error('Error handling watchlist:', error)
    }
  }

  // Handle adding to favorites
  const handleAddToFavorites = async (media) => {
    try {
      if (!currentUser) {
        console.log('User not logged in')
        return
      }

      // Check if movie is already in favorites
      const isInFavorites = userProfile?.favorites?.some(
        (item) => item.id === media.id && item.type === media.type
      )

      if (isInFavorites) {
        // Remove from favorites
        console.log('Removing from favorites:', media)
        await removeFromFavorites(media.id, media.type)
        console.log('Successfully removed from favorites!')
      } else {
        // Add to favorites
        console.log('Adding to favorites:', media)

        // Format the media data for the addToFavorites function
        const formattedMedia = {
          id: media.id,
          title: media.title,
          poster_path: media.poster,
          media_type: media.type,
          vote_average: parseFloat(media.rating),
          release_date: `${media.year}-01-01`,
          overview: media.description,
        }

        // Call the Firestore function with the right parameters
        await addToFavorites(
          currentUser.uid,
          media.id,
          JSON.stringify(formattedMedia)
        )
        console.log('Successfully added to favorites!')
      }
    } catch (error) {
      console.error('Error handling favorites:', error)
    }
  }

  // Handle marking as watched
  const handleMarkAsWatched = async (media) => {
    try {
      if (!currentUser) {
        console.log('User not logged in')
        return
      }

      // Check if movie is already in watched
      const isWatched = userProfile?.watched?.some(
        (item) => item.id === media.id && item.type === media.type
      )

      if (isWatched) {
        // Remove from watched
        console.log('Removing from watched:', media)
        await removeFromWatched(media.id, media.type)
        console.log('Successfully removed from watched!')
      } else {
        // Add to watched
        console.log('Marking as watched:', media)

        // Format the media data for the addToWatched function
        const formattedMedia = {
          id: media.id,
          title: media.title,
          poster_path: media.poster,
          media_type: media.type,
          vote_average: parseFloat(media.rating),
          release_date: `${media.year}-01-01`,
          overview: media.description,
        }

        // Call the Firestore function with the right parameters
        await addToWatched(
          currentUser.uid,
          media.id,
          JSON.stringify(formattedMedia)
        )
        console.log('Successfully marked as watched!')
      }
    } catch (error) {
      console.error('Error handling watched status:', error)
    }
  }

  // Fetch data from API
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch trending content for featured section and popular section
        const trendingData = await fetchTrending('all', 'week')

        if (trendingData.results && trendingData.results.length > 0) {
          // Filter valid content first - require both poster and backdrop for featured items
          const validTrendingResults = trendingData.results.filter(
            (item) => isValidContent(item) && item.backdrop_path
          )

          if (validTrendingResults.length > 0) {
            // Use the first 5 valid trending items as featured content
            const featuredItems = validTrendingResults
              .slice(0, 5)
              .map((item) => formatMovieData(item))

            // Preload backdrop images for smoother carousel transitions
            preloadImages(featuredItems.map((item) => item.backdrop))
            setFeaturedItems(featuredItems)
            setFeatured(featuredItems[0]) // Set the first item as initial featured

            // Use other valid trending items for the "What's Popular" section
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

        if (error) console.error('Error fetching home page data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()

    // Cleanup function
    return () => {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
      }
    }
  }, []) // Run once on component mount

  // Update featured item when currentFeaturedIndex changes
  useEffect(() => {
    if (featuredItems.length > 0) {
      setFeatured(featuredItems[currentFeaturedIndex])
    }
  }, [currentFeaturedIndex, featuredItems])

  // Define CSS animation style for the carousel
  const carouselAnimation = {
    opacity: 1,
    transition: 'opacity 600ms ease-in-out, transform 800ms ease-in-out',
  }

  // Featured component for the main highlight with carousel
  const Featured = ({ movie }) => {
    const [backdropLoaded, setBackdropLoaded] = useState(false)

    // Return early if movie is invalid, but after useState calls
    if (!movie || !movie.backdrop) return null

    // Function to go to the next item
    const goToNext = (e) => {
      e.preventDefault()
      setCurrentFeaturedIndex((prevIndex) =>
        prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
      )

      // Reset timer
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
        carouselTimerRef.current = setInterval(rotateFeatured, 8000)
      }
    }

    // Function to go to the previous item
    const goToPrev = (e) => {
      e.preventDefault()
      setCurrentFeaturedIndex((prevIndex) =>
        prevIndex === 0 ? featuredItems.length - 1 : prevIndex - 1
      )

      // Reset timer
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
        carouselTimerRef.current = setInterval(rotateFeatured, 8000)
      }
    }

    return (
      <section className="relative mb-10">
        <div className="w-full h-[400px] md:h-[550px] lg:h-[600px] relative overflow-hidden">
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/80 via-transparent to-[#121212]/80 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#12121280] to-transparent z-10"></div>

          {/* Loading state */}
          {!backdropLoaded && (
            <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center z-5">
              <div className="w-10 h-10 border-3 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Background image with animation */}
          <div
            className="w-full h-full"
            style={{
              ...carouselAnimation,
              position: 'relative',
            }}
          >
            <img
              key={movie.id} // Key helps React identify when to animate
              src={movie.backdrop}
              alt={movie.title}
              className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                backdropLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: 'scale(1.05)',
                animation: backdropLoaded
                  ? 'fadeIn 800ms ease-in-out forwards'
                  : 'none',
              }}
              onLoad={() => setBackdropLoaded(true)}
              fetchPriority="high"
            />
          </div>

          {/* Content overlay with animation */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-20">
            <div className="max-w-4xl mx-auto w-full" style={carouselAnimation}>
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <span className="rating-badge">{movie.rating}</span>
                <span className="text-gray-300 text-sm">{movie.year}</span>
                <span className="text-gray-300 text-sm hidden sm:inline">
                  • {movie.genres && movie.genres.join(', ')}
                </span>
              </div>

              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-2"
                key={`title-${movie.id}`}
                style={{
                  animation: 'slideUp 600ms ease-out forwards',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {movie.title}
              </h1>

              <p
                className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mb-4 line-clamp-3 md:line-clamp-none"
                key={`desc-${movie.id}`}
                style={{
                  animation: 'slideUp 700ms ease-out forwards',
                  animationDelay: '100ms',
                  opacity: 0,
                }}
              >
                {movie.description}
              </p>

              {/* Actions */}
              <div
                className="flex items-center flex-wrap gap-3 mt-5 w-full"
                style={{
                  animation: 'slideUp 800ms ease-out forwards',
                  animationDelay: '200ms',
                  opacity: 0,
                }}
              >
                <Link
                  to={`/${movie.type}/${movie.id}`}
                  className="primary-button flex items-center gap-1 group"
                >
                  <span className="transform transition-transform group-hover:scale-110">
                    ▶
                  </span>{' '}
                  Watch Now
                </Link>

                {currentUser && (
                  <>
                    <button
                      onClick={() => handleAddToWatchlist(movie)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        userProfile?.watchlist?.some(
                          (item) =>
                            item.id === movie.id && item.type === movie.type
                        )
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      {userProfile?.watchlist?.some(
                        (item) =>
                          item.id === movie.id && item.type === movie.type
                      )
                        ? 'In Watchlist'
                        : 'Add to Watchlist'}
                    </button>

                    <button
                      onClick={() => handleMarkAsWatched(movie)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        userProfile?.watched?.some(
                          (item) =>
                            item.id === movie.id && item.type === movie.type
                        )
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {userProfile?.watched?.some(
                        (item) =>
                          item.id === movie.id && item.type === movie.type
                      )
                        ? 'Watched'
                        : 'Mark as Watched'}
                    </button>

                    <button
                      onClick={() => handleAddToFavorites(movie)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        userProfile?.favorites?.some(
                          (item) =>
                            item.id === movie.id && item.type === movie.type
                        )
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
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
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {userProfile?.favorites?.some(
                        (item) =>
                          item.id === movie.id && item.type === movie.type
                      )
                        ? 'Favorited'
                        : 'Add to Favorites'}
                    </button>
                  </>
                )}
              </div>

              {/* Carousel indicators */}
              {featuredItems.length > 1 && (
                <div
                  className="flex mt-6 gap-2"
                  style={{
                    animation: 'fadeIn 1s ease-out forwards',
                    animationDelay: '300ms',
                    opacity: 0,
                  }}
                >
                  {featuredItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => changeFeaturedItem(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === currentFeaturedIndex
                          ? 'bg-[#5ccfee] w-5'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      aria-label={`View featured item ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          {featuredItems.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none transition-all duration-200 hover:scale-110"
                aria-label="Previous featured item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none transition-all duration-200 hover:scale-110"
                aria-label="Next featured item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </section>
    )
  }

  // Section component for code reuse
  const Section = ({ title, items }) => (
    <section className="mb-10">
      <h2 className="text-lg md:text-xl font-medium text-white mb-4 px-4 md:px-6">
        {title}
      </h2>
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
          {items.map((item) => (
            <div key={item.id} className="w-36 md:w-40 flex-shrink-0">
              <MovieCard movie={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )

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
        {featured && <Featured movie={featured} />}

        <div className="max-w-screen-2xl mx-auto">
          {popular.length > 0 && (
            <Section title="What's Popular" items={popular} />
          )}
          {topRatedMovies.length > 0 && (
            <Section title="Top Rated Movies" items={topRatedMovies} />
          )}
          {topRatedShows.length > 0 && (
            <Section title="Top Rated TV Shows" items={topRatedShows} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
