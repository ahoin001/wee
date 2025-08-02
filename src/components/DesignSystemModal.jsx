import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Input from '../ui/Input';
import Slider from '../ui/Slider';
import WToggle from '../ui/WToggle';
import WCard from '../ui/WCard';
import WText from '../ui/WText';
import WInput from '../ui/WInput';
import WSlider from '../ui/WSlider';
import './BaseModal.css';

// Component sections configuration
const COMPONENT_SECTIONS = [
  { 
    id: 'buttons', 
    label: 'Buttons', 
    icon: '🔘', 
    color: '#0099ff', 
    description: 'Button components & variants',
    components: ['Button', 'WButton']
  },
  { 
    id: 'modals', 
    label: 'Modals', 
    icon: '🪟', 
    color: '#9b59b6', 
    description: 'Modal dialogs & overlays',
    components: ['BaseModal', 'WBaseModal']
  },
  { 
    id: 'toggles', 
    label: 'Toggles', 
    icon: '🔄', 
    color: '#ff6b35', 
    description: 'Toggle switches & controls',
    components: ['Toggle', 'WToggle']
  },
  { 
    id: 'cards', 
    label: 'Cards', 
    icon: '🃏', 
    color: '#4ecdc4', 
    description: 'Card containers & layouts',
    components: ['Card', 'WCard']
  },
  { 
    id: 'text', 
    label: 'Text', 
    icon: '📝', 
    color: '#45b7d1', 
    description: 'Typography components',
    components: ['Text', 'WText']
  },
  { 
    id: 'inputs', 
    label: 'Inputs', 
    icon: '📥', 
    color: '#96ceb4', 
    description: 'Form inputs & fields',
    components: ['Input', 'WInput']
  },
  { 
    id: 'sliders', 
    label: 'Sliders', 
    icon: '🎚️', 
    color: '#feca57', 
    description: 'Range sliders & controls',
    components: ['Slider', 'WSlider']
  },
];

function DesignSystemModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('buttons');
  const [showCode, setShowCode] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('primary');
  const [selectedSize, setSelectedSize] = useState('md');
  const [selectedWeight, setSelectedWeight] = useState(600);
  const [isRounded, setIsRounded] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [inputValue, setInputValue] = useState('Sample text');
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [showWModal, setShowWModal] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderButtonComparison = () => (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-surface-secondary rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Controls</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Variant
            </label>
            <select 
              value={selectedVariant} 
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full px-3 py-2 border border-border-primary rounded-md bg-surface-primary text-text-primary"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
              <option value="danger-primary">Danger Primary</option>
              <option value="danger-secondary">Danger Secondary</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Size
            </label>
            <select 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-border-primary rounded-md bg-surface-primary text-text-primary"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Font Weight
            </label>
            <select 
              value={selectedWeight} 
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border-primary rounded-md bg-surface-primary text-text-primary"
            >
              <option value={400}>Normal (400)</option>
              <option value={500}>Medium (500)</option>
              <option value={600}>Semibold (600)</option>
              <option value={700}>Bold (700)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Options</h3>
          
          <div className="space-y-3">
            <WToggle
              checked={isRounded}
              onChange={(checked) => setIsRounded(checked)}
              label="Rounded"
            />
          </div>

          <div className="space-y-3">
            <WToggle
              checked={isFullWidth}
              onChange={(checked) => setIsFullWidth(checked)}
              label="Full Width"
            />
          </div>

          <div className="space-y-3">
            <WToggle
              checked={isDisabled}
              onChange={(checked) => setIsDisabled(checked)}
              label="Disabled"
            />
          </div>
        </div>
      </div>

      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Button */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Button</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Button 
              variant={selectedVariant}
              size={selectedSize}
              weight={selectedWeight}
              rounded={isRounded}
              fullWidth={isFullWidth}
              disabled={isDisabled}
              onClick={() => alert('Legacy Button clicked!')}
            >
              {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Button
            </Button>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Button 
  variant="${selectedVariant}"
  size="${selectedSize}"
  weight={${selectedWeight}}
  rounded={${isRounded}}
  fullWidth={${isFullWidth}}
  disabled={${isDisabled}}
>
  ${selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Button
</Button>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WButton */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WButton</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Button 
              variant={selectedVariant}
              size={selectedSize}
              weight={selectedWeight}
              rounded={isRounded}
              fullWidth={isFullWidth}
              disabled={isDisabled}
              onClick={() => alert('WButton clicked!')}
            >
              {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Button
            </Button>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Button 
  variant="${selectedVariant}"
  size="${selectedSize}"
  weight={${selectedWeight}}
  rounded={${isRounded}}
  fullWidth={${isFullWidth}}
  disabled={${isDisabled}}
>
  ${selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Button
</Button>`}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* All Variants Comparison */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">All Variants Comparison</h3>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Legacy Buttons */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-text-secondary">Legacy Buttons</h4>
            <div className="space-y-3">
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="tertiary" size="sm">Tertiary</Button>
              <Button variant="danger-primary" size="sm">Danger Primary</Button>
              <Button variant="danger-secondary" size="sm">Danger Secondary</Button>
            </div>
          </div>

          {/* New WButtons */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-text-secondary">New WButtons</h4>
            <div className="space-y-3">
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="tertiary" size="sm">Tertiary</Button>
              <Button variant="danger-primary" size="sm">Danger Primary</Button>
              <Button variant="danger-secondary" size="sm">Danger Secondary</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModalComparison = () => (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-surface-secondary rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Modal Controls</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-text-secondary">
              Click buttons below to test modals
            </span>
          </div>
        </div>
      </div>

      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Modal */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy BaseModal</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Button 
              variant="primary" 
              size="md"
              onClick={() => setShowLegacyModal(true)}
            >
              Open Legacy Modal
            </Button>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WBaseModal
  title="Sample Modal"
  onClose={() => setShowLegacyModal(false)}
  footerContent={({ handleClose }) => (
    <Button variant="secondary" onClick={handleClose}>
      Close
    </Button>
  )}
>
  <p>This is a sample modal content.</p>
</WBaseModal>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WBaseModal */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WBaseModal</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Button 
              variant="primary" 
              size="md"
              onClick={() => setShowWModal(true)}
            >
              Open WBaseModal
            </Button>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WBaseModal
  title="Sample Modal"
  onClose={() => setShowWModal(false)}
  isOpen={showWModal}
  footerContent={({ handleClose }) => (
    <Button variant="secondary" onClick={handleClose}>
      Close
    </Button>
  )}
>
  <p>This is a sample modal content.</p>
</WBaseModal>`}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Legacy Modal */}
      {showLegacyModal && (
        <WBaseModal
          title="Sample Legacy Modal"
          onClose={() => setShowLegacyModal(false)}
          footerContent={({ handleClose }) => (
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          )}
        >
          <div className="space-y-4">
            <p className="text-text-secondary">
              This is a sample modal content to demonstrate the legacy BaseModal component.
            </p>
            <p className="text-text-secondary">
              It includes all the original styling and behavior from the CSS-based implementation.
            </p>
          </div>
        </WBaseModal>
      )}

      {/* WBaseModal */}
      {showWModal && (
        <WBaseModal
          title="Sample WBaseModal"
          onClose={() => setShowWModal(false)}
          isOpen={showWModal}
          footerContent={({ handleClose }) => (
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          )}
        >
          <div className="space-y-4">
            <p className="text-text-secondary">
              This is a sample modal content to demonstrate the new WBaseModal component.
            </p>
            <p className="text-text-secondary">
              It uses Headless UI's Dialog component with Tailwind CSS styling.
            </p>
          </div>
        </WBaseModal>
      )}
    </div>
  );

  const renderToggleComparison = () => (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-surface-secondary rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Toggle State</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-text-secondary">
              Value: {toggleValue ? 'ON' : 'OFF'}
            </span>
            <button 
              onClick={() => setToggleValue(!toggleValue)}
              className="px-3 py-1 bg-wii-blue text-white rounded text-sm"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Toggle */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Toggle</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <WToggle 
              checked={toggleValue}
              onChange={setToggleValue}
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WToggle 
  checked={${toggleValue}}
  onChange={setToggleValue}
/>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WToggle */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WToggle</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <WToggle 
              checked={toggleValue}
              onChange={setToggleValue}
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WToggle 
  checked={${toggleValue}}
  onChange={setToggleValue}
/>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCardComparison = () => (
    <div className="space-y-8">
      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Card */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Card</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[300px] flex flex-col items-center justify-center space-y-4">
            <Card>
              <div className="p-4">
                <h4 className="text-lg font-semibold mb-2">Card Title</h4>
                <p className="text-text-secondary">
                  This is a sample card content with some text to demonstrate the layout.
                </p>
                <div className="mt-4 flex space-x-2">
                  <Button variant="primary" size="sm">Action</Button>
                  <Button variant="secondary" size="sm">Cancel</Button>
                </div>
              </div>
            </Card>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Card>
  <div className="p-4">
    <h4>Card Title</h4>
    <p>Card content...</p>
    <div className="mt-4 flex space-x-2">
      <Button variant="primary" size="sm">Action</Button>
      <Button variant="secondary" size="sm">Cancel</Button>
    </div>
  </div>
</Card>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WCard */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WCard</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[300px] flex flex-col items-center justify-center space-y-4">
            <WCard>
              <div className="p-4">
                <h4 className="text-lg font-semibold mb-2">Card Title</h4>
                <p className="text-text-secondary">
                  This is a sample card content with some text to demonstrate the layout.
                </p>
                <div className="mt-4 flex space-x-2">
                  <Button variant="primary" size="sm">Action</Button>
                  <Button variant="secondary" size="sm">Cancel</Button>
                </div>
              </div>
            </WCard>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WCard>
  <div className="p-4">
    <h4>Card Title</h4>
    <p>Card content...</p>
    <div className="mt-4 flex space-x-2">
      <Button variant="primary" size="sm">Action</Button>
      <Button variant="secondary" size="sm">Cancel</Button>
    </div>
  </div>
</WCard>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTextComparison = () => (
    <div className="space-y-8">
      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Text</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[300px] flex flex-col items-start justify-center space-y-4">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="body">Body text with regular styling</Text>
            <Text variant="caption">Caption text for smaller details</Text>
            <Text variant="label">Label text for form elements</Text>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="h3">Heading 3</Text>
<Text variant="body">Body text</Text>
<Text variant="caption">Caption text</Text>
<Text variant="label">Label text</Text>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WText */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WText</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[300px] flex flex-col items-start justify-center space-y-4">
            <WText variant="h1">Heading 1</WText>
            <WText variant="h2">Heading 2</WText>
            <WText variant="h3">Heading 3</WText>
            <WText variant="body">Body text with regular styling</WText>
            <WText variant="caption">Caption text for smaller details</WText>
            <WText variant="label">Label text for form elements</WText>
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WText variant="h1">Heading 1</WText>
<WText variant="h2">Heading 2</WText>
<WText variant="h3">Heading 3</WText>
<WText variant="body">Body text</WText>
<WText variant="caption">Caption text</WText>
<WText variant="label">Label text</WText>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInputComparison = () => (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-surface-secondary rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Input Value</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Value
            </label>
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-border-primary rounded-md bg-surface-primary text-text-primary"
              placeholder="Enter text..."
            />
          </div>
        </div>
      </div>

      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Input */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Input</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter text..."
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Input 
  value="${inputValue}"
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="Enter text..."
/>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WInput */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WInput</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <WInput 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter text..."
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WInput 
  value="${inputValue}"
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="Enter text..."
/>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSliderComparison = () => (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-surface-secondary rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Slider Value</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-text-secondary">
              Value: {sliderValue}
            </span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderValue} 
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Component Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Legacy Slider */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Legacy Slider</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <Slider 
              value={sliderValue}
              onChange={setSliderValue}
              min={0}
              max={100}
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<Slider 
  value={${sliderValue}}
  onChange={setSliderValue}
  min={0}
  max={100}
/>`}
              </pre>
            )}
          </div>
        </div>

        {/* New WSlider */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">New WSlider</h3>
          <div className="p-6 bg-surface-secondary rounded-lg min-h-[200px] flex flex-col items-center justify-center space-y-4">
            <WSlider 
              value={sliderValue}
              onChange={setSliderValue}
              min={0}
              max={100}
            />
            
            {showCode && (
              <pre className="text-xs bg-surface-primary p-3 rounded border border-border-primary overflow-x-auto w-full">
                {`<WSlider 
  value={${sliderValue}}
  onChange={setSliderValue}
  min={0}
  max={100}
/>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'buttons':
        return renderButtonComparison();
      case 'modals':
        return renderModalComparison();
      case 'toggles':
        return renderToggleComparison();
      case 'cards':
        return renderCardComparison();
      case 'text':
        return renderTextComparison();
      case 'inputs':
        return renderInputComparison();
      case 'sliders':
        return renderSliderComparison();
      default:
        return renderButtonComparison();
    }
  };

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Design System Components"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="90vh"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center space-x-4">
            <WToggle
              checked={showCode}
              onChange={(checked) => setShowCode(checked)}
              label="Show Code"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    >
      {/* Sidebar Navigation */}
      <div style={{ 
        display: 'flex', 
        height: 'calc(90vh - 200px)', // Account for header, footer, and padding
        border: '1px solid hsl(var(--border-primary))',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '220px',
          background: 'hsl(var(--surface-secondary))',
          borderRight: '1px solid hsl(var(--border-primary))',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          {COMPONENT_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => handleTabChange(section.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                background: activeTab === section.id ? section.color : 'transparent',
                color: activeTab === section.id ? 'white' : 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === section.id ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                borderBottom: '1px solid hsl(var(--border-primary))'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== section.id) {
                  e.target.style.background = 'hsl(var(--surface-tertiary))';
                  e.target.style.color = section.color;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== section.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'hsl(var(--text-secondary))';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{section.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '600' }}>{section.label}</span>
                <span style={{ 
                  fontSize: '11px', 
                  opacity: 0.7,
                  marginTop: '2px'
                }}>
                  {section.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          paddingBottom: '90px',
          overflowY: 'auto',
          background: 'hsl(var(--surface-primary))',
          minHeight: 0 // Important for flex child scrolling
        }}>
          {renderTabContent()}
        </div>
      </div>
    </WBaseModal>
  );
}

DesignSystemModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DesignSystemModal; 