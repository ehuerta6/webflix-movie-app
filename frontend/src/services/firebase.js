// src/firebase/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Initialize and export Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Optional: Use emulators for local development
if (import.meta.env.MODE === 'development') {
  try {
    // Uncomment these lines if you have local emulators running
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to local emulators')
  } catch (error) {
    console.error('Failed to connect to emulators:', error)
  }
}

console.log('Firebase initialized with authDomain:', firebaseConfig.authDomain)

// Check if we're running on GitHub Pages
const isOnGitHubPages = window.location.hostname.includes('github.io')
if (isOnGitHubPages) {
  console.log(
    'Running on GitHub Pages. Make sure to add this domain to your Firebase authorized domains.'
  )
}

export default app
