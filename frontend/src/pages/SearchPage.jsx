import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  searchMedia,
  fetchGenres,
  searchByGenre,
  fetchMovies,
  fetchShows,
  fetchTrending,
} from '../services/api'
import Pagination from '../components/Pagination'
import MovieCard from '../components/MovieCard'
import FeaturedMovie from '../components/FeaturedMovie'

// Debounce helper for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)
  // Debounce the search input to avoid unnecessary renders
  const debouncedSearchInput = useDebounce(searchInput, 300)

  const [searchResults, setSearchResults] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [trendingContent, setTrendingContent] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [genreMap, setGenreMap] = useState({})
  const [genreList, setGenreList] = useState([])

  // Pagination states
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParams.get('page')) || 1
  )
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const ITEMS_PER_PAGE = 20

  // Featured content states
  const [featured, setFeatured] = useState(null)
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const carouselTimerRef = useRef(null)

  // Listen for URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pageParam = parseInt(params.get('page')) || 1
    const queryParam = params.get('q') || ''
    const tabParam = params.get('tab') || 'all'

    // Skip updating searchInput if the only difference is empty vs undefined
    // This prevents the input from being cleared when a user is typing
    const shouldUpdateSearchInput =
      (queryParam && queryParam !== searchInput) ||
      (!queryParam &&
        searchInput &&
        !document.activeElement?.matches('input[type="text"]'))

    if (shouldUpdateSearchInput) {
      setSearchInput(queryParam)
    }

    // Update current page if URL page changes
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam)
    }

    // Update active tab if URL tab changes
    if (tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [location.search, currentPage, activeTab])

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
  const formatMovieData = (movie) => {
    // Create a better genre mapping with more fallbacks
    let genre = 'Unknown'
    if (movie.genre_ids && movie.genre_ids.length > 0) {
      genre = genreMap[movie.genre_ids[0]] || 'Unknown'
    } else if (
      movie.genres &&
      Array.isArray(movie.genres) &&
      movie.genres.length > 0
    ) {
      // Some API responses include full genre objects directly
      if (typeof movie.genres[0] === 'object' && movie.genres[0].name) {
        genre = movie.genres[0].name
      } else if (typeof movie.genres[0] === 'string') {
        genre = movie.genres[0]
      }
    }

    // If still unknown, use the type at minimum
    if (genre === 'Unknown') {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie')
      genre = type === 'tv' ? 'TV Show' : 'Movie'
    }

    return {
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
      genre: genre,
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
    }
  }

  // Load genres for proper display and search
  useEffect(() => {
    const loadGenres = async () => {
      try {
        // Fetch movie genres
        const movieGenres = await fetchGenres('movie')
        // Fetch TV genres
        const tvGenres = await fetchGenres('tv')

        // Create a map to track unique genres by name to avoid duplicates
        const uniqueGenres = new Map()

        // Process movie genres first
        movieGenres.forEach((genre) => {
          uniqueGenres.set(genre.name, {
            ...genre,
            source: 'movie',
          })
        })

        // Add TV genres
        tvGenres.forEach((genre) => {
          // If we already have this genre from movies, mark it as both
          if (uniqueGenres.has(genre.name)) {
            uniqueGenres.set(genre.name, {
              ...uniqueGenres.get(genre.name),
              source: 'both',
            })
          } else {
            // Otherwise add it as a TV genre
            uniqueGenres.set(genre.name, {
              ...genre,
              source: 'tv',
            })
          }
        })

        // Convert map to array and sort alphabetically
        const allGenres = Array.from(uniqueGenres.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )

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

      if (activeTab === 'movie') {
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
    // If search query is empty, just load the popular/trending content
    if (!searchQuery.trim()) {
      loadPopularMovies()
      loadFeaturedContent()
      loadTrendingContent()
      return
    }

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
        const mediaType = activeTab === 'all' ? 'movie' : activeTab
        const data = await searchByGenre(genreId, mediaType, page)
        results = data.results
        setTotalPages(data.total_pages)
        setTotalResults(data.total_results)
      } else {
        // Normal text search
        let type = 'multi'

        // If a specific tab is selected, use the appropriate search type
        if (activeTab === 'movie') {
          type = 'movie'
        } else if (activeTab === 'tv') {
          type = 'tv'
        }

        console.log(
          `Searching with type: ${type}, query: ${searchQuery}, page: ${page}`
        )
        const data = await searchMedia(searchQuery, type, page)
        results = data.results

        // If using multi search but a specific tab is selected, filter the results
        if (type === 'multi' && activeTab !== 'all') {
          results = results.filter((item) => {
            if (activeTab === 'movie') {
              return item.media_type === 'movie'
            } else if (activeTab === 'tv') {
              return item.media_type === 'tv'
            }
            return true
          })
        }

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
    if (debouncedSearchInput.trim()) {
      // Reset to page 1 when submitting a new search
      navigate(
        `/search?q=${encodeURIComponent(
          debouncedSearchInput.trim()
        )}&page=1&tab=${activeTab}`
      )
      setCurrentPage(1)
    } else {
      // If search is empty, clear the search query and return to default view
      navigate(`/search`)
      setCurrentPage(1)
    }
  }

  const handlePageChange = (newPage) => {
    // Preserve search query and tab when changing pages
    if (searchQuery) {
      navigate(
        `/search?q=${encodeURIComponent(
          searchQuery
        )}&page=${newPage}&tab=${activeTab}`
      )
    } else {
      navigate(`/search?page=${newPage}&tab=${activeTab}`)
    }
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
              onChange={(e) => {
                // Just update the local state without navigating
                setSearchInput(e.target.value)
              }}
              placeholder="Search movies, TV shows, actors..."
              className="w-full bg-[#1a1a1a] text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5ccfee] border border-gray-800 shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  // First clear the input
                  setSearchInput('')
                  // Then navigate after a short delay to avoid state conflicts
                  setTimeout(() => {
                    navigate('/search')
                  }, 0)
                }}
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

          {/* Genre selector with scrollable container */}
          {genreList.length > 0 && (
            <div className="mt-4 mb-2">
              <h2 className="text-sm text-gray-400 text-center mb-2">
                Browse by Genre
              </h2>
              <div className="max-w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                <div className="flex flex-wrap gap-2 justify-center min-w-max px-2">
                  {genreList.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => {
                        // Use the genre name directly as search term
                        const newValue = genre.name
                        setSearchInput(newValue)

                        // Auto-search after setting the genre
                        setTimeout(() => {
                          navigate(
                            `/search?q=${encodeURIComponent(
                              newValue
                            )}&page=1&tab=${activeTab}`
                          )
                        }, 10)
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        searchInput === genre.name
                          ? 'bg-[#5ccfee] text-black shadow-lg shadow-[#5ccfee]/20'
                          : 'bg-[#252525] text-white hover:bg-[#333] hover:scale-105'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
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
              {/* Only show filter tabs when searching */}
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl text-white font-medium pl-1">
                Search Results
                <span className="text-gray-400 ml-1">for "{searchQuery}"</span>
                {totalResults > 0 && (
                  <span className="text-sm text-gray-400 font-normal ml-2">
                    ({totalResults} results)
                  </span>
                )}
              </h2>

              {/* Show filter tabs for search results */}
              <div className="flex items-center space-x-6 pr-2">
                <button
                  onClick={() => {
                    setActiveTab('all')
                    setCurrentPage(1)
                    if (searchQuery) {
                      navigate(
                        `/search?q=${encodeURIComponent(
                          searchQuery
                        )}&page=1&tab=all`
                      )
                    } else {
                      navigate(`/search?page=1&tab=all`)
                    }
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
                    setActiveTab('movie')
                    setCurrentPage(1)
                    if (searchQuery) {
                      navigate(
                        `/search?q=${encodeURIComponent(
                          searchQuery
                        )}&page=1&tab=movie`
                      )
                    } else {
                      navigate(`/search?page=1&tab=movie`)
                    }
                  }}
                  className={`text-sm font-medium transition-colors border-b-2 pb-0.5 ${
                    activeTab === 'movie'
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
                    if (searchQuery) {
                      navigate(
                        `/search?q=${encodeURIComponent(
                          searchQuery
                        )}&page=1&tab=tv`
                      )
                    } else {
                      navigate(`/search?page=1&tab=tv`)
                    }
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
              {searchResults.map((movie) => (
                <MovieCard key={`${movie.id}-${movie.type}`} movie={movie} />
              ))}
            </div>

            {/* Pagination - Only show for search results */}
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
              {activeTab === 'movie'
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

            {/* Don't show pagination for popular content */}
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
