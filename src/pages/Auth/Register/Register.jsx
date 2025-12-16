import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from '../../../components/auth/AuthForm/AuthForm'
import DashboardCard from '../../../components/auth/DashboardCard/DashboardCard'
import styles from './Register.module.css'

const Register = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (formData) => {
    setLoading(true)
    setError('')
    
    // Simulate API call
    try {
      console.log('Registration attempt:', formData)
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if user already exists
      const existingUser = localStorage.getItem('registrationDetails')
      
      if (existingUser) {
        const userData = JSON.parse(existingUser)
        if (userData.email === formData.email) {
          throw new Error('An account with this email already exists. Please login.')
        }
      }
      
      // Store registration details in localStorage
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        registeredAt: new Date().toISOString()
      }
      
      localStorage.setItem('registrationDetails', JSON.stringify(registrationData))
      
      // Also store user details for immediate login
      localStorage.setItem('token', 'simulated-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      }))
      
      console.log('Registration successful, details stored in localStorage')
      
      // Navigate to /trading after registration
      navigate('/trading')
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const switchToLogin = () => {
    navigate('/login')
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.container}>
        <div className={styles.previewSection}>
          <DashboardCard />
        </div>
        
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <AuthForm 
              mode="register" 
              onSubmit={handleRegister}
              loading={loading}
              switchMode={switchToLogin}
              error={error}
            />
          </div>
        </div>
      </div>
      
      {/* Background Orbs */}
      <div className={styles.backgroundOrb1}></div>
      <div className={styles.backgroundOrb2}></div>
      <div className={styles.backgroundOrb3}></div>
    </div>
  )
}

export default Register