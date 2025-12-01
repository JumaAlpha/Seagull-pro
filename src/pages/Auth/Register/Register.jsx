import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from '../../../components/auth/AuthForm/AuthForm'
import DashboardCard from '../../../components/auth/DashboardCard/DashboardCard'
import styles from './Register.module.css'

const Register = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (formData) => {
    setLoading(true)
    
    // Simulate API call
    try {
      console.log('Registration attempt:', formData)
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate successful registration
      localStorage.setItem('token', 'simulated-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      }))
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      // Handle error (show toast/notification)
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