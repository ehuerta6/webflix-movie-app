import { useState } from 'react'
import { Link } from 'react-router-dom'

const FeaturedMovie = ({
  movie,
  featuredItems,
  currentFeaturedIndex,
  changeFeaturedItem,
  goToNext,
  goToPrev,
}) => {
  const [backdropLoaded, setBackdropLoaded] = useState(false)

  // Return early if movie is invalid
  if (!movie || !movie.backdrop) return null

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
          <div
            className="max-w-4xl mx-auto w-full"
            style={{
              opacity: 1,
              transition:
                'opacity 600ms ease-in-out, transform 800ms ease-in-out',
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

            {/* Actions - Only Watch Now button */}
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

            {/* Carousel indicators */}
            {featuredItems && featuredItems.length > 1 && (
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
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
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
        {featuredItems && featuredItems.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none transition-all duration-200 hover:scale-110 cursor-pointer"
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
              className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none transition-all duration-200 hover:scale-110 cursor-pointer"
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

export default FeaturedMovie
