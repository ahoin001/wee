import React from 'react';
import PropTypes from 'prop-types';
import KenBurnsImage from './KenBurnsImage';
import './Channel.css';

/**
 * Example component showing how to integrate Ken Burns effect with channels
 * This can be used as a reference for updating the existing Channel.jsx component
 */
const ChannelKenBurnsExample = ({ 
  media, 
  empty = false, 
  kenBurnsMode = 'hover', // 'hover', 'autoplay', 'slideshow', 'none'
  kenBurnsEnabled = false,
  onClick,
  onRightClick,
  style,
  animatedOnHover = false,
  ...props 
}) => {
  
  // Don't render Ken Burns for empty channels
  if (empty) {
    return (
      <div 
        className="channel empty"
        onClick={onClick}
        onContextMenu={onRightClick}
        style={style}
        {...props}
      >
        <div className="channel-empty-indicator">+</div>
      </div>
    );
  }

  // Determine if we should use Ken Burns
  const shouldUseKenBurns = kenBurnsEnabled && 
                           media && 
                           media.url && 
                           media.type && 
                           media.type.startsWith('image/') &&
                           kenBurnsMode !== 'none';

  return (
    <div 
      className={`channel ${kenBurnsEnabled ? 'channel-ken-burns' : ''}`}
      onClick={onClick}
      onContextMenu={onRightClick}
      style={style}
      {...props}
    >
      {media && media.url ? (
        <div className="channel-media">
          {shouldUseKenBurns ? (
            // Use Ken Burns effect for images
            <KenBurnsImage
              src={media.url}
              mode={kenBurnsMode}
              width="100%"
              height="100%"
              borderRadius="12px"
              objectFit="cover"
              alt={media.name || 'Channel Image'}
              
              // Hover mode settings
              hoverDuration={8000}
              hoverScale={1.1}
              
              // Autoplay mode settings  
              autoplayDuration={12000}
              autoplayScale={1.15}
              crossfadeDuration={1000}
              
              // Performance settings
              enableIntersectionObserver={true}
            />
          ) : media.type && media.type.startsWith('image/') ? (
            // Regular image without Ken Burns
            <img 
              src={media.url} 
              alt={media.name || 'Channel Image'}
              className={`channel-image ${animatedOnHover ? 'animated-on-hover' : ''}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              loading="lazy"
            />
          ) : media.type && media.type.startsWith('video/') ? (
            // Video media
            <video 
              src={media.url}
              className={`channel-video ${animatedOnHover ? 'animated-on-hover' : ''}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              autoPlay={!animatedOnHover}
              loop
              muted
              playsInline
            />
          ) : (
            // Fallback for other media types
            <div className="channel-media-fallback">
              <span>Media</span>
            </div>
          )}
        </div>
      ) : (
        // No media
        <div className="channel-no-media">
          <span>No Image</span>
        </div>
      )}
      
      {/* Optional overlay for better text readability */}
      {media && media.name && (
        <div className="channel-overlay">
          <span className="channel-name">{media.name}</span>
        </div>
      )}
    </div>
  );
};

ChannelKenBurnsExample.propTypes = {
  media: PropTypes.shape({
    url: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
  }),
  empty: PropTypes.bool,
  kenBurnsMode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow', 'none']),
  kenBurnsEnabled: PropTypes.bool,
  onClick: PropTypes.func,
  onRightClick: PropTypes.func,
  style: PropTypes.object,
  animatedOnHover: PropTypes.bool,
};

export default ChannelKenBurnsExample;

// Usage examples:

/*
// Basic hover Ken Burns
<ChannelKenBurnsExample 
  media={{ url: '/image.jpg', type: 'image/jpeg', name: 'My App' }}
  kenBurnsEnabled={true}
  kenBurnsMode="hover"
  onClick={handleChannelClick}
/>

// Autoplay Ken Burns
<ChannelKenBurnsExample 
  media={{ url: '/image.jpg', type: 'image/jpeg', name: 'My App' }}
  kenBurnsEnabled={true}
  kenBurnsMode="autoplay"
  onClick={handleChannelClick}
/>

// Disable Ken Burns (regular behavior)
<ChannelKenBurnsExample 
  media={{ url: '/image.jpg', type: 'image/jpeg', name: 'My App' }}
  kenBurnsEnabled={false}
  onClick={handleChannelClick}
/>

// Multiple images with slideshow (if supported)
<ChannelKenBurnsExample 
  media={{ 
    urls: ['/img1.jpg', '/img2.jpg', '/img3.jpg'], 
    type: 'image/jpeg', 
    name: 'My App Gallery' 
  }}
  kenBurnsEnabled={true}
  kenBurnsMode="slideshow"
  onClick={handleChannelClick}
/>
*/ 