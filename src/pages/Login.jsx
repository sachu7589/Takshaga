import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import '../assets/styles/Login.css'
import '../assets/styles/Main.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, isInitialized } = useAuth()

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isInitialized, navigate]);

  // Show loading while checking authentication
  if (!isInitialized || loading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Login successful
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Welcome back!',
          showConfirmButton: false,
          timer: 1500
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Login failed
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: result.error || 'Invalid credentials',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Could not connect to the server. Please check your internet connection.',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src="/takshaga.png" alt="Takshaga Logo" className="logo" />
        </div>
        <h1>Welcome</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-animation">
                <span className="dot dot1"></span>
                <span className="dot dot2"></span>
                <span className="dot dot3"></span>
                <span className="dot dot4"></span>
                <span>Logging in</span>
              </div>
            ) : 'Login'}
          </button>
        </form>
        <p className="forgot-password">
          <a href="#">Forgot Password?</a>
        </p>
      </div>
    </div>
  )
}

export default Login
