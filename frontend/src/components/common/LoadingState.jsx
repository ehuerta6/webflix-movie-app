import { memo } from 'react'
import { Spinner } from './index'

/**
 * Reusable loading component with consistent styling
 */
const LoadingState = memo(
  ({
    isLoading = true,
    error = null,
    isEmpty = false,
    emptyMessage = 'No items found',
    errorMessage = 'Failed to load data',
    minHeight = '200px',
    children = null,
    onRetry = null,
    showRetryButton = true,
    containerClassName = '',
    fullScreen = false,
  }) => {
    // Loading state
    if (isLoading) {
      const content = (
        <div
          className={`flex flex-col items-center justify-center ${containerClassName}`}
          style={{ minHeight }}
        >
          <Spinner size="lg" color="primary" className="mb-3" />
          <p className="text-gray-400">Loading...</p>
        </div>
      )

      return fullScreen ? (
        <div className="fixed inset-0 bg-[#121212] bg-opacity-80 flex items-center justify-center z-50">
          {content}
        </div>
      ) : (
        content
      )
    }

    // Error state
    if (error) {
      return (
        <div
          className={`flex flex-col items-center justify-center ${containerClassName}`}
          style={{ minHeight }}
        >
          <p className="text-gray-400 mb-3">{errorMessage}</p>
          {error !== true && typeof error === 'string' && (
            <p className="text-gray-500 text-sm mb-4">{error}</p>
          )}
          {showRetryButton && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-[#5ccfee] text-black rounded hover:bg-[#4ab9d9] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )
    }

    // Empty state
    if (isEmpty) {
      return (
        <div
          className={`flex flex-col items-center justify-center ${containerClassName}`}
          style={{ minHeight }}
        >
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )
    }

    // Content state
    return children
  }
)

export default LoadingState
