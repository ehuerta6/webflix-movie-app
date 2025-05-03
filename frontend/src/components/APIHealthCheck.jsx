import { useState, useEffect, memo, useCallback } from 'react'
import { checkAPIHealth } from '../services/api'
import Button from './common/Button'

const POLL_INTERVAL = 30000 // 30 seconds

const APIHealthCheck = memo(() => {
  const [isHealthy, setIsHealthy] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkHealth = useCallback(async () => {
    setIsLoading(true)
    try {
      const healthy = await checkAPIHealth()
      setIsHealthy(healthy)
    } catch (error) {
      console.error('Health check error:', error)
      setIsHealthy(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial health check
  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  // Polling for health checks
  useEffect(() => {
    // Only set up polling if the API is unhealthy
    if (isHealthy === false) {
      const interval = setInterval(checkHealth, POLL_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [isHealthy, checkHealth])

  // Handle manual refresh
  const handleRetry = useCallback(() => {
    checkHealth()
  }, [checkHealth])

  if (isLoading || isHealthy) {
    return null // Don't show during loading or if API is healthy
  }

  // Only show error message if API is not healthy
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <p className="flex items-center justify-center">
        <span>
          Unable to connect to the TMDB API. Please check your internet
          connection and try again.
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRetry}
          className="ml-4 bg-white text-red-600 hover:bg-gray-100"
        >
          Retry
        </Button>
      </p>
    </div>
  )
})

export default APIHealthCheck
