import React, { useState, useEffect, useCallback } from 'react'

/**
 * Hook to debounce a value
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
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

/**
 * Hook to manage loading states for different actions
 * @param {Array<string>} actions - Array of action names
 * @returns {Object} Object with loading states and setter functions
 */
export const useLoadingStates = (actions = []) => {
  const initialState = actions.reduce((acc, action) => {
    acc[action] = false
    return acc
  }, {})

  const [loadingStates, setLoadingStates] = useState(initialState)

  const setLoading = useCallback((action, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [action]: isLoading,
    }))
  }, [])

  const resetLoading = useCallback(() => {
    setLoadingStates(initialState)
  }, [initialState])

  return {
    loadingStates,
    setLoading,
    resetLoading,
    isAnyLoading: Object.values(loadingStates).some((state) => state),
  }
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
 * Hook to manage a timer that resets on specified dependencies changes
 * @param {Function} callback - Function to call when timer fires
 * @param {number} delay - Delay in milliseconds
 * @param {Array<any>} dependencies - Dependencies that reset the timer when changed
 * @returns {Object} Object with timer controls
 */
export const useResetableTimer = (callback, delay, dependencies = []) => {
  const timerRef = React.useRef(null)

  const start = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(callback, delay)
  }, [callback, delay])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    start()
  }, [stop, start])

  // Start the timer on mount
  useEffect(() => {
    start()
    return stop
  }, [start, stop, ...dependencies])

  return { start, stop, reset }
}

/**
 * Format a date string (YYYY-MM-DD) to a more readable format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {boolean} includeYear - Whether to include the year in the result
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, includeYear = true) => {
  if (!dateString) return 'Unknown'

  try {
    const date = new Date(dateString)
    const options = {
      month: 'long',
      day: 'numeric',
      ...(includeYear && { year: 'numeric' }),
    }
    return date.toLocaleDateString(undefined, options)
  } catch {
    return dateString
  }
}

/**
 * Format runtime in minutes to hours and minutes
 * @param {number} minutes - Runtime in minutes
 * @returns {string} Formatted runtime string
 */
export const formatRuntime = (minutes) => {
  if (!minutes || typeof minutes !== 'number') return 'N/A'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
