import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const useIdleChannelAnimations = (
  enabled,
  animationTypes = ['pulse', 'bounce', 'glow'],
  interval = 8,
  channels = []
) => {
  const [activeAnimations, setActiveAnimations] = useState(new Set());
  const intervalRef = useRef(null);
  const timeoutRefs = useRef(new Set());
  const channelsRef = useRef(channels);
  const prevChannelsLengthRef = useRef(channels.length);

  // Memoize channels to prevent unnecessary re-renders
  const memoizedChannels = useMemo(() => channels, [channels.length]);

  // Update channels ref only when the length or content actually changes
  useEffect(() => {
    const currentLength = memoizedChannels.length;
    const prevLength = prevChannelsLengthRef.current;
    
    // Only update if the number of channels changed
    if (currentLength !== prevLength) {
      channelsRef.current = memoizedChannels;
      prevChannelsLengthRef.current = currentLength;
    }
  }, [memoizedChannels]);

  // Get channels that have content (not empty) - memoized
  const getChannelsWithContent = useCallback(() => {
    return channelsRef.current.filter(channel => 
      channel && !channel.isEmpty && (channel.config?.media || channel.config?.path)
    );
  }, []);

  // Get animation duration based on type - memoized
  const getAnimationDuration = useCallback((animationType) => {
    const durations = {
      pulse: 2000,
      bounce: 1500,
      wiggle: 1000,
      glow: 3000,
      parallax: 2000,
      flip: 1200,
      swing: 1800,
      shake: 800,
      pop: 600,
      slide: 1500,
      colorcycle: 4000,
      sparkle: 2500,
      heartbeat: 2000,
      orbit: 3000,
      wave: 2500,
      jelly: 1200,
      zoom: 1000,
      rotate: 2000,
      glowtrail: 3500
    };
    return durations[animationType] || 2000;
  }, []);

  // Start animation for a specific channel - memoized
  const startAnimation = useCallback((channelId, animationType) => {
    setActiveAnimations(prev => new Set([...prev, `${channelId}-${animationType}`]));
    
    // Animation duration (most CSS animations are 1-3 seconds)
    const duration = getAnimationDuration(animationType);
    
    // Clear animation after duration
    const timeoutId = setTimeout(() => {
      setActiveAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${channelId}-${animationType}`);
        return newSet;
      });
    }, duration);
    
    // Store timeout reference for cleanup
    timeoutRefs.current.add(timeoutId);
  }, [getAnimationDuration]);

  // Trigger random animation - memoized
  const triggerRandomAnimation = useCallback(() => {
    const channelsWithContent = getChannelsWithContent();
    
    if (channelsWithContent.length === 0) {
      return;
    }

    // Pick a random channel with content
    const randomChannel = channelsWithContent[Math.floor(Math.random() * channelsWithContent.length)];
    const channelId = randomChannel.id;
    
    // Pick a random animation type
    const randomAnimationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    
    // Don't start if this channel is already animating
    const animationKey = `${channelId}-${randomAnimationType}`;
    if (activeAnimations.has(animationKey)) {
      return;
    }

    startAnimation(channelId, randomAnimationType);
  }, [getChannelsWithContent, animationTypes, activeAnimations, startAnimation]);

  // Set up interval for random animations - with proper dependencies
  useEffect(() => {
    if (!enabled || animationTypes.length === 0) {
      // Clear existing interval and animations
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clear all active animations
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
      setActiveAnimations(new Set());
      
      return;
    }

    // Start interval for triggering animations
    intervalRef.current = setInterval(() => {
      triggerRandomAnimation();
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, animationTypes.length, triggerRandomAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  // Helper function to check if a channel should be animating - memoized
  const getChannelAnimationClass = useCallback((channelId) => {
    const animations = [];
    
    for (const animationKey of activeAnimations) {
      if (animationKey.startsWith(`${channelId}-`)) {
        const animationType = animationKey.replace(`${channelId}-`, '');
        animations.push(`channel-anim-${animationType}`);
      }
    }
    
    return animations.join(' ');
  }, [activeAnimations]);

  // Check if a specific channel is currently animating - memoized
  const isChannelAnimating = useCallback((channelId) => {
    for (const animationKey of activeAnimations) {
      if (animationKey.startsWith(`${channelId}-`)) {
        return true;
      }
    }
    return false;
  }, [activeAnimations]);

  return {
    getChannelAnimationClass,
    isChannelAnimating,
    activeAnimations: activeAnimations.size,
    triggerRandomAnimation: enabled ? triggerRandomAnimation : null
  };
};

export default useIdleChannelAnimations; 