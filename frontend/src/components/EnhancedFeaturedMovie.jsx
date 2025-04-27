import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrending } from '../services/api'
import { LoadingState } from './common'
import { formatMovieData, isValidContent } from '../utils/movieUtils'
import { preloadImages } from '../utils/uiUtils'

// Subcomponent for carousel navigation
const CarouselNavigation = memo(
  ({ items, currentIndex, onChangeIndex, onNext, onPrev }) => {
    if (items.length <= 1) return null

    return (
      <>
        {/* Carousel indicators */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center gap-2 pb-2 pt-4">
          {items.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => onChangeIndex(index)}
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
          onClick={onPrev}
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
          onClick={onNext}
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
    )
  }
)

// Subcomponent for the movie content overlay
const MovieContent = memo(({ movie }) => {
  if (!movie) return null

  return (
    <div
      className="max-w-4xl mx-auto w-full"
      style={{
        opacity: 1,
        transition: 'opacity 600ms ease-in-out, transform 800ms ease-in-out',
      }}
    >
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
          className="primary-button flex items-center gap-1 group cursor-pointer"
        >
          <span className="transform transition-transform group-hover:scale-110">
            ▶
          </span>{' '}
          Watch Now
        </Link>
      </div>
    </div>
  )
})

// Custom hook for image preloading
const useImagePreloader = (src) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!src) return

    setLoaded(false)
    const img = new Image()
    img.src = src
    img.onload = () => setLoaded(true)
    img.onerror = () => console.error('Error loading image:', src)

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return loaded
}

/**
 * Self-contained FeaturedMovie component that manages its own data fetching,
 * state, and rotation timer to prevent causing re-renders in parent components
 */
const EnhancedFeaturedMovie = memo(function EnhancedFeaturedMovie() {
  // Internal state for featured items
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentMovie, setCurrentMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [initialImagesLoaded, setInitialImagesLoaded] = useState(false)

  // Use custom hook for preloading the current image
  const backdropLoaded = useImagePreloader(currentMovie?.backdrop)

  // Ref for rotation timer
  const rotationTimerRef = useRef(null)

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
          const validTrendingResults = trendingData.results.filter(
            (item) => isValidContent(item, true) // true to require backdrop image
          )

          if (validTrendingResults.length > 0) {
            // Use the first 5 valid trending items as featured content
            const formattedFeaturedItems = validTrendingResults
              .slice(0, 5)
              .map(formatMovieData)

            // Preload all backdrop images for smoother carousel transitions
            try {
              await preloadImages(
                formattedFeaturedItems.map((item) => item.backdrop)
              )
              setInitialImagesLoaded(true)
            } catch (preloadError) {
              console.error('Error preloading images:', preloadError)
              // Continue even if preloading fails
              setInitialImagesLoaded(true)
            }

            setFeaturedItems(formattedFeaturedItems)

            // Safely set the first movie after images are preloaded
            if (formattedFeaturedItems.length > 0) {
              setCurrentMovie(formattedFeaturedItems[0])
            }
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
  }, [])

  // Update current movie when index changes (only after initial load)
  useEffect(() => {
    if (featuredItems.length > 0 && initialImagesLoaded) {
      setCurrentMovie(featuredItems[currentIndex])
    }
  }, [currentIndex, featuredItems, initialImagesLoaded])

  // Set up rotation timer only after initial images are loaded
  useEffect(() => {
    if (featuredItems.length > 1 && initialImagesLoaded) {
      rotationTimerRef.current = setInterval(rotateFeatured, 8000)
    }
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
      }
    }
  }, [featuredItems.length, initialImagesLoaded, rotateFeatured])

  // Show loading state
  if (isLoading || !initialImagesLoaded) {
    return <LoadingState minHeight="400px" />
  }

  // Don't render anything if there's an error or no featured movie
  if (error || !currentMovie || !currentMovie.backdrop) {
    return null
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
            fetchPriority="high"
          />
        </div>

        {/* Content overlay with animation */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-20">
          <MovieContent movie={currentMovie} />
        </div>

        {/* Carousel navigation - only shown if multiple items */}
        <CarouselNavigation
          items={featuredItems}
          currentIndex={currentIndex}
          onChangeIndex={changeFeaturedItem}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      </div>
    </section>
  )
})

export default EnhancedFeaturedMovie
