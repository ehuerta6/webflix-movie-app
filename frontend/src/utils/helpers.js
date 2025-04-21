import { GENRE_MAP, TMDB_CONFIG } from './constants'

/**
 * Format media data consistently across the application
 *
 * @param {Object} media - The media object from TMDB API
 * @param {string} type - Optional type override (movie/tv)
 * @returns {Object} Formatted media object
 */
export const formatMediaData = (media, type = null) => {
  if (!media) return null

  // Format genre information
  let genreNames = []
  if (media.genres && Array.isArray(media.genres)) {
    // Direct genre objects from API
    genreNames = media.genres.map((g) => g.name)
  } else if (media.genre_ids && Array.isArray(media.genre_ids)) {
    // Just genre IDs - use genre map
    genreNames = media.genre_ids
      .map((id) => GENRE_MAP[id] || 'Unknown')
      .filter((name) => name !== 'Unknown')
  }

  // Return formatted media item
  return {
    id: media.id,
    type: type || media.media_type || (media.first_air_date ? 'tv' : 'movie'),
    title: media.title || media.name || 'Unknown Title',
    poster_path: media.poster_path,
    poster: media.poster_path
      ? `${TMDB_CONFIG.IMAGE_BASE_URL}/${TMDB_CONFIG.POSTER_SIZES.LARGE}${media.poster_path}`
      : null,
    backdrop_path: media.backdrop_path,
    backdrop: media.backdrop_path
      ? `${TMDB_CONFIG.IMAGE_BASE_URL}/${TMDB_CONFIG.BACKDROP_SIZES.LARGE}${media.backdrop_path}`
      : null,
    vote_average: media.vote_average,
    rating: media.vote_average ? media.vote_average.toFixed(1) : '0.0',
    release_date: media.release_date || media.first_air_date,
    year: media.release_date
      ? media.release_date.split('-')[0]
      : media.first_air_date
      ? media.first_air_date.split('-')[0]
      : 'N/A',
    genres: genreNames,
    genre: genreNames.length > 0 ? genreNames[0] : 'Unknown',
    overview: media.overview || '',
  }
}

/**
 * Format runtime in hours and minutes
 *
 * @param {number} minutes - Runtime in minutes
 * @returns {string} Formatted runtime
 */
export const formatRuntime = (minutes) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${minutes}m`
}

/**
 * Extract YouTube trailer URL from videos object
 *
 * @param {Object} videos - Videos object from TMDB API
 * @returns {string|null} YouTube URL or null
 */
export const getTrailerUrl = (videos) => {
  if (!videos?.results?.length) return null

  const trailer =
    videos.results.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.results[0]

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
}

/**
 * Validates if content has sufficient data to display
 *
 * @param {Object} item - Media item to validate
 * @returns {boolean} Whether the item is valid for display
 */
export const isValidContent = (item) => {
  if (!item) return false

  const hasBasics =
    (item.title || item.name) &&
    item.poster_path &&
    item.overview?.trim() &&
    item.vote_average > 0

  // For similar content, only basic validation
  if (item.belongs_to_collection || item.similar) return hasBasics

  // Type-specific validation
  if (item.media_type === 'movie' || !item.media_type) {
    return hasBasics && item.release_date?.trim()
  }

  if (item.media_type === 'tv') {
    return (
      hasBasics &&
      item.first_air_date?.trim() &&
      (item.number_of_episodes !== undefined ||
        item.number_of_seasons !== undefined)
    )
  }

  return hasBasics
}

/**
 * Preload images for better UX
 *
 * @param {Array<string>} urls - Array of image URLs to preload
 * @returns {Promise<void>}
 */
export const preloadImages = (urls) => {
  if (!urls || !urls.length) return Promise.resolve()

  return Promise.all(
    urls.map((url) => {
      if (!url) return Promise.resolve()

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = img.onerror = () => resolve() // Always resolve regardless of success
        img.src = url
      })
    })
  )
}
