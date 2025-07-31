import React, { useState } from 'react';
import BaseModal from './BaseModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Text from '../ui/Text';
import { authService } from '../utils/authService';
import useAuthModalStore from '../utils/useAuthModalStore';

const AuthModal = () => {
  const { isOpen, mode, closeModal, toggleMode } = useAuthModalStore();
  
  // console.log('[AUTH MODAL] Component rendered with isOpen:', isOpen, 'mode:', mode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('[AUTH MODAL] Form submitted');
    // console.log('[AUTH MODAL] Mode:', mode);
    // console.log('[AUTH MODAL] Email:', email);
    // console.log('[AUTH MODAL] Password length:', password.length);
    
    setLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'signup') {
    
        result = await authService.signUp(email, password);
      } else {

        result = await authService.signIn(email, password);
      }

      

      if (result.error) {
        console.error('[AUTH MODAL] Auth error:', result.error);
        setError(result.error);
      } else if (result.data?.user) {

        closeModal();
      } else {
        console.error('[AUTH MODAL] Auth failed - no user data');
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('[AUTH MODAL] Exception:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    setEmail('');
    setPassword('');
    setError('');
    toggleMode();
  };

  if (!isOpen) return null;

  return (
    <BaseModal onClose={closeModal} title={mode === 'signup' ? 'Create Account' : 'Sign In'}>
      <Card>
        <Text style={{ marginBottom: '16px' }}>
          {mode === 'signup' 
            ? 'Create an account to upload presets to the community and manage your uploads!'
            : 'Sign in to access your account and manage your uploaded presets.'
          }
        </Text>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <Text variant="label" style={{ marginBottom: '4px' }}>Email</Text>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid hsl(var(--border-primary))',
                borderRadius: '6px',
                background: 'hsl(var(--surface-primary))',
                color: 'hsl(var(--text-primary))',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Text variant="label" style={{ marginBottom: '4px' }}>Password</Text>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid hsl(var(--border-primary))',
                borderRadius: '6px',
                background: 'hsl(var(--surface-primary))',
                color: 'hsl(var(--text-primary))',
                fontSize: '14px'
              }}
            />
          </div>
          
          {error && (
            <div style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              marginBottom: '12px',
              background: 'hsl(var(--error-light))',
              color: 'hsl(var(--error))',
              border: '1px solid hsl(var(--error))',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <Button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleModeToggle}
              disabled={loading}
            >
              {mode === 'signin' ? 'Create Account' : 'Sign In'}
            </Button>
          </div>

          <Text size="sm" color="hsl(var(--text-secondary))" style={{ textAlign: 'center' }}>
            {mode === 'signup' 
              ? 'Already have an account? Click "Sign In" above.'
              : "Don't have an account? Click 'Create Account' above."
            }
          </Text>
        </form>
      </Card>
    </BaseModal>
  );
};

export default AuthModal; 