import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Register = () => {
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '3rem 1rem'
    },
    formContainer: {
      maxWidth: '28rem',
      width: '100%',
      backgroundColor: 'white',
      padding: '2.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    title: {
      textAlign: 'center',
      fontSize: '1.875rem',
      fontWeight: '800',
      color: '#111827'
    },
    form: {
      marginTop: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151'
    },
    input: {
      marginTop: '0.25rem',
      display: 'block',
      width: '100%',
      padding: '0.5rem 0.75rem',
      backgroundColor: 'white',
      border: '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      outline: 'none',
      color: '#000000'
    },
    fileInput: {
      marginTop: '0.25rem',
      display: 'block',
      width: '100%',
      padding: '0.5rem 0.75rem',
      backgroundColor: 'white',
      border: '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      fontSize: '0.875rem'
    },
    select: {
      marginTop: '0.25rem',
      display: 'block',
      width: '100%',
      padding: '0.5rem 0.75rem',
      backgroundColor: 'white',
      border: '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      fontSize: '0.875rem'
    },
    button: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      backgroundColor: '#4F46E5',
      cursor: 'pointer',
      transition: 'background-color 200ms',
      ':hover': {
        backgroundColor: '#4338CA'
      }
    }
  }

  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    image: null,
    role: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('email', formData.email)
      data.append('phone', formData.phone)
      data.append('password', formData.password)
      data.append('role', formData.role)
      if (formData.image) {
        data.append('image', formData.image)
      }

      const response = await axios.post('http://localhost:3000/api/users/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data) {
        navigate('/')
      }
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Register Your Account</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" style={styles.label}>
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label htmlFor="phone" style={styles.label}>
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label htmlFor="image" style={styles.label}>
              Profile Image
            </label>
            <input
              type="file"
              name="image"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              style={styles.fileInput}
            />
          </div>

          <div>
            <label htmlFor="role" style={styles.label}>
              Role
            </label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            style={styles.button}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
