import React, { useState } from 'react';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import Text from '../ui/Text';
import { authService } from '../utils/authService';
import { useUIState } from '../utils/useConsolidatedAppHooks';

const inputClass =
  'w-full rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-sm text-[hsl(var(--text-primary))]';

const AuthModal = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, toggleAuthModalMode } = useUIState();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      let result;
      if (authModalMode === 'signup') {
        result = await authService.signUp(email, password);
      } else {
        result = await authService.signIn(email, password);
      }

      if (result.error) {
        console.error('[AUTH MODAL] Auth error:', result.error);
        setError(result.error);
      } else if (result.data?.user) {
        closeAuthModal();
      } else {
        console.error('[AUTH MODAL] Auth failed - no user data');
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('[AUTH MODAL] Exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    setEmail('');
    setPassword('');
    setError('');
    toggleAuthModalMode();
  };

  if (!isAuthModalOpen) return null;

  return (
    <WBaseModal onClose={closeAuthModal} title={authModalMode === 'signup' ? 'Create Account' : 'Sign In'}>
      <Card>
        <Text className="mb-4 block">
          {authModalMode === 'signup' 
            ? 'Create an account to upload presets to the community and manage your uploads!'
            : 'Sign in to access your account and manage your uploaded presets.'
          }
        </Text>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-3">
            <Text variant="label" className="mb-1 block">Email</Text>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          
          <div className="mb-4">
            <Text variant="label" className="mb-1 block">Password</Text>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          
          {error && (
            <div
              className="mb-3 rounded-md border border-[hsl(var(--state-error))] bg-[hsl(var(--state-error)/0.12)] px-3 py-2 text-sm text-[hsl(var(--state-error))]"
              role="alert"
            >
              {error}
            </div>
          )}
          
          <div className="mb-3 flex gap-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-0 flex-1"
            >
              {loading ? 'Loading...' : authModalMode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
            
            <Button 
              variant="secondary" 
              type="button"
              onClick={handleModeToggle}
              disabled={loading}
            >
              {authModalMode === 'signin' ? 'Create Account' : 'Sign In'}
            </Button>
          </div>

          <Text size="sm" className="block text-center text-[hsl(var(--text-secondary))]">
            {authModalMode === 'signup' 
              ? 'Already have an account? Click "Sign In" above.'
              : "Don't have an account? Click 'Create Account' above."
            }
          </Text>
        </form>
      </Card>
    </WBaseModal>
  );
};

export default AuthModal;
