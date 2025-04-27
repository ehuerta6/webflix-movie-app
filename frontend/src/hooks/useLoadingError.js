import { useState, useCallback } from 'react'

/**
 * Custom hook for managing loading and error states
 * @returns {Object} Object with loading and error state and utility functions
 */
export default function useLoadingError() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Execute an async operation with loading and error handling
   * @param {Function} asyncOperation - Async function to execute
   * @param {Object} options - Options object
   * @param {string} options.errorMessage - Custom error message
   * @param {Function} options.onSuccess - Callback on success
   * @param {Function} options.onError - Callback on error
   * @param {boolean} options.resetErrorOnStart - Whether to reset error when operation starts
   * @returns {Promise<any>} Result of the async operation
   */
  const execute = useCallback(
    async (
      asyncOperation,
      {
        errorMessage = 'An error occurred',
        onSuccess = null,
        onError = null,
        resetErrorOnStart = true,
      } = {}
    ) => {
      if (resetErrorOnStart) setError(null)
      setIsLoading(true)

      try {
        const result = await asyncOperation()
        if (onSuccess) onSuccess(result)
        return result
      } catch (err) {
        console.error(err)
        const message = err.message || errorMessage
        setError(message)
        if (onError) onError(err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Reset both loading and error states
   */
  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    setIsLoading,
    setError,
    execute,
    reset,
  }
}
