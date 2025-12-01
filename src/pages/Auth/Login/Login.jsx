import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from '../../../components/auth/AuthForm/AuthForm'
import DashboardCard from '../../../components/auth/DashboardCard/DashboardCard'
import styles from './Login.module.css'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (formData) => {
    setLoading(true)
    
    // Simulate API call
    try {
      console.log('Login attempt:', formData)
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate successful login
      localStorage.setItem('token', 'simulated-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        firstName: 'John', // In real app, this would come from backend
        lastName: 'Doe'
      }))
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      // Handle error (show toast/notification)
    } finally {
      setLoading(false)
    }
  }

  const switchToRegister = () => {
    navigate('/register')
  }

  return (
    <div className={styles.loginPage}>
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

export default Login