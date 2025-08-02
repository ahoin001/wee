import React from 'react';
import Button from '../ui/WButton';

const ButtonTest = () => {
  return (
    <div className="p-8 space-y-8 bg-surface-primary min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          WButton Component Showcase
        </h1>
        
        {/* Primary Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Primary Buttons</h2>
          <div className="space-y-3">
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="primary" size="md">Medium Primary</Button>
            <Button variant="primary" size="lg">Large Primary</Button>
          </div>
        </div>

        {/* Secondary Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Secondary Buttons</h2>
          <div className="space-y-3">
            <Button variant="secondary" size="sm">Small Secondary</Button>
            <Button variant="secondary" size="md">Medium Secondary</Button>
            <Button variant="secondary" size="lg">Large Secondary</Button>
          </div>
        </div>

        {/* Tertiary Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Tertiary Buttons</h2>
          <div className="space-y-3">
            <Button variant="tertiary" size="sm">Small Tertiary</Button>
            <Button variant="tertiary" size="md">Medium Tertiary</Button>
            <Button variant="tertiary" size="lg">Large Tertiary</Button>
          </div>
        </div>

        {/* Danger Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Danger Buttons</h2>
          <div className="space-y-3">
            <Button variant="danger-primary" size="sm">Danger Primary</Button>
            <Button variant="danger-secondary" size="sm">Danger Secondary</Button>
          </div>
        </div>

        {/* Rounded Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Rounded Buttons</h2>
          <div className="space-y-3">
            <Button variant="primary" rounded>Rounded Primary</Button>
            <Button variant="secondary" rounded>Rounded Secondary</Button>
          </div>
        </div>

        {/* Full Width Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Full Width Buttons</h2>
          <div className="space-y-3">
            <Button variant="primary" fullWidth>Full Width Primary</Button>
            <Button variant="secondary" fullWidth>Full Width Secondary</Button>
          </div>
        </div>

        {/* Disabled Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Disabled Buttons</h2>
          <div className="space-y-3">
            <Button variant="primary" disabled>Disabled Primary</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonTest; 