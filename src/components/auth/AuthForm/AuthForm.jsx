import React, { useState } from 'react'
import Input from '../../ui/Input/Input'
import Button from '../../ui/Button/Button'
import styles from './AuthForm.module.css'

const AuthForm = ({ mode = 'login', onSubmit, loading = false, switchMode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    occupation: '',
    tradingExperience: '',
    agreeTerms: false,
    marketingEmails: false,
    riskDisclosure: false
  })

  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const [slideDirection, setSlideDirection] = useState('right')

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.firstName?.trim()) {
        newErrors.firstName = 'First name is required'
      } else if (formData.firstName.length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters'
      }

      if (!formData.lastName?.trim()) {
        newErrors.lastName = 'Last name is required'
      } else if (formData.lastName.length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters'
      }

      if (!formData.email) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid'
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required'
      } else {
        const birthDate = new Date(formData.dateOfBirth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        if (age < 18) {
          newErrors.dateOfBirth = 'You must be at least 18 years old'
        }
      }
    }

    if (step === 2) {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required'
      } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number is invalid'
      }

      if (!formData.country) {
        newErrors.country = 'Country is required'
      }

      if (!formData.address?.trim()) {
        newErrors.address = 'Address is required'
      }
    }

    if (step === 3) {
      if (!formData.city?.trim()) {
        newErrors.city = 'City is required'
      }

      if (!formData.postalCode?.trim()) {
        newErrors.postalCode = 'Postal code is required'
      }

      if (!formData.occupation) {
        newErrors.occupation = 'Occupation is required'
      }

      if (!formData.tradingExperience) {
        newErrors.tradingExperience = 'Trading experience is required'
      }
    }

    if (step === 4) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else {
        if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters'
        }
        if (!/(?=.*[a-z])/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one lowercase letter'
        }
        if (!/(?=.*[A-Z])/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one uppercase letter'
        }
        if (!/(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one number'
        }
        if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one special character'
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'You must agree to the terms and conditions'
      }

      if (!formData.riskDisclosure) {
        newErrors.riskDisclosure = 'You must acknowledge the risk disclosure'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setSlideDirection('left')
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setSlideDirection('right')
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      // For login, just validate and submit
      const loginErrors = {}
      if (!formData.email) {
        loginErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        loginErrors.email = 'Email is invalid'
      }
      if (!formData.password) {
        loginErrors.password = 'Password is required'
      }
      
      setErrors(loginErrors)
      if (Object.keys(loginErrors).length === 0) {
        onSubmit(formData)
      }
    } else {
      // For registration, handle steps
      if (validateStep(currentStep)) {
        if (currentStep < 4) {
          nextStep()
        } else {
          onSubmit(formData)
        }
      }
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Enter your basic personal information'
      case 2:
        return 'Add your contact details'
      case 3:
        return 'Complete your location and background'
      case 4:
        return 'Set up security and accept terms'
      default:
        return 'Join 50M+ traders worldwide and start your journey'
    }
  }

  const renderStepContent = () => {
    if (mode === 'login') {
      return (
        <div className={styles.loginForm}>
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Enter your password"
            error={errors.password}
            required
          />
        </div>
      )
    }

    return (
      <div className={styles.sliderContainer}>
        <div 
          className={`${styles.slider} ${styles[slideDirection]}`}
          style={{ transform: `translateX(-${(currentStep - 1) * 25}%)` }}
        >
          {/* Step 1: Personal Information */}
          <div className={styles.slide}>
            <div className={styles.nameRow}>
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                error={errors.firstName}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                error={errors.lastName}
                required
              />
            </div>
            
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email"
              error={errors.email}
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              placeholder="Select your date of birth"
              error={errors.dateOfBirth}
              required
            />
          </div>

          {/* Step 2: Contact Details */}
          <div className={styles.slide}>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              error={errors.phone}
              required
            />

            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Select your country"
              error={errors.country}
              required
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your street address"
              error={errors.address}
              required
            />
          </div>

          {/* Step 3: Location & Background */}
          <div className={styles.slide}>
            <div className={styles.nameRow}>
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Enter your city"
                error={errors.city}
                required
              />
              <Input
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="Postal code"
                error={errors.postalCode}
                required
              />
            </div>

            <Input
              label="Occupation"
              value={formData.occupation}
              onChange={(e) => handleChange('occupation', e.target.value)}
              placeholder="Select your occupation"
              error={errors.occupation}
              required
            />

            <Input
              label="Trading Experience"
              value={formData.tradingExperience}
              onChange={(e) => handleChange('tradingExperience', e.target.value)}
              placeholder="Select your experience level"
              error={errors.tradingExperience}
              required
            />
          </div>

          {/* Step 4: Security & Terms */}
          <div className={styles.slide}>
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Create a strong password"
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              required
            />

            <div className={styles.passwordRequirements}>
              <p className={styles.requirementsTitle}>Password must contain:</p>
              <div className={styles.requirementsGrid}>
                <span className={formData.password.length >= 8 ? styles.requirementMet : styles.requirement}>
                  • 8+ characters
                </span>
                <span className={/(?=.*[a-z])/.test(formData.password) ? styles.requirementMet : styles.requirement}>
                  • Lowercase letter
                </span>
                <span className={/(?=.*[A-Z])/.test(formData.password) ? styles.requirementMet : styles.requirement}>
                  • Uppercase letter
                </span>
                <span className={/(?=.*\d)/.test(formData.password) ? styles.requirementMet : styles.requirement}>
                  • Number
                </span>
                <span className={/(?=.*[@$!%*?&])/.test(formData.password) ? styles.requirementMet : styles.requirement}>
                  • Special character
                </span>
              </div>
            </div>

            <div className={styles.termsSection}>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    I agree to the <a href="#" className={styles.link}>Terms & Conditions</a> and <a href="#" className={styles.link}>Privacy Policy</a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <span className={styles.errorText}>{errors.agreeTerms}</span>
                )}
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.riskDisclosure}
                    onChange={(e) => handleChange('riskDisclosure', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    I acknowledge that trading involves substantial risk of loss
                  </span>
                </label>
                {errors.riskDisclosure && (
                  <span className={styles.errorText}>{errors.riskDisclosure}</span>
                )}
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.marketingEmails}
                    onChange={(e) => handleChange('marketingEmails', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    I want to receive marketing emails and trading updates
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderButtons = () => {
    if (mode === 'login') {
      return (
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          className={styles.submitButton}
        >
          Sign In
        </Button>
      )
    }

    return (
      <div className={styles.buttonGroup}>
        {currentStep > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={prevStep}
            className={styles.backButton}
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading && currentStep === 4}
          className={styles.nextButton}
          disabled={loading}
        >
          {currentStep === 4 ? 'Create Account' : 'Continue'}
        </Button>
      </div>
    )
  }

  const renderProgress = () => {
    if (mode === 'login') return null

    return (
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
        <div className={styles.stepCounter}>
          Step {currentStep} of 4
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <div className={styles.formHeader}>
        <h1 className={styles.title}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'login' 
            ? 'Sign in to your Seagull-Pro account to start trading'
            : getStepSubtitle()
          }
        </p>
      </div>

      {renderProgress()}

      <div className={styles.formContent}>
        {renderStepContent()}

        {mode === 'login' && (
          <div className={styles.rememberForgot}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Remember me</span>
            </label>
            <a href="#" className={styles.forgotLink}>Forgot password?</a>
          </div>
        )}

        {renderButtons()}
      </div>

      <div className={styles.formFooter}>
        <p className={styles.footerText}>
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button 
            type="button" 
            onClick={() => {
              setCurrentStep(1)
              setSlideDirection('right')
              switchMode()
            }}
            className={styles.footerLink}
          >
            {mode === 'login' ? ' Sign Up' : ' Sign In'}
          </button>
        </p>
      </div>
    </form>
  )
}

export default AuthForm