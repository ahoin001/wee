// Card.jsx - Unified card component for app UI with Wii-style variants
// 
// Usage Examples:
// 
// Default Card:
// <Card><Text variant="h3">Title</Text>...</Card>
// 
// Wii Emphasis Card (for headers/sections):
// <Card 
//   variant="wii-emphasis" 
//   color="blue" 
//   icon="🔊"
//   title="Sound Studio"
//   subtitle="Create your perfect audio experience!"
//   actions={<button>Action</button>}
// />
// 
// Wii Feature Card (for feature highlights):
// <Card 
//   variant="wii-feature" 
//   color="red" 
//   icon="🎵"
//   title="Background Music"
//   subtitle="Continuous audio experience"
//   desc="Set up your perfect background music!"
//   features={['🎵 Looping', '📝 Playlist', '❤️ Favorites']}
// />
// 
// Wii Stats Card (for statistics/dashboards):
// <Card 
//   variant="wii-stats" 
//   color="gray" 
//   icon="📊"
//   title="Sound Studio Stats"
//   stats={[
//     { icon: '🎵', title: 'Background Music', subtitle: 'Ready to play!' },
//     { icon: '🎮', title: 'Channel Sounds', subtitle: 'Interactive feedback' }
//   ]}
// />
// 
// Available Colors: blue, red, green, orange, purple, yellow, gray

import React from 'react';
import Text from './Text';

