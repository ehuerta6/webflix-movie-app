import { memo } from 'react'

/**
 * Reusable loading spinner component with consistent styling
 */
const Spinner = memo(
  ({
    size = 'md',
    color = 'primary',
    fullScreen = false,
    className = '',
    ...props
  }) => {
    // Size styles
    const sizeStyles = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-3',
      lg: 'h-12 w-12 border-4',
    }

    // Color styles
    const colorStyles = {
      primary: 'border-[#5ccfee]',
      secondary: 'border-white',
      dark: 'border-[#333]',
    }

    // The spinner
    const spinner = (
      <div
        className={`
        animate-spin rounded-full border-t-transparent
        ${sizeStyles[size] || sizeStyles.md}
        ${colorStyles[color] || colorStyles.primary}
        ${className}
      `}
        {...props}
      />
    )

    // If fullScreen, wrap in a fullscreen container
    if (fullScreen) {
      return (
        <div className="fixed inset-0 bg-[#121212] bg-opacity-80 flex items-center justify-center z-50">
          {spinner}
        </div>
      )
    }

    return spinner
  }
)

export default Spinner
