import React from 'react'
import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import '../assets/styles/Login.css'
import '../assets/styles/Main.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:3000/api/users/login', {
        email,
        password
      });
      
      if (response.status === 200) {
        // Login successful
        const userId = response.data.user._id;
        console.log(userId)
        // Store user ID in session storage
        sessionStorage.setItem('userId', userId);
        // Navigate to dashboard or home page
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (show message to user)
      if (error.response) {
        if (error.response.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Credentials',
            text: 'The email or password you entered is incorrect.',
            showConfirmButton: false,
            timer: 3000
          });
        } else if (error.response.status === 500) {
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'There was a problem with the server. Please try again later.',
            showConfirmButton: false,
            timer: 3000
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Could not connect to the server. Please check your internet connection.',
          showConfirmButton: false,
          timer: 3000
        });
      }
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
          <button type="submit" className="login-button">
            Login
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
