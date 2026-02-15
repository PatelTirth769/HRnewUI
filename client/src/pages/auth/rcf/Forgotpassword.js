import React, { useState } from 'react';
import logoRcf from '../../../assets/images/rcf-logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email Submitted:', email);
  };

  // Inline styles for each component
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '30px',
      width: '400px',
      textAlign: 'center',
    },
    header: {
      marginBottom: '16px',
      color: '#333',
    },
    text: {
      fontSize: '14px',
      color: '#777',
      marginBottom: '24px',
    },
    inputGroup: {
      marginBottom: '20px',
      textAlign: 'left',
    },
    label: {
      fontWeight: 'bold',
      display: 'block',
      marginBottom: '8px',
      color: '#333',
    },
    required: {
      color: '#e63946',
    },
    emailInputWrapper: {
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
    },
    button: {
      width: '100%',
      backgroundColor: '#28a745',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      padding: '12px',
      fontSize: '16px',
      cursor: 'pointer',
    },
    buttonHover: {
      backgroundColor: '#218838',
    },
  };

  return (
    <div>
      <img src={logoRcf} alt="logo" style={{ width: '220px' }} />

      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.header}>Forgot Password</h2>
          <p style={styles.text}>
            Please enter your email address below to receive a One-Time Password (OTP) for resetting
            your password.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <div style={styles.emailInputWrapper}>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@vehiclepoint.com"
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <button type="submit" style={styles.button}>
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
