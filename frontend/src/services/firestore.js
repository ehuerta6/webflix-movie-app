import { db } from '../services/firebase'
import { addDoc, setDoc, doc, collection, deleteDoc } from 'firebase/firestore'

export const useFireStore = () => {
  const addDocument = async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), data)
    console.log('Document added successfully!', docRef.id)
  }

  const addToWatchlist = async (userId, mediaId, mediaData) => {
    try {
      // Create a document reference with the mediaId as the document ID
      const docRef = doc(db, 'users', userId, 'watchlist', mediaId.toString())

      // Set the document data
      await setDoc(docRef, {
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

  const removeFromWatchlist = async (userId, mediaId) => {
    try {
      // Create a document reference with the mediaId
      const docRef = doc(db, 'users', userId, 'watchlist', mediaId.toString())

      // Delete the document
      await deleteDoc(docRef)

      console.log('Removed from watchlist in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  }

  const addToFavorites = async (userId, mediaId, mediaData) => {
    try {
      // Create a document reference with the mediaId as the document ID
      const docRef = doc(db, 'users', userId, 'favorites', mediaId.toString())

      // Set the document data
      await setDoc(docRef, {
        data: mediaData,
        addedAt: new Date().toISOString(),
      })

      console.log('Added to favorites in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  const removeFromFavorites = async (userId, mediaId) => {
    try {
      // Create a document reference with the mediaId
      const docRef = doc(db, 'users', userId, 'favorites', mediaId.toString())

      // Delete the document
      await deleteDoc(docRef)

      console.log('Removed from favorites in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  const addToWatched = async (userId, mediaId, mediaData) => {
    try {
      // Create a document reference with the mediaId as the document ID
      const docRef = doc(db, 'users', userId, 'watched', mediaId.toString())

      // Set the document data
      await setDoc(docRef, {
        data: mediaData,
        watchedAt: new Date().toISOString(),
      })

      console.log('Added to watched movies in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error adding to watched movies:', error)
      throw error
    }
  }

  const removeFromWatched = async (userId, mediaId) => {
    try {
      // Create a document reference with the mediaId
      const docRef = doc(db, 'users', userId, 'watched', mediaId.toString())

      // Delete the document
      await deleteDoc(docRef)

      console.log('Removed from watched movies in Firestore:', mediaId)
      return true
    } catch (error) {
      console.error('Error removing from watched movies:', error)
      throw error
    }
  }

  return {
    addDocument,
    addToWatchlist,
    removeFromWatchlist,
    addToFavorites,
    removeFromFavorites,
    addToWatched,
    removeFromWatched,
  }
}
