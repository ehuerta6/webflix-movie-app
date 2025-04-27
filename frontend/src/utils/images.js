const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

/**
 * Generate proper TMDB image URLs
 * @param {string} path - The image path from TMDB
 * @param {string} size - The size of the image (w500, original, etc.)
 * @returns {string|null} - Full image URL or null if path is invalid
 */
export const getTMDBImageUrl = (path, size = 'w500') => {
  if (!path) return null
  return `${IMAGE_BASE_URL}/${size}${path}`
}

/**
 * Preload images for smoother UI transitions
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 * @returns {Promise<void>}
 */
export const preloadImages = (imageUrls) => {
  if (!imageUrls || !imageUrls.length) return Promise.resolve()

  const promises = imageUrls.map((url) => {
    if (!url) return Promise.resolve()

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve() // Resolve even on error to avoid blocking
      img.src = url
    })
  })

  return Promise.all(promises)
}

/**
 * Generate a fallback color based on string input
 * @param {string} str - Input string to generate color from
 * @returns {string} - Hex color code
 */
export const generateColorFromString = (str) => {
  if (!str) return '#5ccfee' // Default color

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += ('00' + value.toString(16)).substr(-2)
  }

  return color
}
