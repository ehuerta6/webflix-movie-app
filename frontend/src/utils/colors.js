/**
 * Utility functions for color manipulation
 */

/**
 * Darkens a hex color by the specified percentage
 * @param {string} hex - The hex color to darken
 * @param {number} percent - The percentage to darken by (0-100)
 * @returns {string} - The darkened hex color
 */
export const darkenColor = (hex, percent) => {
  // Remove the # if present
  hex = hex.replace('#', '')

  // Parse the hex color to RGB
  let r = parseInt(hex.substring(0, 2), 16)
  let g = parseInt(hex.substring(2, 4), 16)
  let b = parseInt(hex.substring(4, 6), 16)

  // Darken each channel
  r = Math.floor((r * (100 - percent)) / 100)
  g = Math.floor((g * (100 - percent)) / 100)
  b = Math.floor((b * (100 - percent)) / 100)

  // Convert back to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Lightens a hex color by the specified percentage
 * @param {string} hex - The hex color to lighten
 * @param {number} percent - The percentage to lighten by (0-100)
 * @returns {string} - The lightened hex color
 */
export const lightenColor = (hex, percent) => {
  // Remove the # if present
  hex = hex.replace('#', '')

  // Parse the hex color to RGB
  let r = parseInt(hex.substring(0, 2), 16)
  let g = parseInt(hex.substring(2, 4), 16)
  let b = parseInt(hex.substring(4, 6), 16)

  // Lighten each channel
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)))
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)))
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)))

  // Convert back to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Converts a hex color to a Tailwind-compatible format
 * @param {string} hex - The hex color code
 * @returns {string} - Tailwind-compatible string for the color
 */
export const hexToTailwindFormat = (hex) => {
  return `bg-[${hex}]`
}

/**
 * Creates a gradient string for Tailwind from two colors
 * @param {string} startColor - The starting color hex
 * @param {string} endColor - The ending color hex
 * @returns {string} - Tailwind-compatible gradient string
 */
export const createGradientClass = (startColor, endColor) => {
  return `from-[${startColor}] to-[${endColor}]`
}
