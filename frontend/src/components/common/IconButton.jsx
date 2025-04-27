import { memo } from 'react'

/**
 * Reusable IconButton component with consistent styling
 */
const IconButton = memo(
  ({
    children,
    onClick,
    className = '',
    variant = 'primary', // primary, secondary, outline, text
    size = 'md', // sm, md, lg
    disabled = false,
    type = 'button',
    ariaLabel,
    ...props
  }) => {
    // Base styles
    const baseStyles =
      'flex items-center justify-center rounded-full transition-colors focus:outline-none'

    // Size styles
    const sizeStyles = {
      sm: 'p-1.5 text-sm',
      md: 'p-2',
      lg: 'p-3 text-lg',
    }

    // Variant styles
    const variantStyles = {
      primary: 'bg-[#00BFFF] text-white hover:bg-[#5ccfee]',
      secondary: 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]',
      outline:
        'bg-transparent border border-[#5ccfee] text-[#5ccfee] hover:bg-[#5ccfee10]',
      text: 'bg-transparent text-[#5ccfee] hover:bg-[#5ccfee10]',
    }

    // Disabled styles
    const disabledStyles = disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'cursor-pointer'

    return (
      <button
        type={type}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export default IconButton
