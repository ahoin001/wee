import { supabase } from './supabase';

class AuthService {
  constructor() {
    this.user = null;
    this.isAnonymous = true;
    this.listeners = [];
    
    // console.log('[AUTH SERVICE] Initializing...');
    
    // Listen for auth state changes
    if (supabase) {
      console.log('[AUTH SERVICE] Setting up auth state listener...');
      supabase.auth.onAuthStateChange((event, session) => {
        // console.log('[AUTH SERVICE] Auth state changed:', event, session?.user?.email);
        this.user = session?.user || null;
        this.isAnonymous = !this.user;
        this.notifyListeners();
      });
    } else {
      console.log('[AUTH SERVICE] No Supabase client available');
    }
  }

  // Get current user
  async getCurrentUser() {
    if (!supabase) {
      return null;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.user = user;
      this.isAnonymous = !user;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign up
  async signUp(email, password) {
    console.log('[AUTH] Attempting sign up for:', email);
    console.log('[AUTH] Supabase client:', supabase ? 'Available' : 'Not configured');
    
    if (!supabase) {
      console.error('[AUTH] Supabase not configured - check environment variables');
      return { error: 'Supabase not configured. Please check your environment variables.' };
    }

    try {
      console.log('[AUTH] Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log('[AUTH] Sign up result:', { data: data ? 'Success' : 'No data', error });
      
      if (error) {
        console.error('[AUTH] Sign up error:', error);
      } else {
        console.log('[AUTH] Sign up successful');
      }
      
      return { data, error };
    } catch (error) {
      console.error('[AUTH] Sign up exception:', error);
      return { error: error.message };
    }
  }

  // Sign in
  async signIn(email, password) {
    console.log('[AUTH] Attempting sign in for:', email);
    console.log('[AUTH] Supabase client:', supabase ? 'Available' : 'Not configured');
    
    if (!supabase) {
      console.error('[AUTH] Supabase not configured - check environment variables');
      return { error: 'Supabase not configured. Please check your environment variables.' };
    }

    try {
      console.log('[AUTH] Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('[AUTH] Sign in result:', { data: data ? 'Success' : 'No data', error });
      
      if (error) {
        console.error('[AUTH] Sign in error:', error);
      } else {
        console.log('[AUTH] Sign in successful');
      }
      
      return { data, error };
    } catch (error) {
      console.error('[AUTH] Sign in exception:', error);
      return { error: error.message };
    }
  }

  // Sign out
  async signOut() {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Check if user can access community features
  canAccessCommunity() {
    return !this.isAnonymous && supabase !== null;
  }

  // Subscribe to auth changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    // console.log('[AUTH SERVICE] Notifying listeners:', this.listeners.length, 'listeners');
    this.listeners.forEach(callback => callback(this.user, this.isAnonymous));
  }

  // Get user info for display
  getUserInfo() {
    if (!this.user) {
      return { email: null, isAnonymous: true };
    }
    
    return {
      email: this.user.email,
      id: this.user.id,
      isAnonymous: false
    };
  }
}

export const authService = new AuthService(); 