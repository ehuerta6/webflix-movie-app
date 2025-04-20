import { db } from '../services/firebase'
import { addDoc, setDoc, doc, collection } from 'firebase/firestore'

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

  return {
    addDocument,
    addToWatchlist,
  }
}
