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
  decorative = true,
  noHover = true
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
        className={`${noHover ? '' : 'wii-hover'} relative overflow-hidden p-5 mb-6 rounded-2xl ${className}`}
        style={{
          background: colorScheme.bg,
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          ...style
        }}
        onClick={onClick}
      >
        {/* Decorative elements */}
        {decorative && (
          <>
            <div 
              className="absolute -top-2.5 -right-2.5 w-10 h-10 rounded-full opacity-30 rotate-15"
              style={{
                background: `radial-gradient(circle, ${colorScheme.border} 0%, ${colorScheme.accent} 100%)`
              }} 
            />
            <div 
              className="absolute -bottom-1.5 left-5 w-5 h-5 rounded-full opacity-40"
              style={{
                background: `radial-gradient(circle, ${colorScheme.accent} 0%, ${colorScheme.border} 100%)`
              }} 
            />
          </>
        )}
        
        <div className="w-full">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg text-white animate-pulse"
                style={{
                  background: colorScheme.iconBg,
                  boxShadow: `0 4px 12px ${colorScheme.shadow}`
                }}
              >
                {icon}
              </div>
            )}
            <h3 
              className="m-0 text-xl font-bold tracking-wide"
              style={{ 
                color: '#2C3E50',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {title}
            </h3>
          </div>
          {subtitle && (
            <p 
              className="m-0 text-base italic"
              style={{ 
                color: '#5D6D7E',
                textShadow: '0 1px 1px rgba(255,255,255,0.5)'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && <div className="mt-4">{actions}</div>}
        {children}
      </div>
    );
  }

  // Wii-style feature card (like the Background Music and Channel Sounds cards)
  if (variant === 'wii-feature') {
    return (
      <div 
        className={`${noHover ? '' : 'wii-hover'} relative overflow-hidden p-5 rounded-2xl transition-all duration-300 ease-in-out`}
        style={{
          background: colorScheme.bg,
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          ...style
        }}
        onClick={onClick}
      >
        {/* Decorative element */}
        {decorative && (
          <div 
            className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-20 rotate-25"
            style={{
              background: `radial-gradient(circle, ${colorScheme.border} 0%, ${colorScheme.accent} 100%)`
            }} 
          />
        )}
        
        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-white"
              style={{
                background: colorScheme.iconBg,
                boxShadow: `0 4px 12px ${colorScheme.shadow}`
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h4 
              className="m-0 text-lg font-bold"
              style={{ 
                color: '#2C3E50',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {title}
            </h4>
            {subtitle && (
              <p className="mt-1 mb-0 text-xs italic" style={{ color: '#7F8C8D' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Content area */}
        <div 
          className="rounded-xl p-4"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            border: `2px solid ${colorScheme.shadow.replace('0.15', '0.2')}`
          }}
        >
          {desc && (
            <p className="mb-3 text-sm leading-relaxed" style={{ color: '#5D6D7E' }}>
              {desc}
            </p>
          )}
          
          {/* Feature badges */}
          {features.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {features.map((feature, index) => (
                <span 
                  key={index} 
                  className="text-white px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: colorScheme.iconBg
                  }}
                >
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
        className="p-5 rounded-2xl mb-6"
        style={{
          background: colorScheme.bg,
          border: `3px solid ${colorScheme.border}`,
          boxShadow: `0 8px 24px ${colorScheme.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          ...style
        }}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg text-white"
              style={{
                background: colorScheme.iconBg,
                boxShadow: `0 4px 12px ${colorScheme.shadow}`
              }}
            >
              {icon}
            </div>
          )}
          <h4 
            className="m-0 text-lg font-bold"
            style={{ 
              color: '#2C3E50',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {title}
          </h4>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="p-4 text-center rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: `2px solid ${colorScheme.shadow.replace('0.15', '0.1')}`
              }}
            >
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: colorScheme.accent }}
              >
                {stat.icon}
              </div>
              <div className="text-sm font-semibold" style={{ color: '#2C3E50' }}>
                {stat.title}
              </div>
              <div className="text-xs italic" style={{ color: '#7F8C8D' }}>
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