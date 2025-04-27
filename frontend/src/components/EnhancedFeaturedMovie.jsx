import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrending } from '../services/api'

/**
 * Self-contained FeaturedMovie component that manages its own data fetching,
 * state, and rotation timer to prevent causing re-renders in parent components
 */
const EnhancedFeaturedMovie = memo(function EnhancedFeaturedMovie() {
  // Internal state for featured items
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentMovie, setCurrentMovie] = useState(null)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Ref for rotation timer
  const rotationTimerRef = useRef(null)

  // Helper function to format movie data
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

  // Utility function to preload images for smoother UI
  const preloadImages = useCallback((imageUrls) => {
    if (!imageUrls || !imageUrls.length) return

    imageUrls.forEach((url) => {
      if (url) {
        const img = new Image()
        img.src = url
      }
    })
  }, [])

  // Helper function to validate if a movie/show has all required fields
  const isValidContent = useCallback((item) => {
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
      item.vote_average > 0 &&
      // Check for backdrop (required for featured)
      item.backdrop_path
    )
  }, [])

  // Auto-rotate featured items
  const rotateFeatured = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
    )
  }, [featuredItems.length])

  // Function to manually change featured item
  const changeFeaturedItem = useCallback(
    (index) => {
      // Reset the timer when manually changed
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
        rotationTimerRef.current = setInterval(rotateFeatured, 8000)
      }
      setCurrentIndex(index)
    },
    [rotateFeatured]
  )

  // Function to go to the next item
  const goToNext = useCallback(
    (e) => {
      e.preventDefault()
      setCurrentIndex((prevIndex) =>
        prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
      )

      // Reset timer
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
        rotationTimerRef.current = setInterval(rotateFeatured, 8000)
      }
    },
    [featuredItems.length, rotateFeatured]
  )

  // Function to go to the previous item
  const goToPrev = useCallback(
    (e) => {
      e.preventDefault()
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? featuredItems.length - 1 : prevIndex - 1
      )

      // Reset timer
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
        rotationTimerRef.current = setInterval(rotateFeatured, 8000)
      }
    },
    [featuredItems.length, rotateFeatured]
  )

  // Fetch data from API
  useEffect(() => {
    const fetchFeaturedData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch trending content for featured section
        const trendingData = await fetchTrending('all', 'week')

        if (trendingData.results && trendingData.results.length > 0) {
          // Filter valid content first - require both poster and backdrop for featured items
          const validTrendingResults = trendingData.results.filter((item) =>
            isValidContent(item)
          )

          if (validTrendingResults.length > 0) {
            // Use the first 5 valid trending items as featured content
            const formattedFeaturedItems = validTrendingResults
              .slice(0, 5)
              .map((item) => formatMovieData(item))

            // Preload backdrop images for smoother carousel transitions
            preloadImages(formattedFeaturedItems.map((item) => item.backdrop))
            setFeaturedItems(formattedFeaturedItems)
          }
        }
      } catch (err) {
        console.error('Error fetching featured content:', err)
        setError('Failed to load featured content')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedData()

    return () => {
      // Cleanup function
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
      }
    }
  }, [formatMovieData, isValidContent, preloadImages])

  // Update current movie when index changes
  useEffect(() => {
    if (featuredItems.length > 0) {
      setCurrentMovie(featuredItems[currentIndex])
      setBackdropLoaded(false) // Reset backdrop loaded state
    }
  }, [currentIndex, featuredItems])

  // Set up rotation timer
  useEffect(() => {
    if (featuredItems.length > 1) {
      rotationTimerRef.current = setInterval(rotateFeatured, 8000)
    }
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
      }
    }
  }, [featuredItems.length, rotateFeatured])

  // Don't render anything if no featured items loaded
  if (isLoading) {
    return (
      <div className="relative mb-10 h-[400px] md:h-[550px] lg:h-[600px]">
        <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // Don't render anything if there's an error or no featured movie
  if (error || !currentMovie || !currentMovie.backdrop) return null

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
            opacity: 1,
            transition:
              'opacity 600ms ease-in-out, transform 800ms ease-in-out',
            position: 'relative',
          }}
        >
          <img
            key={currentMovie.id} // Key helps React identify when to animate
            src={currentMovie.backdrop}
            alt={currentMovie.title}
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
          <div
            className="max-w-4xl mx-auto w-full"
            style={{
              opacity: 1,
              transition:
                'opacity 600ms ease-in-out, transform 800ms ease-in-out',
            }}
          >
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <span className="rating-badge">{currentMovie.rating}</span>
              <span className="text-gray-300 text-sm">{currentMovie.year}</span>
              <span className="text-gray-300 text-sm hidden sm:inline">
                • {currentMovie.genres && currentMovie.genres.join(', ')}
              </span>
            </div>

            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-2"
              key={`title-${currentMovie.id}`}
              style={{
                animation: 'slideUp 600ms ease-out forwards',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {currentMovie.title}
            </h1>

            <p
              className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mb-4 line-clamp-3 md:line-clamp-none"
              key={`desc-${currentMovie.id}`}
              style={{
                animation: 'slideUp 700ms ease-out forwards',
                animationDelay: '100ms',
                opacity: 0,
              }}
            >
              {currentMovie.description}
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
                to={`/${currentMovie.type}/${currentMovie.id}`}
                className="primary-button flex items-center gap-1 group cursor-pointer"
              >
                <span className="transform transition-transform group-hover:scale-110">
                  ▶
                </span>{' '}
                Watch Now
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel navigation - only shown if multiple items */}
        {featuredItems.length > 1 && (
          <>
            {/* Carousel indicators */}
            <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center gap-2 pb-2 pt-4">
              {featuredItems.map((_, index) => (
                <button
                  key={`indicator-${index}`}
                  onClick={() => changeFeaturedItem(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentIndex === index
                      ? 'bg-[#5ccfee] scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`View featured item ${index + 1}`}
                />
              ))}
            </div>

            {/* Arrow navigation */}
            <button
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors focus:outline-none"
              onClick={goToPrev}
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors focus:outline-none"
              onClick={goToNext}
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
})

export default EnhancedFeaturedMovie
