import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from '../../../components/auth/AuthForm/AuthForm'
import DashboardCard from '../../../components/auth/DashboardCard/DashboardCard'
import styles from './Login.module.css'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (formData) => {
    setLoading(true)
    setError('')
    
    // Simulate API call
    try {
      console.log('Login attempt:', formData)
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if user has registered
      const registrationDetails = localStorage.getItem('registrationDetails')
      
      if (!registrationDetails) {
        throw new Error('No account found. Please register first.')
      }
      
      const userData = JSON.parse(registrationDetails)
      
      // Check if credentials match
      if (userData.email !== formData.email || userData.password !== formData.password) {
        throw new Error('Invalid email or password')
      }
      
      // Store user details in localStorage for session
      localStorage.setItem('token', 'simulated-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      }))
      
      // Update last login time
      localStorage.setItem('loginCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password,
        lastLogin: new Date().toISOString()
      }))
      
      console.log('Login successful, user details retrieved from registration')
      
      // Navigate to /trading as requested
      navigate('/trading')
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const switchToRegister = () => {
    navigate('/register')
  }

  return (
    <div className={styles.loginPage}>
      {/* Glass morphic shapes */}
      <div className={styles.glassShape}></div>
      <div className={styles.glassShape}></div>
      
      {/* Floating elements */}
      <div className={styles.floatingElement}></div>
      <div className={styles.floatingElement}></div>
      <div className={styles.floatingElement}></div>
      
      <div className={styles.container}>
        <div className={styles.previewSection}>
          <DashboardCard />
        </div>
        
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <AuthForm 
              mode="login" 
              onSubmit={handleLogin}
              loading={loading}
              switchMode={switchToRegister}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login