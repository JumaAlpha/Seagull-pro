import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Auth/Login/Login'
import Register from './pages/Auth/Register/Register'
import Trading from './pages/Trading/Trading'
import Wallet from './pages/Wallet/Wallet'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path='/trading/:symbol?/' element={< Trading />} />
          <Route path='/wallet' element={< Wallet/>}/>
        </Routes>
      </div>
    </Router>
  )
}

export default App