import { Navigate } from 'react-router-dom'
import { memo } from 'react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './common'

// Memoizing the component to prevent unnecessary re-renders
const ProtectedRoute = memo(({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
})

export default ProtectedRoute