const Card = React.memo(({ 
  title, 
  separator, 
  desc, 
  actions, 
  headerActions, 
  children, 
  className = '', 
  style = {}, 
  onClick,
  // Wii-style variants
  variant = 'default',
  color = 'blue',
  icon,
  subtitle,
  features = [],
  stats = [],
  decorative = true
}) => {
  
  // Wii-style color schemes
  const wiiColors = {
    blue: {
      bg: 'linear-gradient(135deg, #e8f4fd 0%, #d1e7f0 50%, #b8d9e8 100%)',
      border: '#33BEED',
      shadow: 'rgba(51, 190, 237, 0.15)',
      iconBg: 'linear-gradient(135deg, #33BEED 0%, #0099ff 100%)',
      accent: '#33BEED'
    },
    red: {
      bg: 'linear-gradient(135deg, #FFE5E5 0%, #FFF0F0 100%)',
      border: '#FF6B6B',
      shadow: 'rgba(255, 107, 107, 0.15)',
      iconBg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
      accent: '#FF6B6B'
    },
    green: {
      bg: 'linear-gradient(135deg, #E8F5E8 0%, #F0FFF0 100%)',
      border: '#4CAF50',
      shadow: 'rgba(76, 175, 80, 0.15)',
      iconBg: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
      accent: '#4CAF50'
    },
    orange: {
      bg: 'linear-gradient(135deg, #FFF3E0 0%, #FFF8E1 100%)',
      border: '#FF9800',
      shadow: 'rgba(255, 152, 0, 0.15)',
      iconBg: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
      accent: '#FF9800'
    },
    purple: {
      bg: 'linear-gradient(135deg, #F3E5F5 0%, #F8F4FF 100%)',
      border: '#9C27B0',
      shadow: 'rgba(156, 39, 176, 0.15)',
      iconBg: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      accent: '#9C27B0'
    },
    yellow: {
      bg: 'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)',
      border: '#FFD93D',
      shadow: 'rgba(255, 217, 61, 0.15)',
      iconBg: 'linear-gradient(135deg, #FFD93D 0%, #FFE566 100%)',
      accent: '#FFD93D'
    },
    gray: {
      bg: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      border: '#6C757D',
      shadow: 'rgba(108, 117, 125, 0.15)',
      iconBg: 'linear-gradient(135deg, #6C757D 0%, #868E96 100%)',
      accent: '#6C757D'
    }
  };

  const colorScheme = wiiColors[color] || wiiColors.blue;

  // Default card styles
  if (variant === 'default') {
    return (
      <div 
        className={`mt-[18px] mb-0 px-7 py-6 rounded-xl bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-sm)] border border-[hsl(var(--border-primary))] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-md)] hover:border-[hsl(var(--border-secondary))] ${className}`} 
        style={style} 
        onClick={onClick}
      >
        {(title || headerActions) && (
          <div className="mb-1.5 flex items-center justify-between">
            {title && (
              <Text variant="h3" style={{ margin: 0 }}>{title}</Text>
            )}
            {headerActions}
          </div>
        )}
        {separator && <div className="h-px bg-[hsl(var(--border-primary))] my-2.5" />}
        {desc && <Text variant="desc">{desc}</Text>}
        {actions}
        {children}
      </div>
    );
  }

  // Wii-style emphasis card (like the Sound Studio header)
  if (variant === 'wii-emphasis') {
    return (
      <div 
        className={`wii-hover ${className}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '20px',
          background: colorScheme.bg,
          borderRadius: '16px',
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          position: 'relative',
          overflow: 'hidden',
          ...style
        }}
        onClick={onClick}
      >
        {/* Decorative elements */}
        {decorative && (
          <>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '40px',
              height: '40px',
              background: `radial-gradient(circle, ${colorScheme.border} 0%, ${colorScheme.accent} 100%)`,
              borderRadius: '50%',
              opacity: 0.3,
              transform: 'rotate(15deg)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '20px',
              width: '20px',
              height: '20px',
              background: `radial-gradient(circle, ${colorScheme.accent} 0%, ${colorScheme.border} 100%)`,
              borderRadius: '50%',
              opacity: 0.4
            }} />
          </>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {icon && (
              <div style={{
                width: '32px',
                height: '32px',
                background: colorScheme.iconBg,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: 'white',
                boxShadow: `0 4px 12px ${colorScheme.shadow}`,
                animation: 'pulse 2s infinite'
              }}>
                {icon}
              </div>
            )}
            <h3 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '700',
              color: '#2C3E50',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              letterSpacing: '0.5px'
            }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p style={{ 
              margin: 0, 
              fontSize: '15px', 
              color: '#5D6D7E',
              fontStyle: 'italic',
              textShadow: '0 1px 1px rgba(255,255,255,0.5)'
            }}>
              {subtitle}
            </p>
          )}
        </div>
        
        {actions}
        {children}
      </div>
    );
  }

  // Wii-style feature card (like the Background Music and Channel Sounds cards)
  if (variant === 'wii-feature') {
    return (
      <div 
        className="wii-hover"
        style={{
          background: colorScheme.bg,
          borderRadius: '16px',
          padding: '20px',
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          ...style
        }}
        onClick={onClick}
      >
        {/* Decorative element */}
        {decorative && (
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '50px',
            height: '50px',
            background: `radial-gradient(circle, ${colorScheme.border} 0%, ${colorScheme.accent} 100%)`,
            borderRadius: '50%',
            opacity: 0.2,
            transform: 'rotate(25deg)'
          }} />
        )}
        
        {/* Header with icon and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {icon && (
            <div style={{
              width: '40px',
              height: '40px',
              background: colorScheme.iconBg,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white',
              boxShadow: `0 4px 12px ${colorScheme.shadow}`
            }}>
              {icon}
            </div>
          )}
          <div>
            <h4 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '700',
              color: '#2C3E50',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {title}
            </h4>
            {subtitle && (
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '13px', 
                color: '#7F8C8D',
                fontStyle: 'italic'
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Content area */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '12px',
          padding: '16px',
          border: `2px solid ${colorScheme.shadow.replace('0.15', '0.2')}`
        }}>
          {desc && (
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              color: '#5D6D7E',
              lineHeight: '1.4'
            }}>
              {desc}
            </p>
          )}
          
          {/* Feature badges */}
          {features.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {features.map((feature, index) => (
                <span key={index} style={{
                  background: colorScheme.iconBg,
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {feature}
                </span>
              ))}
            </div>
          )}
          
          {children}
        </div>
      </div>
    );
  }

  // Wii-style stats card (like the Sound Studio Stats)
  if (variant === 'wii-stats') {
    return (
      <div 
        style={{
          background: colorScheme.bg,
          borderRadius: '16px',
          padding: '20px',
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          marginBottom: '24px',
          ...style
        }}
        onClick={onClick}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {icon && (
            <div style={{
              width: '36px',
              height: '36px',
              background: colorScheme.iconBg,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: 'white',
              boxShadow: `0 4px 12px ${colorScheme.shadow}`
            }}>
              {icon}
            </div>
          )}
          <h4 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '700',
            color: '#2C3E50',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {title}
          </h4>
        </div>
        
        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              border: `2px solid ${colorScheme.shadow.replace('0.15', '0.1')}`
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colorScheme.accent,
                marginBottom: '4px'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2C3E50'
              }}>
                {stat.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#7F8C8D',
                fontStyle: 'italic'
              }}>
                {stat.subtitle}
              </div>
            </div>
          ))}
        </div>
        
        {children}
      </div>
    );
  }

  // Fallback to default
  return (
    <div 
      className={`mt-[18px] mb-0 px-7 py-6 rounded-xl bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-sm)] border border-[hsl(var(--border-primary))] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-md)] hover:border-[hsl(var(--border-secondary))] ${className}`} 
      style={style} 
      onClick={onClick}
    >
      {(title || headerActions) && (
        <div className="mb-1.5 flex items-center justify-between">
          {title && (
            <Text variant="h3" style={{ margin: 0 }}>{title}</Text>
          )}
          {headerActions}
        </div>
      )}
      {separator && <div className="h-px bg-[hsl(var(--border-primary))] my-2.5" />}
      {desc && <Text variant="desc">{desc}</Text>}
      {actions}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 