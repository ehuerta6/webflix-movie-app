import { db } from '../services/firebase'
import { addDoc, collection } from 'firebase/firestore'

export const useFireStore = () => {
  const addDocument = async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), data)
    console.log('Document added successfully!', docRef.id)
  }

  const addToWatchlist = async (userId, mediaId, mediaData) => {
    try {
      // First, create a reference to the user's watchlist collection
      const watchlistCollection = collection(db, 'users', userId, 'watchlist')

      // Then create a document in that collection
      await addDoc(watchlistCollection, {
        mediaId: mediaId.toString(),
        data: mediaData,
        addedAt: new Date().toISOString(),
      })

      console.log('Added to watchlist in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  }

  return {
    addDocument,
    addToWatchlist,
  }
}
