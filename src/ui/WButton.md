# WButton Component

A modern, Tailwind CSS-based button component built with Tailwind Variants for the Wii Desktop Launcher project.

## Features

- **Tailwind Variants**: Type-safe, composable styling with excellent developer experience
- **Design System Integration**: Uses the project's design system colors and tokens
- **Accessibility**: Proper focus states, keyboard navigation, and ARIA support
- **Performance**: Memoized components and optimized re-renders
- **Flexibility**: Extensive variant system with easy customization

## Installation

The component requires the following dependencies:
```bash
npm install tailwindcss tailwind-variants @headlessui/react
```

## Usage

### Basic Usage
```jsx
import WButton from './ui/WButton';

// Primary button (default)
<WButton>Click me</WButton>

// Secondary button
<WButton variant="secondary">Secondary</WButton>

// Tertiary button
<WButton variant="tertiary">Tertiary</WButton>
```

### Variants

#### Primary (Default)
```jsx
<WButton variant="primary">Primary Button</WButton>
```

#### Secondary
```jsx
<WButton variant="secondary">Secondary Button</WButton>
```

#### Tertiary
```jsx
<WButton variant="tertiary">Tertiary Button</WButton>
```

#### Danger Primary
```jsx
<WButton variant="danger-primary">Delete</WButton>
```

#### Danger Secondary
```jsx
<WButton variant="danger-secondary">Remove</WButton>
```

### Sizes

```jsx
<WButton size="sm">Small</WButton>
<WButton size="md">Medium (default)</WButton>
<WButton size="lg">Large</WButton>
```

### Font Weights

```jsx
<WButton weight={400}>Normal</WButton>
<WButton weight={500}>Medium</WButton>
<WButton weight={600}>Semibold (default)</WButton>
<WButton weight={700}>Bold</WButton>
```

### Rounded

```jsx
<WButton rounded={false}>Default (rounded-lg)</WButton>
<WButton rounded={true}>Fully Rounded</WButton>
```

### Full Width

```jsx
<WButton fullWidth>Full Width Button</WButton>
```

### Disabled State

```jsx
<WButton disabled>Disabled Button</WButton>
```

### Event Handlers

```jsx
<WButton 
  onClick={() => console.log('Clicked!')}
  onMouseDown={() => console.log('Mouse down')}
  onMouseUp={() => console.log('Mouse up')}
  onMouseLeave={() => console.log('Mouse left')}
>
  Interactive Button
</WButton>
```

### Custom Styling

```jsx
<WButton 
  variant="primary"
  className="animate-pulse border-4 border-wii-blue"
>
  Custom Styled Button
</WButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger-primary' \| 'danger-secondary'` | `'primary'` | Button variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `weight` | `400 \| 500 \| 600 \| 700` | `600` | Font weight |
| `rounded` | `boolean` | `false` | Whether to use fully rounded corners |
| `fullWidth` | `boolean` | `false` | Whether button should take full width |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `className` | `string` | `undefined` | Additional CSS classes |
| `children` | `ReactNode` | - | Button content |
| `onClick` | `(event: MouseEvent) => void` | - | Click handler |
| `onMouseDown` | `(event: MouseEvent) => void` | - | Mouse down handler |
| `onMouseUp` | `(event: MouseEvent) => void` | - | Mouse up handler |
| `onMouseLeave` | `(event: MouseEvent) => void` | - | Mouse leave handler |

## Design System Integration

The component uses the project's design system colors defined in `tailwind.config.js`:

- **Wii Blue**: `hsl(195 75% 60%)` - Primary brand color
- **Surface Colors**: Background colors for different elevation levels
- **Text Colors**: Primary, secondary, tertiary, and inverse text colors
- **State Colors**: Hover, active, disabled, error, success, warning states
- **Border Colors**: Primary, secondary, tertiary, and accent borders

## Styling Details

### Base Styles
- Flexbox layout with centered content
- Smooth transitions (200ms duration)
- Focus ring for accessibility
- Transform effects on hover and active states
- Proper disabled state styling

### Hover Effects
- Scale transform (105% on hover, 95% on active)
- Vertical translation (-0.5 on hover, 0 on active)
- Color transitions for background, border, and text
- Shadow effects for depth

### Focus States
- Ring outline with 2px width
- Proper offset for visibility
- Color matches button variant

### Disabled States
- Reduced opacity (50%)
- Disabled cursor
- Maintains visual structure

## Migration from Original Button

The WButton component is designed to be a drop-in replacement for the original Button component:

1. **Same API**: All props and variants are preserved
2. **Visual Consistency**: Matches the original design exactly
3. **Enhanced Performance**: Better memoization and optimization
4. **Improved DX**: Type-safe variants with Tailwind Variants

### Migration Steps

1. Replace imports:
   ```jsx
   // Before
   import Button from './ui/Button';
   
   // After
   import WButton from './ui/WButton';
   ```

2. Update component usage:
   ```jsx
   // Before
   <Button variant="primary">Click me</Button>
   
   // After
   <WButton variant="primary">Click me</WButton>
   ```

3. Test functionality and styling

## Testing

Use the `ButtonComparison` component to visually compare the original Button and new WButton:

```jsx
import ButtonComparison from './components/ButtonComparison';

// Render this component to see side-by-side comparison
<ButtonComparison />
```

## Future Enhancements

- [ ] Add loading state with spinner
- [ ] Add icon support
- [ ] Add button groups
- [ ] Add more size variants
- [ ] Add animation variants
- [ ] Add theme customization

## Dependencies

- `tailwindcss`: CSS framework
- `tailwind-variants`: Type-safe variant system
- `@headlessui/react`: Accessibility utilities (for future use)
- `react`: React library 