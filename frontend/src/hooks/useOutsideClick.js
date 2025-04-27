import { useEffect } from 'react'

/**
 * A custom hook that detects clicks outside of the referenced element
 * @param {React.RefObject} ref - The reference to the element to detect clicks outside of
 * @param {Function} handler - The callback function to call when a click outside is detected
 */
function useOutsideClick(ref, handler) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler])
}

export default useOutsideClick
