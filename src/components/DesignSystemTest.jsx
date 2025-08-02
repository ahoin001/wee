// DesignSystemTest.jsx - Test component to demonstrate the Design System Modal
import React, { useState } from "react";
import DesignSystemModal from "./DesignSystemModal";
import WButton from "../ui/WButton";

const DesignSystemTest = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8 space-y-6 bg-surface-primary min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          Design System Modal Test
        </h1>
        
        <div className="space-y-4">
          <p className="text-text-secondary">
            This page demonstrates the Design System Modal, which allows you to compare legacy and new W-prefixed components side by side.
          </p>
          
          <div className="p-6 bg-surface-secondary rounded-lg">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Features
            </h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• Side-by-side comparison of legacy and new components</li>
              <li>• Interactive controls to test different variants and states</li>
              <li>• Code preview toggle to see the actual JSX</li>
              <li>• Tabbed navigation for different component types</li>
              <li>• Real-time updates as you change settings</li>
            </ul>
          </div>
          
          <div className="flex space-x-4">
            <WButton 
              variant="primary" 
              onClick={() => setShowModal(true)}
            >
              Open Design System Modal
            </WButton>
            
            <WButton 
              variant="secondary" 
              onClick={() => window.open('https://github.com/your-repo/design-system', '_blank')}
            >
              View Documentation
            </WButton>
          </div>
          
          <div className="p-6 bg-surface-secondary rounded-lg">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Available Components
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
              <div>
                <h4 className="font-medium text-text-primary mb-2">Buttons</h4>
                <ul className="space-y-1">
                  <li>• Primary, Secondary, Tertiary variants</li>
                  <li>• Danger variants (Primary & Secondary)</li>
                  <li>• Small, Medium, Large sizes</li>
                  <li>• Rounded and full-width options</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Toggles</h4>
                <ul className="space-y-1">
                  <li>• On/Off state management</li>
                  <li>• Smooth transitions</li>
                  <li>• Accessible keyboard navigation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Cards</h4>
                <ul className="space-y-1">
                  <li>• Content containers</li>
                  <li>• Shadow and border styling</li>
                  <li>• Flexible content layout</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Text</h4>
                <ul className="space-y-1">
                  <li>• Heading variants (H1, H2, H3)</li>
                  <li>• Body, Caption, Label variants</li>
                  <li>• Consistent typography</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Inputs</h4>
                <ul className="space-y-1">
                  <li>• Text input fields</li>
                  <li>• Focus states and validation</li>
                  <li>• Placeholder support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Sliders</h4>
                <ul className="space-y-1">
                  <li>• Range input controls</li>
                  <li>• Custom styling</li>
                  <li>• Value display</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DesignSystemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default DesignSystemTest; 