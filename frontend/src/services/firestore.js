import { db } from '../services/firebase'
import {
  addDoc,
  setDoc,
  doc,
  collection,
  deleteDoc,
  getDocs,
  query,
} from 'firebase/firestore'

export const useFireStore = () => {
  const addDocument = async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), data)
    console.log('Document added successfully!', docRef.id)
  }

  const addToWatchlist = async (userId, dataId, data) => {
    try {
      await setDoc(doc(db, 'users', userId, 'watchlist'), data.toString())
    } catch (error) {
      console.log(error, 'Error adding document')
    }
  }

  const removeFromWatchlist = async (userId, mediaId) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'watchlist', mediaId.toString()))
      console.log('Removed from watchlist in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  }

  const getWatchlist = async (userId) => {
    try {
      const watchlistRef = collection(db, 'users', userId, 'watchlist')
      const q = query(watchlistRef)
      const querySnapshot = await getDocs(q)

      const watchlist = []
      querySnapshot.forEach((doc) => {
        watchlist.push(doc.data())
      })

      console.log(
        'Fetched watchlist from Firestore:',
        watchlist.length,
        'items'
      )
      return watchlist
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      return []
    }
  }

  return {
    addDocument,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
  }
}
