import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MovieCard = memo(function MovieCard({ movie }) {
  const { id, type = 'movie', title, poster, rating, genre, year } = movie
  const [imageLoaded, setImageLoaded] = useState(false)
  const { currentUser, addToWatchlist, addToFavorites } = useAuth()

  // Handle adding to watchlist
  const handleAddToWatchlist = async (e) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Prevent event bubbling

    console.log('Adding to watchlist:', movie)
    try {
      if (addToWatchlist) {
        // Format movie data as needed for our updated addToWatchlist function
        const mediaToAdd = {
          id: id,
          title: title,
          poster_path: poster,
          media_type: type,
          vote_average: rating ? parseFloat(rating) : 0,
          release_date: year ? `${year}-01-01` : null,
        }

        await addToWatchlist(mediaToAdd)
        console.log('Successfully added to watchlist!')
      } else {
        console.log('addToWatchlist function not found in AuthContext')
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    }
  }

  // Handle adding to favorites (liked movies)
  const handleAddToFavorites = async (e) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Prevent event bubbling

    console.log('Adding to liked movies:', movie)
    try {
      if (addToFavorites) {
        // Format movie data as needed for addToFavorites function
        const mediaToAdd = {
          id: id,
          title: title,
          poster_path: poster,
          media_type: type,
          vote_average: rating ? parseFloat(rating) : 0,
          release_date: year ? `${year}-01-01` : null,
        }

        await addToFavorites(mediaToAdd)
        console.log('Successfully added to liked movies!')
      } else {
        console.log('addToFavorites function not found in AuthContext')
      }
    } catch (error) {
      console.error('Error adding to liked movies:', error)
    }
  }

  // If there's no poster, don't render the card
  if (!poster) return null

  return (
    <div className="relative bg-[#1e1e1e] rounded overflow-hidden h-full">
      <Link
        to={`/${type}/${id}`}
        className="block hover:translate-y-[-4px] transition-transform duration-200 cursor-pointer"
      >
        <div className="aspect-[2/3] relative">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#333] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#5ccfee] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={poster}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {rating && (
            <div className="absolute top-0 right-0 bg-black/50 px-1.5 py-0.5 m-1.5 rounded text-xs">
              <span className="text-[#5ccfee]">{rating}</span>
            </div>
          )}

          {/* Genre badge */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center justify-between">
              {genre && (
                <span className="text-xs text-[#5ccfee] font-medium">
                  {genre}
                </span>
              )}
              {year && <span className="text-xs text-gray-300">{year}</span>}
            </div>
          </div>
        </div>
        <div className="p-2">
          <h3 className="text-sm text-gray-200 font-medium truncate">
            {title}
          </h3>
        </div>
      </Link>

      {/* Action buttons container - only show if user is signed in */}
      {currentUser && (
        <div className="absolute top-1 left-1 flex gap-2">
          {/* Add to watchlist button */}
          <button
            onClick={handleAddToWatchlist}
            className="p-1.5 bg-black/70 hover:bg-[#333] rounded-full text-white transition-colors"
            title="Add to watchlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          {/* Add to liked movies button */}
          <button
            onClick={handleAddToFavorites}
            className="p-1.5 bg-black/70 hover:bg-[#333] rounded-full text-white transition-colors"
            title="Add to liked movies"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
})

export default MovieCard
