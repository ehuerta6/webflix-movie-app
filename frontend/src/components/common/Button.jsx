import { memo } from 'react'

/**
 * Reusable Button component with consistent styling
 */
const Button = memo(
  ({
    children,
    onClick,
    className = '',
    variant = 'primary', // primary, secondary, outline, text
    size = 'md', // sm, md, lg
    disabled = false,
    type = 'button',
    fullWidth = false,
    ...props
  }) => {
    // Base styles
    const baseStyles =
      'font-medium rounded transition-colors focus:outline-none'

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
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

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        type={type}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${widthStyles} ${className}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export default Button
