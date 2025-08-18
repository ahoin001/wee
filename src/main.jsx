import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('[DEBUG] 🚀 main.jsx: Starting React app initialization');

try {
  console.log('[DEBUG] 🔍 main.jsx: Looking for root element');
  const rootElement = document.getElementById('root');
  console.log('[DEBUG] 📍 main.jsx: Root element found:', rootElement ? 'yes' : 'no');
  
  if (rootElement) {
    console.log('[DEBUG] 🎨 main.jsx: Creating React root');
    const root = createRoot(rootElement);
    console.log('[DEBUG] 🎭 main.jsx: Rendering App component');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[DEBUG] ✅ main.jsx: App rendered successfully');
  } else {
    console.error('[DEBUG] ❌ main.jsx: Root element not found!');
  }
} catch (error) {
  console.error('[DEBUG] ❌ main.jsx: Error during app initialization:', error);
}
