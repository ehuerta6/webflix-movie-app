import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Details from './pages/Details'
import Movies from './pages/Movies'
import Shows from './pages/Shows'
import SearchPage from './pages/SearchPage'
import Auth from './pages/Auth'
import User from './pages/User'
import ProtectedRoute from './components/ProtectedRoute'
import ProfileLoader from './components/ProfileLoader'
import './App.css'

function App() {
  return (
    <BrowserRouter basename="/webflix-movie-webapp">
      <div className="flex flex-col min-h-screen">
        <ProfileLoader />
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/shows" element={<Shows />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              }
            />
            <Route path="/:type/:id" element={<Details />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
