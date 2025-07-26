import { useEffect, useRef, useState } from 'react';

const useIdleChannelAnimations = (
  enabled,
  animationTypes = ['pulse', 'bounce', 'glow'],
  interval = 8,
  channels = []
) => {
  const [activeAnimations, setActiveAnimations] = useState(new Set());
  const intervalRef = useRef(null);
  const timeoutRefs = useRef(new Map());

  // Get channels that have content (not empty)
  const getChannelsWithContent = () => {
    return channels.filter(channel => 
      channel && !channel.empty && (
        channel.title || 
        channel.path || 
        channel.media || 
        channel.imageGallery?.length > 0 ||
        channel.type === 'steam' ||
        channel.type === 'url' ||
        (channel.type === 'exe' && channel.path)
      )
    );
  };

  // Start animation for a specific channel
  const startAnimation = (channelId, animationType) => {
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
    timeoutRefs.current.set(`${channelId}-${animationType}`, timeoutId);
  };

  // Get animation duration based on type
  const getAnimationDuration = (animationType) => {
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
  };

  // Trigger random animation
  const triggerRandomAnimation = () => {
    const channelsWithContent = getChannelsWithContent();
    
    if (channelsWithContent.length === 0 || animationTypes.length === 0) {
      if (channelsWithContent.length === 0) {
        console.log(`[IdleAnimation] No channels with content found. Total channels: ${channels.length}, Channels checked:`, channels.slice(0, 3).map(c => ({id: c.id, empty: c.empty, title: c.title, path: c.path, media: c.media})));
      }
      return;
    }

    // console.log(`[IdleAnimation] Found ${channelsWithContent.length} channels with content out of ${channels.length} total`);
    // console.log(`[IdleAnimation] Channels with content:`, channelsWithContent.map(c => ({id: c.id, title: c.title, media: !!c.media, path: !!c.path})));

    // Pick a random channel with content
    const randomChannel = channelsWithContent[Math.floor(Math.random() * channelsWithContent.length)];
    const channelId = randomChannel.id || `channel-${channels.indexOf(randomChannel)}`;
    
    // Pick a random animation type
    const randomAnimationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    
    // Don't start if this channel is already animating
    const animationKey = `${channelId}-${randomAnimationType}`;
    if (activeAnimations.has(animationKey)) {
      console.log(`[IdleAnimation] Channel ${channelId} already animating with ${randomAnimationType}`);
      return;
    }

    // console.log(`[IdleAnimation] Starting ${randomAnimationType} animation for channel:`, channelId, randomChannel);
    startAnimation(channelId, randomAnimationType);
  };

  // Set up interval for random animations
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
  }, [enabled, animationTypes, interval, channels]);

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

  // Helper function to check if a channel should be animating
  const getChannelAnimationClass = (channelId) => {
    const animations = [];
    
    for (const animationKey of activeAnimations) {
      if (animationKey.startsWith(`${channelId}-`)) {
        const animationType = animationKey.replace(`${channelId}-`, '');
        animations.push(`channel-anim-${animationType}`);
      }
    }
    
    const result = animations.join(' ');
    // if (result) {
    //   console.log(`[IdleAnimation] Channel ${channelId} applying classes: ${result}`);
    // }
    
    return result;
  };

  // Check if a specific channel is currently animating
  const isChannelAnimating = (channelId) => {
    for (const animationKey of activeAnimations) {
      if (animationKey.startsWith(`${channelId}-`)) {
        return true;
      }
    }
    return false;
  };

  return {
    getChannelAnimationClass,
    isChannelAnimating,
    activeAnimations: activeAnimations.size,
    triggerRandomAnimation: enabled ? triggerRandomAnimation : null
  };
};

export default useIdleChannelAnimations; 