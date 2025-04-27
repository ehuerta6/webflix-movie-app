import { useState, useEffect } from 'react'
import { checkAPIHealth } from '../services/api'

const APIHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
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
    }

    checkHealth()
  }, [])

  if (isLoading) {
    return null // Don't show during loading
  }

  if (isHealthy) {
    return null // Don't show if API is healthy
  }

  // Only show error message if API is not healthy
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <p>
        Unable to connect to the backend API. Please make sure the Flask server
        is running.
        <button
          className="ml-4 bg-white text-red-600 px-3 py-1 rounded text-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </p>
    </div>
  )
}

export default APIHealthCheck
