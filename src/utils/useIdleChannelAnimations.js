import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { useAppActivity } from '../hooks/useAppActivity';
import { getChannelIdleDurationMs } from '../design/channelIdleAnimations';

const useIdleChannelAnimations = (
  enabled,
  animationTypes = ['pulse', 'bounce', 'glow'],
  interval = 8,
  channels = []
) => {
  const lowPowerMode = useConsolidatedAppStore((state) => state.ui.lowPowerMode);
  const { isAppActive } = useAppActivity();
  const reducedMotion = useReducedMotion();
  const [activeAnimations, setActiveAnimations] = useState(new Set());
  const intervalRef = useRef(null);
  const timeoutRefs = useRef(new Set());
  const channelsRef = useRef(channels);
  const prevChannelsLengthRef = useRef(channels.length);
  const activeAnimationsRef = useRef(new Set());

  const memoizedChannels = useMemo(() => channels, [channels.length]);

  useEffect(() => {
    const currentLength = memoizedChannels.length;
    const prevLength = prevChannelsLengthRef.current;

    if (currentLength !== prevLength) {
      channelsRef.current = memoizedChannels;
      prevChannelsLengthRef.current = currentLength;
    }
  }, [memoizedChannels]);

  const getChannelsWithContent = useCallback(() => {
    return channelsRef.current.filter(
      (channel) => channel && !channel.isEmpty && (channel.config?.media || channel.config?.path)
    );
  }, []);

  const startAnimation = useCallback((channelId, animationType) => {
    const animationKey = `${channelId}-${animationType}`;
    setActiveAnimations((prev) => new Set([...prev, animationKey]));
    activeAnimationsRef.current.add(animationKey);

    const durationMs = getChannelIdleDurationMs(animationType);

    const timeoutId = window.setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      setActiveAnimations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(animationKey);
        return newSet;
      });
      activeAnimationsRef.current.delete(animationKey);
    }, durationMs);

    timeoutRefs.current.add(timeoutId);
  }, []);

  const triggerRandomAnimation = useCallback(() => {
    const channelsWithContent = getChannelsWithContent();

    if (channelsWithContent.length === 0) {
      return;
    }

    const randomChannel = channelsWithContent[Math.floor(Math.random() * channelsWithContent.length)];
    const channelId = randomChannel.id;

    const randomAnimationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];

    const animationKey = `${channelId}-${randomAnimationType}`;
    if (activeAnimations.has(animationKey)) {
      return;
    }

    startAnimation(channelId, randomAnimationType);
  }, [getChannelsWithContent, animationTypes, activeAnimations, startAnimation]);

  const effectiveInterval = lowPowerMode ? Math.max(interval, 20) : interval;

  const idleAllowed = enabled && !reducedMotion;

  useEffect(() => {
    if (reducedMotion) {
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current.clear();
      setActiveAnimations(new Set());
      activeAnimationsRef.current.clear();
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!idleAllowed || animationTypes.length === 0 || !isAppActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current.clear();
      setActiveAnimations(new Set());
      activeAnimationsRef.current.clear();

      return;
    }

    intervalRef.current = setInterval(() => {
      const channelsWithContent = getChannelsWithContent();

      if (channelsWithContent.length === 0) {
        return;
      }

      const randomChannel = channelsWithContent[Math.floor(Math.random() * channelsWithContent.length)];
      const channelId = randomChannel.id;

      const randomAnimationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];

      const animationKey = `${channelId}-${randomAnimationType}`;
      if (activeAnimationsRef.current.has(animationKey)) {
        return;
      }

      startAnimation(channelId, randomAnimationType);
    }, effectiveInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [idleAllowed, effectiveInterval, animationTypes.length, getChannelsWithContent, animationTypes, startAnimation, isAppActive]);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    },
    []
  );

  const getChannelAnimationClass = useCallback(
    (channelId) => {
      if (reducedMotion || !idleAllowed) return '';

      const animations = [];

      for (const animationKey of activeAnimations) {
        if (animationKey.startsWith(`${channelId}-`)) {
          const animationType = animationKey.replace(`${channelId}-`, '');
          animations.push(`channel-anim-${animationType}`);
        }
      }

      return animations.join(' ');
    },
    [activeAnimations, reducedMotion, idleAllowed]
  );

  const isChannelAnimating = useCallback(
    (channelId) => {
      if (reducedMotion) return false;
      for (const animationKey of activeAnimations) {
        if (animationKey.startsWith(`${channelId}-`)) {
          return true;
        }
      }
      return false;
    },
    [activeAnimations, reducedMotion]
  );

  return {
    getChannelAnimationClass,
    isChannelAnimating,
    activeAnimations: activeAnimations.size,
    isThrottled: lowPowerMode || !isAppActive,
    triggerRandomAnimation: idleAllowed ? triggerRandomAnimation : null,
  };
};

export default useIdleChannelAnimations;
