import React from 'react'
import styles from './Button.module.css'

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${
        disabled ? styles.disabled : ''
      } ${loading ? styles.loading : ''} ${className}`}
      {...props}
    >
      {loading && <div className={styles.spinner}></div>}
      {children}
    </button>
  )
}

export default Button