import React, { useState } from 'react';
import KenBurnsImage from './KenBurnsImage';
import Button from '../ui/Button';
import Text from '../ui/Text';
import Card from '../ui/Card';

// Example images for testing (using placeholder service)
const DEMO_IMAGES = [
  'https://picsum.photos/400/300?random=1',
  'https://picsum.photos/400/300?random=2',
  'https://picsum.photos/400/300?random=3',
  'https://picsum.photos/400/300?random=4',
  'https://picsum.photos/400/300?random=5',
];

const KenBurnsDemo = () => {
  const [currentMode, setCurrentMode] = useState('hover');
  const [selectedImages, setSelectedImages] = useState(DEMO_IMAGES.slice(0, 3));

  const handleImageChange = (index, src) => {
    // console.log(`Slideshow changed to image ${index + 1}:`, src);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Text variant="h1">Ken Burns Effect Demo</Text>
      <Text variant="p">
        Flexible Ken Burns effect component with three modes: hover-only, autoplay loop, and multi-image slideshow.
      </Text>

      {/* Mode Selection */}
      <Card title="Mode Selection" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <Button
            variant={currentMode === 'hover' ? 'primary' : 'secondary'}
            onClick={() => setCurrentMode('hover')}
          >
            Hover Mode
          </Button>
          <Button
            variant={currentMode === 'autoplay' ? 'primary' : 'secondary'}
            onClick={() => setCurrentMode('autoplay')}
          >
            Autoplay Mode
          </Button>
          <Button
            variant={currentMode === 'slideshow' ? 'primary' : 'secondary'}
            onClick={() => setCurrentMode('slideshow')}
          >
            Slideshow Mode
          </Button>
        </div>
        
        <Text variant="desc">
          {currentMode === 'hover' && 'Hover over the image to see the Ken Burns effect. The image will scale and pan slowly.'}
          {currentMode === 'autoplay' && 'The image automatically cycles through different pan directions with crossfade transitions.'}
          {currentMode === 'slideshow' && 'Multiple images cycle automatically with Ken Burns effects on each image.'}
        </Text>
      </Card>

      {/* Main Demo */}
      <Card title={`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode Demo`} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <KenBurnsImage
            src={currentMode !== 'slideshow' ? DEMO_IMAGES[0] : undefined}
            images={currentMode === 'slideshow' ? selectedImages : []}
            mode={currentMode}
            width="400px"
            height="300px"
            borderRadius="12px"
            hoverDuration={6000}
            autoplayDuration={8000}
            slideshowDuration={5000}
            crossfadeDuration={1000}
            hoverScale={1.1}
            autoplayScale={1.15}
            slideshowScale={1.2}
            enableReorder={currentMode === 'slideshow'}
            onImageChange={handleImageChange}
            alt="Ken Burns Demo Image"
          />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Text variant="desc">
            {currentMode === 'hover' && 'Move your mouse over the image to trigger the effect'}
            {currentMode === 'autoplay' && 'Watch as the image automatically pans and zooms in different directions'}
            {currentMode === 'slideshow' && 'Multiple images with individual Ken Burns effects and navigation dots'}
          </Text>
        </div>
      </Card>

      {/* Different Configurations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Small Hover Example */}
        <Card title="Small Hover Effect" desc="Quick hover effect for thumbnails">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KenBurnsImage
              src={DEMO_IMAGES[1]}
              mode="hover"
              width="200px"
              height="150px"
              borderRadius="8px"
              hoverDuration={3000}
              hoverScale={1.08}
              alt="Small hover demo"
            />
          </div>
        </Card>

        {/* Fast Autoplay Example */}
        <Card title="Fast Autoplay" desc="Quick cycling for dynamic content">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KenBurnsImage
              src={DEMO_IMAGES[2]}
              mode="autoplay"
              width="200px"
              height="150px"
              borderRadius="8px"
              autoplayDuration={4000}
              autoplayScale={1.12}
              crossfadeDuration={800}
              alt="Fast autoplay demo"
            />
          </div>
        </Card>

        {/* Mini Slideshow Example */}
        <Card title="Mini Slideshow" desc="Compact slideshow with controls">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KenBurnsImage
              images={DEMO_IMAGES.slice(0, 3)}
              mode="slideshow"
              width="200px"
              height="150px"
              borderRadius="8px"
              slideshowDuration={4000}
              slideshowScale={1.15}
              enableReorder={true}
              alt="Mini slideshow demo"
            />
          </div>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card title="Usage Examples" separator>
        <Text variant="h3">Basic Hover Effect</Text>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px', 
          overflow: 'auto',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
{`<KenBurnsImage
  src="/path/to/image.jpg"
  mode="hover"
  width="300px"
  height="200px"
  hoverDuration={8000}
  hoverScale={1.1}
/>`}
        </pre>

        <Text variant="h3">Autoplay Loop</Text>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px', 
          overflow: 'auto',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
{`<KenBurnsImage
  src="/path/to/image.jpg"
  mode="autoplay"
  autoplayDuration={10000}
  autoplayScale={1.15}
  crossfadeDuration={1000}
/>`}
        </pre>

        <Text variant="h3">Multi-Image Slideshow</Text>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px', 
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`<KenBurnsImage
  images={['/img1.jpg', '/img2.jpg', '/img3.jpg']}
  mode="slideshow"
  slideshowDuration={10000}
  slideshowScale={1.2}
  enableReorder={true}
          onImageChange={(index, src) => {}}
/>`}
        </pre>
      </Card>

      {/* Performance Notes */}
      <Card title="Performance Features" separator>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>GPU Acceleration:</strong> Uses <code>transform</code> instead of position changes</li>
          <li><strong>Intersection Observer:</strong> Pauses animations when components are off-screen</li>
          <li><strong>Reduced Motion:</strong> Respects <code>prefers-reduced-motion</code> accessibility setting</li>
          <li><strong>Lazy Loading:</strong> Images use <code>loading="lazy"</code> attribute</li>
          <li><strong>Will-Change:</strong> Optimizes transform animations</li>
          <li><strong>Efficient Timers:</strong> Cleans up timeouts and intervals properly</li>
        </ul>
      </Card>
    </div>
  );
};

export default KenBurnsDemo; 