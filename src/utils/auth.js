// Authentication utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  return !!token
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const getAuthToken = () => {
  return localStorage.getItem('token')
}