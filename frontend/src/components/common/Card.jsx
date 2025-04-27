import { memo } from 'react'

/**
 * Reusable Card component with consistent styling
 */
const Card = memo(
  ({ children, className = '', onClick, hover = false, ...props }) => {
    const baseStyles = 'bg-[#1a1a1a] rounded-md overflow-hidden shadow-md'
    const hoverStyles = hover
      ? 'hover:shadow-lg transition-shadow hover:scale-[1.02] transition-transform duration-200'
      : ''
    const clickStyles = onClick ? 'cursor-pointer' : ''

    return (
      <div
        className={`${baseStyles} ${hoverStyles} ${clickStyles} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)

/**
 * Card.Body component for consistent padding
 */
Card.Body = memo(({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
))

/**
 * Card.Header component for card headers
 */
Card.Header = memo(({ children, className = '', ...props }) => (
  <div className={`p-4 border-b border-[#2a2a2a] ${className}`} {...props}>
    {children}
  </div>
))

/**
 * Card.Footer component for card footers
 */
Card.Footer = memo(({ children, className = '', ...props }) => (
  <div className={`p-4 border-t border-[#2a2a2a] ${className}`} {...props}>
    {children}
  </div>
))

/**
 * Card.Image component for card images
 */
Card.Image = memo(({ src, alt = '', className = '', ...props }) => (
  <div className="relative aspect-[2/3] overflow-hidden">
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      {...props}
    />
  </div>
))

export default Card
