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
// Available Colors: blue, red, green, orange, purple, yellow, gray

import React from 'react';
import Text from './Text';
import './Card.css';

const WII_PALETTES = new Set(['blue', 'red', 'green', 'orange', 'purple', 'yellow', 'gray']);

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
  variant = 'default',
  color = 'blue',
  icon,
  subtitle,
  features = [],
  stats = [],
  decorative = true,
  noHover = true
}) => {
  const palette = WII_PALETTES.has(color) ? color : 'blue';

  // Default card styles
  if (variant === 'default') {
    return (
      <div
        className={`mt-[18px] mb-0 px-7 py-6 rounded-[var(--radius-lg)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%),hsl(var(--surface-secondary))] backdrop-blur-[8px] shadow-[var(--shadow-soft)] border border-[hsl(var(--border-primary))] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-soft-hover)] hover:border-[hsl(var(--border-secondary))] ${className}`}
        style={style}
        onClick={onClick}
      >
        {(title || headerActions) && (
          <div className="mb-1.5 flex items-center justify-between">
            {title && (
              <Text variant="h3" className="m-0">{title}</Text>
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

  if (variant === 'wii-emphasis') {
    return (
      <div
        className={`wii-card wii-card--emphasis ${noHover ? '' : 'wii-hover'} relative overflow-hidden p-5 mb-6 rounded-2xl ${className}`}
        data-wii-color={palette}
        style={style}
        onClick={onClick}
      >
        {decorative && (
          <>
            <div
              className="wii-card-deco-tr absolute -top-2.5 -right-2.5 w-10 h-10 rounded-full opacity-30 rotate-15"
            />
            <div
              className="wii-card-deco-bl absolute -bottom-1.5 left-5 w-5 h-5 rounded-full opacity-40"
            />
          </>
        )}

        <div className="w-full">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="wii-card-icon-circle w-8 h-8 rounded-full flex items-center justify-center text-lg text-white animate-pulse">
                {icon}
              </div>
            )}
            <h3 className="m-0 text-xl font-semibold tracking-wide wii-card-text-title">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="m-0 text-base italic wii-card-text-sub">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="mt-4">{actions}</div>}
        {children}
      </div>
    );
  }

  if (variant === 'wii-feature') {
    return (
      <div
        className={`wii-card ${noHover ? '' : 'wii-hover'} relative overflow-hidden p-5 rounded-2xl transition-all duration-300 ease-in-out wii-card--emphasis ${className}`}
        data-wii-color={palette}
        style={style}
        onClick={onClick}
      >
        {decorative && (
          <div
            className="wii-card-deco-feature absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-20 rotate-25"
          />
        )}

        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="wii-card-icon-circle w-10 h-10 rounded-full flex items-center justify-center text-xl text-white">
              {icon}
            </div>
          )}
          <div>
            <h4 className="m-0 text-lg font-semibold wii-card-text-title">
              {title}
            </h4>
            {subtitle && (
              <p className="mt-1 mb-0 text-xs italic wii-card-text-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="wii-card-feature-body rounded-xl p-4">
          {desc && (
            <p className="mb-3 text-sm leading-relaxed wii-card-text-muted">
              {desc}
            </p>
          )}

          {features.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="wii-card-feature-badge text-white px-3 py-1 rounded-full text-xs font-semibold"
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

  if (variant === 'wii-stats') {
    return (
      <div
        className={`wii-card wii-card--emphasis p-5 rounded-2xl mb-6 ${className}`}
        data-wii-color={palette}
        style={style}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="wii-card-icon-circle w-9 h-9 rounded-full flex items-center justify-center text-lg text-white">
              {icon}
            </div>
          )}
          <h4 className="m-0 text-lg font-semibold wii-card-text-title">
            {title}
          </h4>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="wii-card-stat-cell p-4 text-center rounded-xl"
            >
              <div className="wii-card-stat-icon text-2xl font-bold mb-1">
                {stat.icon}
              </div>
              <div className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                {stat.title}
              </div>
              <div className="text-xs italic text-[hsl(var(--text-secondary))]">
                {stat.subtitle}
              </div>
            </div>
          ))}
        </div>

        {children}
      </div>
    );
  }

  return (
    <div
      className={`mt-[18px] mb-0 px-7 py-6 rounded-[var(--radius-lg)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%),hsl(var(--surface-secondary))] backdrop-blur-[8px] shadow-[var(--shadow-soft)] border border-[hsl(var(--border-primary))] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-soft-hover)] hover:border-[hsl(var(--border-secondary))] ${className}`}
      style={style}
      onClick={onClick}
    >
      {(title || headerActions) && (
        <div className="mb-1.5 flex items-center justify-between">
          {title && (
            <Text variant="h3" className="m-0">{title}</Text>
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
