/**
 * Common genre mapping for movie and TV IDs to names
 */
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
 * TMDB API configuration
 */
export const TMDB_CONFIG = {
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  POSTER_SIZES: {
    SMALL: 'w185',
    MEDIUM: 'w342',
    LARGE: 'w500',
    ORIGINAL: 'original',
  },
  BACKDROP_SIZES: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original',
  },
}

/**
 * Common image utilities
 */
export const DEFAULT_USER_PROFILE = {
  profileColor: 'bg-[#5ccfee]',
  bannerColor: 'from-[#00BFFF] to-[#5ccfee]',
  rawProfileColor: '#5ccfee',
  rawBannerColor: '#00BFFF',
}

/**
 * Media types
 */
export const MEDIA_TYPES = {
  MOVIE: 'movie',
  TV: 'tv',
  PERSON: 'person',
  ALL: 'all',
}
