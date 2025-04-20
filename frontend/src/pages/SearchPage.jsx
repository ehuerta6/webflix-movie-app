import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  searchTMDB,
  fetchGenres,
  searchByGenre,
  fetchMovies,
  fetchShows,
  fetchTrending,
} from '../services/api'
import Pagination from '../components/Pagination'
import MovieCard from '../components/MovieCard'
import FeaturedMovie from '../components/FeaturedMovie'

function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)

  const [searchResults, setSearchResults] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [trendingContent, setTrendingContent] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [genreMap, setGenreMap] = useState({})
  const [genreList, setGenreList] = useState([])

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const ITEMS_PER_PAGE = 20

  // Featured content states
  const [featured, setFeatured] = useState(null)
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const carouselTimerRef = useRef(null)

  // Helper function to validate if content has required information
  const isValidContent = useCallback((item) => {
    if (!item) return false

    // Basic requirements for all types
    const hasIdentifier = item.id > 0
    const hasTitle = item.title || item.name
    const hasPoster = !!item.poster_path // Must have a poster

    // Different validations based on media type
    if (item.media_type === 'movie' || (hasTitle && item.title)) {
      // For movies: require title, poster, and overview
      return hasIdentifier && hasTitle && hasPoster && item.overview
    } else if (
      item.media_type === 'tv' ||
      (hasTitle && item.name && !item.title)
    ) {
      // For TV shows: require poster, title, overview and air date
      return (
        hasIdentifier &&
        hasTitle &&
        hasPoster &&
        item.overview &&
        item.overview.trim() !== '' &&
        ((item.first_air_date && item.first_air_date.trim() !== '') ||
          (item.release_date && item.release_date.trim() !== ''))
      )
    } else if (item.media_type === 'person') {
      // For people: need name and profile path
      return hasIdentifier && hasTitle && item.profile_path
    }

    // If media_type is not specified and can't determine the type, use strict validation
    return hasIdentifier && hasTitle && hasPoster && item.overview
  }, [])

  // Format movie data for consistent display
  const formatMovieData = (movie) => ({
    id: movie.id,
    type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie'),
    title: movie.title || movie.name,
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    backdrop: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : null,
    rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
    genre:
      movie.genre_ids && movie.genre_ids.length > 0
        ? genreMap[movie.genre_ids[0]] || 'Unknown'
        : 'Unknown',
    year:
      movie.release_date || movie.first_air_date
        ? (movie.release_date || movie.first_air_date).substring(0, 4)
        : 'Unknown',
    description: movie.overview,
    genres: movie.genre_ids
      ? movie.genre_ids
          .map((id) => genreMap[id] || 'Unknown')
          .filter((name) => name !== 'Unknown')
      : [],
  })

  // Load genres for proper display and search
  useEffect(() => {
    const loadGenres = async () => {
      try {
        // Fetch movie genres
        const movieGenres = await fetchGenres('movie')
        // Fetch TV genres
        const tvGenres = await fetchGenres('tv')

        // Combine genres and remove duplicates
        const allGenres = [
          ...movieGenres,
          ...tvGenres.filter(
            (tvGenre) =>
              !movieGenres.some(
                (movieGenre) => movieGenre.name === tvGenre.name
              )
          ),
        ]

        // Create a map for quick lookups
        const genreMapping = {}
        allGenres.forEach((genre) => {
          genreMapping[genre.id] = genre.name
        })

        setGenreMap(genreMapping)
        setGenreList(allGenres)
      } catch (err) {
        console.error('Error loading genres:', err)
        setError('Failed to load genres')
      }
    }

    loadGenres()
  }, [])

  // Load popular content when no search is active
  useEffect(() => {
    if (!searchQuery) {
      loadPopularMovies()
      loadFeaturedContent()
      loadTrendingContent()
    } else {
      performSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentPage, activeTab])

  // Clean up carousel timer on unmount
  useEffect(() => {
    if (featuredItems.length > 0) {
      // Clear previous timer if exists
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
      }

      // Set new timer
      carouselTimerRef.current = setInterval(() => {
        setCurrentFeaturedIndex((prevIndex) => {
          const nextIndex =
            prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
          setFeatured(featuredItems[nextIndex])
          return nextIndex
        })
      }, 8000)
    }

    // Cleanup on unmount
    return () => {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current)
      }
    }
  }, [featuredItems])

  const loadTrendingContent = async () => {
    try {
      const data = await fetchTrending('all', 'day')

      if (data.results && data.results.length > 0) {
        const validResults = data.results
          .filter(isValidContent)
          .map(formatMovieData)

        setTrendingContent(validResults)
      }
    } catch (error) {
      console.error('Error loading trending content:', error)
    }
  }

  const loadPopularMovies = async () => {
    setLoading(true)
    try {
      let results

      if (activeTab === 'movies') {
        const data = await fetchMovies(
          { sort_by: 'popularity.desc' },
          currentPage
        )
        results = data.results.map((item) => ({ ...item, media_type: 'movie' }))
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      } else if (activeTab === 'tv') {
        const data = await fetchShows(
          { sort_by: 'popularity.desc' },
          currentPage
        )
        results = data.results.map((item) => ({ ...item, media_type: 'tv' }))
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      } else {
        // All content (trending)
        const data = await fetchTrending('all', 'week', currentPage)
        results = data.results
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      }

      // Filter valid content and format
      const validResults = results
        .filter(isValidContent)
        .map((item) => formatMovieData(item))

      setPopularMovies(validResults)
    } catch (error) {
      console.error('Error loading popular content:', error)
      setError('Failed to load content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedContent = async () => {
    try {
      const trendingData = await fetchTrending('all', 'day')

      if (trendingData.results && trendingData.results.length > 0) {
        // Filter for items with backdrop images
        const validResults = trendingData.results.filter(
          (item) => isValidContent(item) && item.backdrop_path
        )

        if (validResults.length > 0) {
          // Get top 5 trending items for featured content
          const featured = validResults.slice(0, 5).map(formatMovieData)
          setFeaturedItems(featured)
          setFeatured(featured[0])
        }
      }
    } catch (error) {
      console.error('Error loading featured content:', error)
      // Don't show error for featured content, just skip showing it
    }
  }

  const performSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      let results
      const page = currentPage || 1

      // Check if this is a genre search
      const genreMatch = searchQuery.match(/^genre-(\d+)$/)
      if (genreMatch) {
        const genreId = genreMatch[1]
        // Search by genre ID
        const mediaType = activeTab === 'all' ? null : activeTab
        const data = await searchByGenre(genreId, mediaType, page)
        results = data.results
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      } else {
        // Normal text search
        const params = {
          query: searchQuery,
          page,
        }

        // If a specific tab is selected, filter by media type
        if (activeTab !== 'all') {
          params.media_type = activeTab
        }

        const data = await searchTMDB(params)
        results = data.results
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      }

      // Filter valid content and format for display
      const validResults = results
        .filter(isValidContent)
        .map((item) => formatMovieData(item))

      setSearchResults(validResults)
    } catch (error) {
      console.error('Search error:', error)
      setError('An error occurred while searching. Please try again.')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Function to go to the next item
  const goToNext = (e) => {
    e.preventDefault()
    setCurrentFeaturedIndex((prevIndex) =>
      prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
    )

    // Reset timer
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current)
      carouselTimerRef.current = setInterval(() => {
        setCurrentFeaturedIndex((prev) => {
          const nextIndex = (prev + 1) % featuredItems.length
          setFeatured(featuredItems[nextIndex])
          return nextIndex
        })
      }, 8000)
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
      carouselTimerRef.current = setInterval(() => {
        setCurrentFeaturedIndex((prev) => {
          const nextIndex = (prev + 1) % featuredItems.length
          setFeatured(featuredItems[nextIndex])
          return nextIndex
        })
      }, 8000)
    }
  }

  // Function to manually change featured item
  const changeFeaturedItem = (index) => {
    // Reset the timer when manually changed
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current)
      carouselTimerRef.current = setInterval(() => {
        setCurrentFeaturedIndex((prev) => {
          const nextIndex = (prev + 1) % featuredItems.length
          setFeatured(featuredItems[nextIndex])
          return nextIndex
        })
      }, 8000)
    }
    setCurrentFeaturedIndex(index)
    setFeatured(featuredItems[index])
  }

  return (
    <div className="bg-[#121212] min-h-screen pb-10">
      <div className="container mx-auto px-4 md:px-6 pt-6">
        {/* Compact Search form */}
        <form onSubmit={handleSearchSubmit} className="mb-8 max-w-lg mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search movies, TV shows, actors..."
              className="w-full bg-[#1a1a1a] text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5ccfee] border border-gray-800 shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-[#5ccfee] transition-colors"
              aria-label="Search"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Compact Genre selector */}
          {genreList.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {genreList.slice(0, 8).map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => {
                    // Toggle if genre is currently selected
                    const newSearchInput = searchInput.includes(
                      `genre:${genre.name}`
                    )
                      ? searchInput.replace(`genre:${genre.name}`, '').trim()
                      : `${searchInput.trim()} genre:${genre.name}`.trim()
                    setSearchInput(newSearchInput)
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    searchInput.includes(`genre:${genre.name}`)
                      ? 'bg-[#5ccfee] text-black'
                      : 'bg-[#252525] text-white hover:bg-[#333]'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Featured content */}
        {!searchQuery && featured && !loading && (
          <FeaturedMovie
            movie={featured}
            featuredItems={featuredItems}
            currentFeaturedIndex={currentFeaturedIndex}
            changeFeaturedItem={changeFeaturedItem}
            goToNext={goToNext}
            goToPrev={goToPrev}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-3 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Trending content when no search is active */}
        {!searchQuery && !loading && trendingContent.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl text-white font-medium pl-1">
                Trending Now
              </h2>
              <div className="flex items-center space-x-6 pr-2">
                <button
                  onClick={() => {
                    setActiveTab('all')
                    setCurrentPage(1)
                  }}
                  className={`text-sm font-medium transition-colors border-b-2 pb-0.5 ${
                    activeTab === 'all'
                      ? 'text-[#5ccfee] border-[#5ccfee]'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setActiveTab('movies')
                    setCurrentPage(1)
                  }}
                  className={`text-sm font-medium transition-colors border-b-2 pb-0.5 ${
                    activeTab === 'movies'
                      ? 'text-[#5ccfee] border-[#5ccfee]'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => {
                    setActiveTab('tv')
                    setCurrentPage(1)
                  }}
                  className={`text-sm font-medium transition-colors border-b-2 pb-0.5 ${
                    activeTab === 'tv'
                      ? 'text-[#5ccfee] border-[#5ccfee]'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  TV Shows
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {trendingContent.slice(0, 10).map((movie) => (
                <MovieCard
                  key={`trending-${movie.id}-${movie.type}`}
                  movie={movie}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content tabs */}
        {!loading && searchResults.length > 0 && (
          <div>
            <h2 className="text-xl text-white font-medium mb-5 pl-1">
              Search Results
              {searchQuery && (
                <span className="text-gray-400 ml-1">for "{searchQuery}"</span>
              )}
              {totalResults > 0 && (
                <span className="text-sm text-gray-400 font-normal ml-2">
                  ({totalResults} results)
                </span>
              )}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {searchResults.map((movie) => (
                <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {!loading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-400 mb-3">
              No results found for "{searchQuery}"
            </p>
            <p className="text-gray-500 text-sm">
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
          </div>
        )}

        {/* Popular content when no search is active */}
        {!searchQuery && !loading && popularMovies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl text-white font-medium mb-5 pl-1">
              {activeTab === 'movies'
                ? 'Popular Movies'
                : activeTab === 'tv'
                ? 'Popular TV Shows'
                : 'Popular Content'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {popularMovies.map((movie) => (
                <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} />
              ))}
            </div>

            {/* Pagination for popular content */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-white">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
