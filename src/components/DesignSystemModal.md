# Design System Modal

A comprehensive component comparison tool that allows you to view and test legacy and new W-prefixed components side by side. This modal is essential for ensuring visual consistency during the UI migration process.

## Features

- **Side-by-Side Comparison**: View legacy and new components simultaneously
- **Interactive Controls**: Test different variants, sizes, and states in real-time
- **Code Preview**: Toggle to see the actual JSX code for each component
- **Tabbed Navigation**: Organized by component type (Buttons, Toggles, Cards, etc.)
- **Real-Time Updates**: Changes reflect immediately as you adjust settings
- **Comprehensive Coverage**: Supports all major UI components

## Usage

### Basic Usage
```jsx
import DesignSystemModal from './components/DesignSystemModal';

const [showModal, setShowModal] = useState(false);

<DesignSystemModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

### Access from Settings
The modal is accessible from the Appearance Settings Modal via the "Design System" button in the footer.

## Component Sections

### 🔘 Buttons
- **Legacy**: `Button` component
- **New**: `WButton` component
- **Features**:
  - Variant selection (Primary, Secondary, Tertiary, Danger variants)
  - Size controls (Small, Medium, Large)
  - Font weight options (400, 500, 600, 700)
  - Toggle options (Rounded, Full Width, Disabled)
  - All variants comparison view

### 🔄 Toggles
- **Legacy**: `Toggle` component
- **New**: `WToggle` component
- **Features**:
  - State management (ON/OFF)
  - Interactive toggle button
  - Real-time state display

### 🃏 Cards
- **Legacy**: `Card` component
- **New**: `WCard` component
- **Features**:
  - Content container comparison
  - Sample card with buttons
  - Layout and styling differences

### 📝 Text
- **Legacy**: `Text` component
- **New**: `WText` component
- **Features**:
  - Typography variants (H1, H2, H3, Body, Caption, Label)
  - Consistent text styling
  - Visual hierarchy comparison

### 📥 Inputs
- **Legacy**: `Input` component
- **New**: `WInput` component
- **Features**:
  - Text input field comparison
  - Value management
  - Focus states and styling

### 🎚️ Sliders
- **Legacy**: `Slider` component
- **New**: `WSlider` component
- **Features**:
  - Range input controls
  - Value display and adjustment
  - Custom styling comparison

## Controls and Interactions

### Button Controls
- **Variant Selector**: Choose between Primary, Secondary, Tertiary, Danger Primary, Danger Secondary
- **Size Selector**: Small, Medium, Large options
- **Font Weight**: Normal (400), Medium (500), Semibold (600), Bold (700)
- **Options**: Checkboxes for Rounded, Full Width, Disabled states

### Toggle Controls
- **State Display**: Shows current ON/OFF state
- **Toggle Button**: Manually change the state
- **Real-time Updates**: Changes reflect immediately

### Input Controls
- **Value Input**: Direct text input for testing
- **Placeholder Support**: Shows placeholder text behavior

### Slider Controls
- **Value Display**: Shows current slider value
- **Range Input**: Direct value adjustment
- **Real-time Updates**: Changes reflect immediately

## Code Preview

Toggle the "Show Code" checkbox in the footer to display the actual JSX code for each component. This helps developers understand:

- Exact prop usage
- Component structure
- Implementation differences
- Migration patterns

## Navigation

### Sidebar Navigation
- **Icons**: Each section has a unique icon and color
- **Descriptions**: Brief descriptions of component functionality
- **Active States**: Visual feedback for current section
- **Hover Effects**: Smooth transitions and color changes

### Content Area
- **Responsive Layout**: Adapts to different screen sizes
- **Scrollable Content**: Handles overflow gracefully
- **Consistent Spacing**: Maintains design system spacing

## Integration

### With Appearance Settings Modal
The Design System Modal is integrated into the Appearance Settings Modal:

```jsx
// In AppearanceSettingsModal.jsx
<Button 
  variant="secondary" 
  size="sm"
  onClick={() => setShowDesignSystemModal(true)}
>
  Design System
</Button>

<DesignSystemModal
  isOpen={showDesignSystemModal}
  onClose={() => setShowDesignSystemModal(false)}
/>
```

### Standalone Usage
You can also use the modal independently:

```jsx
import DesignSystemModal from './components/DesignSystemModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Open Design System
      </button>
      
      <DesignSystemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
```

## Styling

The modal uses the project's design system:

- **Colors**: Design system color tokens
- **Typography**: Consistent font weights and sizes
- **Spacing**: Design system spacing values
- **Shadows**: Consistent shadow system
- **Borders**: Design system border styles

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Screen Reader Support**: Semantic HTML structure
- **Color Contrast**: Meets accessibility standards

## Future Enhancements

- [ ] Add more component types (Modals, Dropdowns, etc.)
- [ ] Component performance metrics
- [ ] Export comparison reports
- [ ] Automated visual regression testing
- [ ] Component usage analytics
- [ ] Migration progress tracking

## Dependencies

- `BaseModal`: Modal container component
- Legacy UI components: `Button`, `Toggle`, `Card`, `Text`, `Input`, `Slider`
- New W-prefixed components: `WButton`, `WToggle`, `WCard`, `WText`, `WInput`, `WSlider`
- Tailwind CSS: For styling and layout
- React: For component logic and state management

## Testing

Use the `DesignSystemTest` component to test the modal:

```jsx
import DesignSystemTest from './components/DesignSystemTest';

// Render this component to test the modal functionality
<DesignSystemTest />
```

This provides a comprehensive testing environment with:
- Modal opening/closing
- All component interactions
- Responsive behavior
- Accessibility testing 