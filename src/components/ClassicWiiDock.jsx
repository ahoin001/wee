import React, { useState, useEffect } from 'react';
import intervalManager from '../utils/IntervalManager.js';
import './ClassicWiiDock.css';

const ClassicWiiDock = ({
  onSettingsClick,
  onSettingsChange,
  buttonConfigs,
  onButtonContextMenu,
  onButtonClick,
  timeColor,
  timeFormat24hr,
  timeFont,
  ribbonGlowColor,
  showPresetsButton,
  presetsButtonConfig,
  openPresetsModal
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeButton, setActiveButton] = useState(null); // 'left', 'right', or null

  // Initial styles for the refactored buttons
  const [customStyles, setCustomStyles] = useState({
    'left-button': {
      background: 'radial-gradient(circle at 25% 25%, #E0DCDC, #CBCBCB)',
      borderColor: '#22BEF3',
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
    },
    'right-button': {
      background: 'radial-gradient(circle at 75% 75%, #E0DCDC, #CBCBCB)',
      borderColor: '#22BEF3',
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
    }
  });

  // Hardcoded to true as the toggle UI is removed
  const animationsOn = true;

  useEffect(() => {
    const taskId = intervalManager.addTask(() => {
      setCurrentTime(new Date());
    }, 1000, 'classic-time-update');

    return () => intervalManager.removeTask(taskId);
  }, []);

  const formatTime = (date) => {
    if (timeFormat24hr) {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen relative w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <section className="w-full max-w-5xl">
        <div id="dock-container" className="relative w-full mx-auto">
          
          {/* Base SVG for the main dock structure */}
          <svg viewBox="0 0 3835 603" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-lg">
            <path 
              d="M3250.95 6.01362H3834.8L3834 602.014H0.803711L0 6.01362H583.855C690.36 6.01363 802.317 2.77875 934.804 96.0136C1075.21 194.822 1172.91 239.514 1303.88 239.514H2530.92C2661.89 239.514 2759.59 194.822 2900 96.0136C3032.49 2.77875 3144.44 6.01363 3250.95 6.01362Z" 
              fill="url(#paint0_linear_wii_dock)"
            />
            <path 
              d="M3250.95 0.0136698H3834.8V12.0137H3250.95C3144.47 12.0137 3034.26 8.86902 2903.45 100.92C2762.62 200.025 2663.7 245.514 2530.92 245.514H1303.88C1171.11 245.514 1072.18 200.025 931.351 100.92C808.722 14.6222 704.191 11.9926 603.868 12.001L0 12.0137V0.0136698H583.855C690.386 0.0136816 804.088 -3.3121 938.257 91.1064C1078.24 189.618 1174.71 233.514 1303.88 233.514H2530.92C2660.09 233.514 2756.56 189.618 2896.55 91.1064C3030.72 -3.3121 3144.42 0.0136816 3250.95 0.0136698Z" 
              fill="#33BEED"
            />
            <defs>
              <linearGradient id="paint0_linear_wii_dock" x1="1917.4" y1="6" x2="1917.4" y2="602.014" gradientUnits="userSpaceOnUse">
                <stop stopColor="#BDBEC2"/>
                <stop offset="1" stopColor="#DADDE6"/>
              </linearGradient>
            </defs>
          </svg>

          {/* Overlaid SVG elements, positioned absolutely */}
          {/* <div className="absolute top-[43.12%] left-[18.51%] w-[3.83%]">
            <svg viewBox="0 0 147 198" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 12C0 5.37258 5.37258 0 12 0H116.327C119.629 0 122.785 1.36025 125.052 3.76052L143.724 23.5315C145.828 25.759 147 28.707 147 31.7709V186C147 192.627 141.627 198 135 198H12C5.37259 198 0 192.627 0 186V12Z" fill="#B9E1F2"/>
              <path d="M0 186V12C1.93277e-07 5.37258 5.37258 4.83208e-08 12 0H116.327C119.629 0 122.785 1.36048 125.052 3.76074L143.725 23.5312C145.828 25.7587 147 28.7067 147 31.7705V186C147 192.627 141.627 198 135 198V191C137.761 191 140 188.761 140 186V31.7705C140 30.494 139.511 29.2659 138.635 28.3379L119.963 8.56641C119.018 7.56633 117.703 7 116.327 7H12C9.23858 7 7 9.23858 7 12V186C7 188.761 9.23858 191 12 191V198C5.47609 198 0.168106 192.794 0.00390625 186.31L0 186ZM135 191V198H12V191H135Z" fill="#33BEED"/>
              <path d="M19 36C19 34.3431 20.3431 33 22 33H124C125.657 33 127 34.3431 127 36V149C127 150.657 125.657 152 124 152H22C20.3431 152 19 150.657 19 149V36Z" fill="white"/>
              <path d="M124 149V152H22V149H124ZM124 36H22V152C20.3949 152 19.0842 150.739 19.0039 149.154L19 149V36C19 34.3431 20.3431 33 22 33H124L124.154 33.0039C125.739 33.0842 127 34.3949 127 36V149C127 150.605 125.739 151.916 124.154 151.996L124 152V36Z" fill="#F4F0EE"/>
              <path d="M19 160C19 158.343 20.3431 157 22 157H124C125.657 157 127 158.343 127 160V178C127 179.657 125.657 181 124 181H22C20.3431 181 19 179.657 19 178V160Z" fill="#31BEED"/>
              <path d="M23 109L26 99H47.5C51.5 99 51.0818 96.3852 48 96C43 95.375 38.711 93.0944 36.5 91.5C34 89.6972 32.5 87.5 32.5 85C32.5 82.5 36.9 77 48.5 77H73.5L71.5 83H47.5C44 83 43 85 46.5 86.5C50 88 67 92 67 100C67 106.4 60 108.667 56.5 109H23Z" fill="#33BEED"/>
              <path d="M71 108.5L75 96.5C92.5 95.5 93.5 92.5 95 91.5C96.2 90.7 95.8333 88.1667 95.5 87L114 82C116.667 83.8333 122 88 122 90C122 92.5 122.5 98.5 106 104.5C92.8 109.3 77.1667 109.167 71 108.5Z" fill="#33BEED"/>
              <path d="M110.5 80C105.781 81.5909 99.7536 84.0159 95 85.5C94.8651 85.1501 93.6349 84.3499 93.5 84C97.6595 82.0753 101.341 79.9226 105.5 78L110.5 80Z" fill="#33BEED"/>
              <path d="M98 77L89.5 83.5L78 82.5L82 77H98Z" fill="#33BEED"/>
            </svg>
          </div> */}
          
          {/* Left Button Pod and Button */}
          

          {/* Right Button Pod and Button */}
         

          {/* Time Display */}
          {/* <div 
            className="absolute top-[43.12%] left-1/2 transform -translate-x-1/2 text-center"
            style={{ color: timeColor, fontFamily: timeFont }}
          >
            <div className="text-4xl font-bold">{formatTime(currentTime)}</div>
            <div className="text-lg mt-2">{formatDate(currentTime)}</div>
          </div> */}

          {/* Settings Button */}
          {/* <div 
            className="absolute top-[43.12%] left-[18.51%] w-[3.83%] cursor-pointer"
            onClick={onSettingsClick}
            title="Settings"
          /> */}

          {/* Presets Button */}
          {/* {showPresetsButton && (
            <div 
              className="absolute top-[43.12%] right-[18.51%] w-[3.83%] cursor-pointer"
              onClick={openPresetsModal}
              title={presetsButtonConfig?.name || 'Presets'}
            />
          )} */}

        </div>
      </section>
    </div>
  );
};

export default ClassicWiiDock; 