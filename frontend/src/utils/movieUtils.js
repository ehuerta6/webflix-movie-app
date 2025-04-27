/**
 * Movie utilities for consistent formatting and validation
 */

// Common genre map used across the application
export const GENRE_MAP = {
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

/**
 * Convert genre IDs to genre names
 * @param {Array<number>} genreIds - Array of genre IDs
 * @returns {Array<string>} Array of genre names
 */
export const getGenreNames = (genreIds = []) => {
  if (!genreIds || !Array.isArray(genreIds)) return []

  return genreIds
    .map((id) => GENRE_MAP[id] || 'Unknown')
    .filter((name) => name !== 'Unknown')
}

/**
 * Validate if a movie/show has all required fields
 * @param {Object} item - Movie or TV show object
 * @param {boolean} requireBackdrop - Whether to require backdrop image (for featured content)
 * @returns {boolean} True if the item is valid
 */
export const isValidContent = (item, requireBackdrop = false) => {
  if (!item) return false

  // Basic requirements for all types
  const hasBasics =
    (item.title || item.name) &&
    // Require poster_path for all content
    item.poster_path &&
    item.overview?.trim() !== '' &&
    // Check for valid rating (must exist and be > 0)
    typeof item.vote_average === 'number' &&
    item.vote_average > 0

  // Check for backdrop if required (usually for featured content)
  if (requireBackdrop && !item.backdrop_path) {
    return false
  }

  // For similar content, only basic validation
  if (item.belongs_to_collection || item.similar) return hasBasics

  // Type-specific validation
  if (item.media_type === 'movie' || (!item.media_type && item.release_date)) {
    return hasBasics && item.release_date?.trim() !== ''
  }

  if (item.media_type === 'tv' || (!item.media_type && item.first_air_date)) {
    return hasBasics && item.first_air_date?.trim() !== ''
  }

  // If media_type is 'person', check for profile_path
  if (item.media_type === 'person') {
    return item.id > 0 && (item.name || item.title) && item.profile_path
  }

  // Default fallback for unknown types
  return hasBasics
}

/**
 * Format movie data consistently across the application
 * @param {Object} movie - Raw movie data from API
 * @returns {Object} Formatted movie object
 */
export const formatMovieData = (movie) => {
  if (!movie) return null

  // Determine genre - try different sources
  let genre = 'Unknown'
  let genres = []

  // Extract from genre_ids array
  if (
    movie.genre_ids &&
    Array.isArray(movie.genre_ids) &&
    movie.genre_ids.length > 0
  ) {
    genres = getGenreNames(movie.genre_ids)
    genre = genres[0] || 'Unknown'
  }
  // Extract from genres array of objects
  else if (
    movie.genres &&
    Array.isArray(movie.genres) &&
    movie.genres.length > 0
  ) {
    if (typeof movie.genres[0] === 'object' && movie.genres[0].name) {
      genres = movie.genres.map((g) => g.name)
      genre = genres[0]
    } else if (typeof movie.genres[0] === 'string') {
      genres = movie.genres
      genre = genres[0]
    }
  }
  // Use directly provided genre
  else if (movie.genre && typeof movie.genre === 'string') {
    genre = movie.genre
    genres = [genre]
  }

  // Determine media type
  const mediaType =
    movie.media_type || movie.type || (movie.first_air_date ? 'tv' : 'movie')

  // If still unknown, use the type at minimum
  if (genre === 'Unknown') {
    genre = mediaType === 'tv' ? 'TV Show' : 'Movie'
  }

  return {
    id: movie.id,
    type: mediaType,
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
    genres: genres,
  }
}

/**
 * Extract trailer URL from videos data
 * @param {Object} videos - Videos object from API
 * @returns {string|null} YouTube URL or null if no trailer found
 */
export const getTrailerUrl = (videos) => {
  if (!videos?.results?.length) return null

  const trailer =
    videos.results.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.results[0]

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
}
