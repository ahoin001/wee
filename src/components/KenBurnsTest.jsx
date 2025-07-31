import React from 'react';
import KenBurnsImage from './KenBurnsImage';

// Simple test component to verify Ken Burns functionality
const KenBurnsTest = () => {
  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>Ken Burns Effect Test</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Hover Mode Test */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Hover Mode</h3>
          <p>Hover over the image to see the Ken Burns effect</p>
          <KenBurnsImage
            src="https://picsum.photos/400/300?random=1"
            mode="hover"
            width="100%"
            height="200px"
            borderRadius="8px"
            hoverDuration={4000}
            hoverScale={1.15}
            alt="Hover test image"
          />
        </div>

        {/* Autoplay Mode Test */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Autoplay Mode</h3>
          <p>Automatically cycles through different pan directions</p>
          <KenBurnsImage
            src="https://picsum.photos/400/300?random=2"
            mode="autoplay"
            width="100%"
            height="200px"
            borderRadius="8px"
            autoplayDuration={6000}
            autoplayScale={1.2}
            crossfadeDuration={1000}
            alt="Autoplay test image"
          />
        </div>

        {/* Slideshow Mode Test */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Slideshow Mode</h3>
          <p>Multiple images with navigation dots</p>
          <KenBurnsImage
            images={[
              'https://picsum.photos/400/300?random=3',
              'https://picsum.photos/400/300?random=4',
              'https://picsum.photos/400/300?random=5'
            ]}
            mode="slideshow"
            width="100%"
            height="200px"
            borderRadius="8px"
            slideshowDuration={4000}
            slideshowScale={1.15}
            crossfadeDuration={800}
            enableReorder={true}
            alt="Slideshow test images"
            onImageChange={(index, src) => {}}
          />
        </div>

        {/* Small Hover Example */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Small Hover</h3>
          <p>Quick hover effect for thumbnails</p>
          <KenBurnsImage
            src="https://picsum.photos/400/300?random=6"
            mode="hover"
            width="150px"
            height="100px"
            borderRadius="6px"
            hoverDuration={2000}
            hoverScale={1.08}
            alt="Small hover test"
          />
        </div>

        {/* No Image Test */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>No Image</h3>
          <p>Placeholder state when no image is provided</p>
          <KenBurnsImage
            mode="hover"
            width="100%"
            height="200px"
            borderRadius="8px"
            alt="No image test"
          />
        </div>

        {/* Performance Test */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Performance Mode</h3>
          <p>Reduced animation complexity</p>
          <div className="ken-burns-performance-mode">
            <KenBurnsImage
              src="https://picsum.photos/400/300?random=7"
              mode="hover"
              width="100%"
              height="200px"
              borderRadius="8px"
              hoverDuration={3000}
              hoverScale={1.05}
              alt="Performance test image"
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Note:</strong> Open browser developer tools to see console logs for slideshow image changes.</p>
        <p><strong>Performance:</strong> Ken Burns effects are GPU-accelerated and respect prefers-reduced-motion settings.</p>
      </div>
    </div>
  );
};

export default KenBurnsTest; 