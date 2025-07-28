import React, { useState } from 'react';
import './ClassicWiiDock.css';

const WiiDock = ({ dockSettings = {}, onContextMenu, onAccessoryButtonContextMenu, onAccessoryButtonClick, onButtonClick, onButtonContextMenu, buttonConfigs = {}, accessoryButtonConfig = {} }) => {
  const [activeButton, setActiveButton] = useState(null);

  // Default colors
  const colors = {
    dockBaseGradientStart: dockSettings.dockBaseGradientStart || '#BDBEC2',
    dockBaseGradientEnd: dockSettings.dockBaseGradientEnd || '#DADDE6',
    dockAccentColor: dockSettings.dockAccentColor || '#33BEED',
    sdCardBodyColor: dockSettings.sdCardBodyColor || '#B9E1F2',
    sdCardBorderColor: dockSettings.sdCardBorderColor || '#33BEED',
    sdCardLabelColor: dockSettings.sdCardLabelColor || 'white',
    sdCardLabelBorderColor: dockSettings.sdCardLabelBorderColor || '#F4F0EE',
    sdCardBottomColor: dockSettings.sdCardBottomColor || '#31BEED',
    leftPodBaseColor: dockSettings.leftPodBaseColor || '#D2D3DA',
    leftPodAccentColor: dockSettings.leftPodAccentColor || '#B6B6BB',
    leftPodDetailColor: dockSettings.leftPodDetailColor || '#D7D8DA',
    rightPodBaseColor: dockSettings.rightPodBaseColor || '#DCDCDF',
    rightPodAccentColor: dockSettings.rightPodAccentColor || '#E4E4E4',
    rightPodDetailColor: dockSettings.rightPodDetailColor || '#B6B6BB',
    buttonBorderColor: dockSettings.buttonBorderColor || '#22BEF3',
    buttonGradientStart: dockSettings.buttonGradientStart || '#E0DCDC',
    buttonGradientEnd: dockSettings.buttonGradientEnd || '#CBCBCB',
    buttonIconColor: dockSettings.buttonIconColor || '#979796',
    rightButtonIconColor: dockSettings.rightButtonIconColor || '#A4A4A4',
    buttonHighlightColor: dockSettings.buttonHighlightColor || '#E4E4E4',
  };

  // Glass effect settings
  const glassEnabled = dockSettings.glassEnabled || false;
  const glassOpacity = dockSettings.glassOpacity || 0.18;
  const glassBlur = dockSettings.glassBlur || 2.5;
  const glassBorderOpacity = dockSettings.glassBorderOpacity || 0.5;
  const glassShineOpacity = dockSettings.glassShineOpacity || 0.7;

  // SD Card icon
  const sdCardIcon = dockSettings.sdCardIcon || 'default';

  // Size settings
  const dockScale = dockSettings.dockScale || 1.0;
  const buttonSize = dockSettings.buttonSize || 1.0;
  const sdCardSize = dockSettings.sdCardSize || 1.0;

  // Glass effect styles
  const glassStyles = glassEnabled ? {
    background: `rgba(255, 255, 255, ${glassOpacity})`,
    backdropFilter: `blur(${glassBlur}px)`,
    border: `1px solid rgba(255, 255, 255, ${glassBorderOpacity})`,
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1)`,
  } : {};

  const styles = {
    'left-button': {
      background: `radial-gradient(circle at 25% 25%, ${colors.buttonGradientStart}, ${colors.buttonGradientEnd})`,
      borderColor: colors.buttonBorderColor,
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
      ...(glassEnabled && {
        background: `rgba(255, 255, 255, ${glassOpacity * 0.8})`,
        backdropFilter: `blur(${glassBlur}px)`,
        border: `1px solid rgba(255, 255, 255, ${glassBorderOpacity})`,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
      })
    },
    'right-button': {
      background: `radial-gradient(circle at 75% 75%, ${colors.buttonGradientStart}, ${colors.buttonGradientEnd})`,
      borderColor: colors.buttonBorderColor,
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
      ...(glassEnabled && {
        background: `rgba(255, 255, 255, ${glassOpacity * 0.8})`,
        backdropFilter: `blur(${glassBlur}px)`,
        border: `1px solid rgba(255, 255, 255, ${glassBorderOpacity})`,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
      })
    }
  };



  const handleContextMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  const handleAccessoryButtonContextMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onAccessoryButtonContextMenu) {
      onAccessoryButtonContextMenu(e);
    }
  };

  return (
    <div className="wii-dock-container" onContextMenu={handleContextMenu}>
      <div 
        id="dock-container" 
        className="wii-dock-base"
        style={{
          transform: `scaleY(${dockScale})`,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Base SVG for the main dock structure */}
        <svg 
          viewBox="0 0 3835 603" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="wii-dock-svg"
          style={glassStyles}
        >
          <path 
            d="M3250.95 6.01362H3834.8L3834 602.014H0.803711L0 6.01362H583.855C690.36 6.01363 802.317 2.77875 934.804 96.0136C1075.21 194.822 1172.91 239.514 1303.88 239.514H2530.92C2661.89 239.514 2759.59 194.822 2900 96.0136C3032.49 2.77875 3144.44 6.01363 3250.95 6.01362Z" 
            fill="url(#paint0_linear_wii_dock)"
          />
          <path 
            d="M3250.95 0.0136698H3834.8V12.0137H3250.95C3144.47 12.0137 3034.26 8.86902 2903.45 100.92C2762.62 200.025 2663.7 245.514 2530.92 245.514H1303.88C1171.11 245.514 1072.18 200.025 931.351 100.92C808.722 14.6222 704.191 11.9926 603.868 12.001L0 12.0137V0.0136698H583.855C690.386 0.0136816 804.088 -3.3121 938.257 91.1064C1078.24 189.618 1174.71 233.514 1303.88 233.514H2530.92C2660.09 233.514 2756.56 189.618 2896.55 91.1064C3030.72 -3.3121 3144.42 0.0136816 3250.95 0.0136698Z" 
            fill={colors.dockAccentColor}
          />
          <defs>
            <linearGradient id="paint0_linear_wii_dock" x1="1917.4" y1="6" x2="1917.4" y2="602.014" gradientUnits="userSpaceOnUse">
              <stop stopColor={colors.dockBaseGradientStart}/>
              <stop offset="1" stopColor={colors.dockBaseGradientEnd}/>
            </linearGradient>
          </defs>
        </svg>

        {/* Accessory Button - positioned absolutely */}
        <div 
          className="wii-accessory-button wii-accessory-button-clickable" 
          onContextMenu={handleAccessoryButtonContextMenu}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onAccessoryButtonClick) {
              onAccessoryButtonClick();
            }
          }}
          style={{
            transform: `scale(${sdCardSize})`,
            transformOrigin: 'center',
          }}
        >
          {accessoryButtonConfig?.icon ? (
            <img 
              src={accessoryButtonConfig.icon} 
              alt="Accessory button icon" 
              className="wii-accessory-button-custom-icon"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          ) : (
            <svg viewBox="0 0 147 198" fill="none" xmlns="http://www.w3.org/2000/svg" className="wii-accessory-button-svg">
              <path d="M0 12C0 5.37258 5.37258 0 12 0H116.327C119.629 0 122.785 1.36025 125.052 3.76052L143.724 23.5315C145.828 25.759 147 28.707 147 31.7709V186C147 192.627 141.627 198 135 198H12C5.37259 198 0 192.627 0 186V12Z" fill={colors.sdCardBodyColor}/>
              <path d="M0 186V12C1.93277e-07 5.37258 5.37258 4.83208e-08 12 0H116.327C119.629 0 122.785 1.36048 125.052 3.76074L143.725 23.5312C145.828 25.7587 147 28.7067 147 31.7705V186C147 192.627 141.627 198 135 198V191C137.761 191 140 188.761 140 186V31.7705C140 30.494 139.511 29.2659 138.635 28.3379L119.963 8.56641C119.018 7.56633 117.703 7 116.327 7H12C9.23858 7 7 9.23858 7 12V186C7 188.761 9.23858 191 12 191V198C5.47609 198 0.168106 192.794 0.00390625 186.31L0 186ZM135 191V198H12V191H135Z" fill={colors.sdCardBorderColor}/>
              <path d="M19 36C19 34.3431 20.3431 33 22 33H124C125.657 33 127 34.3431 127 36V149C127 150.657 125.657 152 124 152H22C20.3431 152 19 150.657 19 149V36Z" fill={colors.sdCardLabelColor}/>
              <path d="M124 149V152H22V149H124ZM124 36H22V152C20.3949 152 19.0842 150.739 19.0039 149.154L19 149V36C19 34.3431 20.3431 33 22 33H124L124.154 33.0039C125.739 33.0842 127 34.3949 127 36V149C127 150.605 125.739 151.916 124.154 151.996L124 152V36Z" fill={colors.sdCardLabelBorderColor}/>
              <path d="M19 160C19 158.343 20.3431 157 22 157H124C125.657 157 127 158.343 127 160V178C127 179.657 125.657 181 124 181H22C20.3431 181 19 179.657 19 178V160Z" fill={colors.sdCardBottomColor}/>
              <path d="M23 109L26 99H47.5C51.5 99 51.0818 96.3852 48 96C43 95.375 38.711 93.0944 36.5 91.5C34 89.6972 32.5 87.5 32.5 85C32.5 82.5 36.9 77 48.5 77H73.5L71.5 83H47.5C44 83 43 85 46.5 86.5C50 88 67 92 67 100C67 106.4 60 108.667 56.5 109H23Z" fill={colors.sdCardBorderColor}/>
              <path d="M71 108.5L75 96.5C92.5 95.5 93.5 92.5 95 91.5C96.2 90.7 95.8333 88.1667 95.5 87L114 82C116.667 83.8333 122 88 122 90C122 92.5 122.5 98.5 106 104.5C92.8 109.3 77.1667 109.167 71 108.5Z" fill={colors.sdCardBorderColor}/>
              <path d="M110.5 80C105.781 81.5909 99.7536 84.0159 95 85.5C94.8651 85.1501 93.6349 84.3499 93.5 84C97.6595 82.0753 101.341 79.9226 105.5 78L110.5 80Z" fill={colors.sdCardBorderColor}/>
              <path d="M98 77L89.5 83.5L78 82.5L82 77H98Z" fill={colors.sdCardBorderColor}/>
            </svg>
          )}
        </div>
        
        {/* Left Button Pod and Button */}
        <div className="wii-left-pod">
          <svg viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg" className={`wii-pod-svg`}>
              <path d="M0 17H418C418 17 800 34.5 800 232.5C800 430.5 418 448 418 448H0V17Z" fill={colors.leftPodBaseColor}/>
              <path d="M788.5 233.5C788.5 139.043 742.29 88.0691 696.149 60.4414C672.963 46.5581 649.728 38.5499 632.263 34.0166C623.54 31.7526 616.285 30.3627 611.232 29.541C608.707 29.1303 606.735 28.8617 605.407 28.6973C604.744 28.6151 604.242 28.5594 603.913 28.5244C603.82 28.5145 603.74 28.5066 603.675 28.5H0.5V17.5H604.196L604.442 17.5225L603.949 23C604.433 17.6163 604.445 17.5237 604.449 17.5225C604.452 17.5227 604.457 17.523 604.462 17.5234C604.471 17.5243 604.483 17.526 604.498 17.5273C604.528 17.5302 604.571 17.5339 604.624 17.5391C604.73 17.5495 604.881 17.5652 605.076 17.5859C605.466 17.6274 606.031 17.691 606.76 17.7812C608.216 17.9617 610.327 18.2492 612.998 18.6836C618.339 19.5522 625.932 21.0086 635.026 23.3691C653.195 28.0849 677.473 36.438 701.8 51.0039C750.685 80.2748 799.5 134.551 799.5 233.5C799.5 332.449 750.685 386.725 701.8 415.996C677.473 430.562 653.195 438.915 635.026 443.631C625.932 445.991 618.339 447.448 612.998 448.316C610.327 448.751 608.216 449.038 606.76 449.219C606.031 449.309 605.466 449.373 605.076 449.414C604.881 449.435 604.73 449.451 604.624 449.461C604.571 449.466 604.528 449.47 604.498 449.473C604.483 449.474 604.471 449.476 604.462 449.477C604.457 449.477 604.452 449.477 604.449 449.478C604.445 449.476 604.433 449.384 603.949 444L604.442 449.478L604.196 449.5H0.5V438.5H603.675C603.74 438.493 603.82 438.486 603.913 438.476C604.242 438.441 604.744 438.385 605.407 438.303C606.735 438.138 608.707 437.87 611.232 437.459C616.285 436.637 623.54 435.247 632.263 432.983C649.728 428.45 672.963 420.442 696.149 406.559C742.29 378.931 788.5 327.957 788.5 233.5Z" fill={colors.leftPodAccentColor}/>
              <path d="M757.5 218.317C757.5 174.355 746.315 141.313 729.783 116.396C713.225 91.4392 691.101 74.333 668.81 62.6045C646.502 50.8674 624.134 44.5743 607.302 41.2227C598.898 39.5493 591.907 38.6161 587.038 38.1016C584.605 37.8444 582.704 37.6919 581.425 37.6045C580.786 37.5608 580.302 37.5329 579.985 37.5166C579.827 37.5085 579.709 37.5032 579.636 37.5H0V26.5H579.84L579.938 26.5039L579.742 32C579.938 26.5035 579.941 26.5038 579.945 26.5039C579.948 26.504 579.952 26.5038 579.956 26.5039C579.965 26.5042 579.978 26.5053 579.992 26.5059C580.021 26.507 580.062 26.5085 580.113 26.5107C580.216 26.5152 580.362 26.5216 580.55 26.5312C580.926 26.5506 581.472 26.5819 582.175 26.6299C583.58 26.7259 585.617 26.8897 588.194 27.1621C593.348 27.7067 600.674 28.687 609.45 30.4346C626.979 33.9249 650.425 40.501 673.932 52.8691C697.455 65.246 721.147 83.4818 738.949 110.314C756.779 137.187 768.5 172.384 768.5 218.317C768.5 310.596 720.625 361.154 672.862 388.359C649.087 401.902 625.364 409.666 607.617 414.048C598.733 416.241 591.317 417.594 586.101 418.401C583.492 418.805 581.431 419.073 580.009 419.24C579.298 419.324 578.747 419.382 578.366 419.421C578.176 419.44 578.028 419.454 577.925 419.464C577.873 419.469 577.832 419.473 577.803 419.476L577.756 419.479C577.752 419.48 577.748 419.48 577.279 414L577.748 419.479L577.515 419.5H0.4844V408.5H577.021C577.086 408.494 577.165 408.486 577.259 408.477C577.581 408.444 578.073 408.392 578.722 408.315C580.02 408.162 581.95 407.912 584.419 407.53C589.359 406.766 596.453 405.474 604.979 403.368C622.056 399.152 644.764 391.706 667.418 378.802C712.516 353.114 757.5 305.83 757.5 218.317Z" fill={colors.leftPodDetailColor}/>
          </svg>
          
          <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton('left');
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton(null);
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton(null);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onButtonClick) {
                  onButtonClick(0); // Left button index
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onButtonContextMenu) {
                  onButtonContextMenu(0, e); // Left button index
                }
              }}
              className="wii-left-button wii-button-animation"
              style={{
                ...styles['left-button'],
                transform: `scale(${buttonSize})`,
                transformOrigin: 'center',
              }}
          >
              <div className="wii-button-content">
                  <div className="wii-button-icon">
                      <svg viewBox="0 0 176 80" className="wii-icon-svg">
                          <path d="M32.949 43.142L47.711 6.407C49.083 2.992 52.397 0.757 56.077 0.763C59.758 0.769 63.064 3.016 64.425 6.436L79.381 44.029L92.147 1.021L111.663 0.763L89.02 73.671C87.888 77.313 84.584 79.846 80.773 79.993C76.963 80.141 73.472 77.871 72.063 74.327L56.02 34.005L40.547 72.514C39.141 76.012 35.704 78.263 31.936 78.154C28.167 78.045 24.866 75.598 23.665 72.024L0 1.021L18.647 0.763L32.949 43.142Z" fill={colors.buttonIconColor}/>
                          <path d="M119.063 26H134.063V80H119.063V26Z" fill={colors.buttonIconColor}/>
                          <path d="M151.063 26H166.063V80H151.063V26Z" fill={colors.buttonIconColor}/>
                          <circle cx="126.063" cy="8" r="10" fill={colors.buttonIconColor}/>
                          <circle cx="158.063" cy="8" r="10" fill={colors.buttonIconColor}/>
                      </svg>
                  </div>
                  <div className="wii-button-highlight">
                     <svg viewBox="0 0 352 352" className="wii-highlight-svg">
                          <path 
                              d="M258.5 23.2214C281.296 59.121 230 119.721 194.5 153.221C159 186.721 100.802 240.222 66 196.721C29.29 150.837 46.354 49.575 102.302 14.0482C158.249 -21.4785 235.703 -12.6783 258.5 23.2214Z" 
                              fill={colors.buttonHighlightColor} 
                              fillOpacity={glassEnabled ? glassShineOpacity : 0.4} 
                          />
                     </svg>
                  </div>
              </div>
          </button>
        </div>

        {/* Right Button Pod and Button */}
        <div className="wii-right-pod">
          <svg viewBox="0 0 800 449" fill="none" xmlns="http://www.w3.org/2000/svg" className={`wii-pod-svg`}>
              <path d="M800 17H192C192 17 0 34.5 0 232.5C0 430.5 192 448 192 448H800L800 17Z" fill={colors.rightPodBaseColor}/>
              <path d="M24.5 221C24.5 134.852 70.9101 88.2213 117.626 62.835C141.075 50.0924 164.581 42.7379 182.261 38.5732C191.089 36.4937 198.435 35.2164 203.553 34.4609C206.111 34.0833 208.111 33.836 209.458 33.6846C210.132 33.6089 210.642 33.5578 210.978 33.5254C211.085 33.5151 211.174 33.5065 211.245 33.5H800V22.5H210.776L210.553 22.5186L211 28C210.563 22.6474 210.55 22.5212 210.546 22.5186C210.544 22.5187 210.539 22.5192 210.534 22.5195C210.525 22.5203 210.513 22.5212 210.498 22.5225C210.468 22.525 210.426 22.5285 210.373 22.5332C210.267 22.5426 210.116 22.5573 209.921 22.5762C209.53 22.6139 208.962 22.6716 208.229 22.7539C206.764 22.9186 204.639 23.1818 201.947 23.5791C196.565 24.3735 188.911 25.7058 179.739 27.8662C161.419 32.1817 136.925 39.8285 112.374 53.1699C63.09 79.9518 13.5 129.821 13.5 221C13.5 312.179 63.09 362.048 112.374 388.83C136.925 402.172 161.419 409.818 179.739 414.134C188.911 416.294 196.565 417.627 201.947 418.421C204.639 418.818 206.764 419.081 208.229 419.246C208.962 419.328 209.53 419.386 209.921 419.424C210.116 419.443 210.267 419.457 210.373 419.467C210.426 419.471 210.468 419.475 210.498 419.478C210.513 419.479 210.525 419.48 210.534 419.48C210.539 419.481 210.544 419.481 210.546 419.481C210.55 419.479 210.563 419.353 211 414L210.553 419.481L210.776 419.5H800V408.5H211.245C211.174 408.493 211.085 408.485 210.978 408.475C210.642 408.442 210.132 408.391 209.458 408.315C208.111 408.164 206.111 407.917 203.553 407.539C198.435 406.784 191.089 405.506 182.261 403.427C164.581 399.262 141.075 391.908 117.626 379.165C70.9101 353.779 24.5 307.148 24.5 221Z" fill={colors.rightPodAccentColor}/>
              <path d="M13.5 231.5C13.5 137.408 58.868 86.7377 104.099 59.2793C126.854 45.4653 149.664 37.4923 166.816 32.9785C175.381 30.7247 182.502 29.342 187.455 28.5254C189.93 28.1173 191.861 27.8512 193.156 27.6885C193.804 27.6071 194.293 27.5519 194.611 27.5176C194.674 27.5108 194.731 27.5052 194.78 27.5H800V14.5H194.156L193.861 14.5273L194.452 21C193.862 14.5269 193.857 14.5269 193.853 14.5273C193.85 14.5276 193.845 14.5288 193.84 14.5293C193.83 14.5302 193.817 14.5308 193.802 14.5322C193.77 14.5352 193.727 14.5396 193.673 14.5449C193.565 14.5556 193.412 14.5717 193.217 14.5928C192.826 14.635 192.262 14.699 191.537 14.79C190.087 14.9722 187.99 15.2622 185.34 15.6992C180.041 16.5729 172.517 18.0365 163.508 20.4072C145.513 25.1425 121.46 33.5309 97.3525 48.166C48.8574 77.6061 0.5 132.186 0.5 231.5C0.5 330.814 48.8574 385.394 97.3525 414.834C121.46 429.469 145.513 437.857 163.508 442.593C172.517 444.964 180.041 446.427 185.34 447.301C187.99 447.738 190.087 448.028 191.537 448.21C192.262 448.301 192.826 448.365 193.217 448.407C193.412 448.428 193.565 448.444 193.673 448.455C193.727 448.46 193.77 448.465 193.802 448.468C193.817 448.469 193.83 448.47 193.84 448.471C193.845 448.471 193.85 448.472 193.853 448.473C193.857 448.473 193.862 448.473 194.452 442L193.861 448.473L194.156 448.5H800V435.5H194.78C194.731 435.495 194.674 435.489 194.611 435.482C194.293 435.448 193.804 435.393 193.156 435.312C191.861 435.149 189.93 434.883 187.455 434.475C182.502 433.658 175.381 432.275 166.816 430.021C149.664 425.508 126.854 417.535 104.099 403.721C58.868 376.262 13.5 325.592 13.5 231.5Z" fill={colors.rightPodDetailColor}/>
          </svg>
          <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton('right');
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton(null);
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveButton(null);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onButtonClick) {
                  onButtonClick(1); // Right button index
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onButtonContextMenu) {
                  onButtonContextMenu(1, e); // Right button index
                }
              }}
              className="wii-right-button wii-button-animation"
              style={{
                ...styles['right-button'],
                transform: `scale(${buttonSize})`,
                transformOrigin: 'center',
              }}
          >
                      <div className="wii-button-content">
                          <div className="wii-button-icon">
                              <svg viewBox="0 0 191 128" className="wii-icon-svg">
                                  <path d="M96.9788 90.094L191 42.125V124C191 126.209 189.209 128 187 128H4C1.79086 128 0 126.209 0 124V41.082L96.9788 90.094Z" fill={colors.rightButtonIconColor}/>
                                  <path d="M187 0C189.209 0 191 1.79086 191 4V21.915L96.9788 69.905L0 20.917V4C0 1.79086 1.79086 0 4 0H187Z" fill={colors.rightButtonIconColor}/>
                              </svg>
                          </div>
                          <div className="wii-button-highlight">
                             <svg viewBox="0 0 352 352" className="wii-highlight-svg">
                                  <path 
                                      d="M244.083 87.2214C266.879 123.121 215.583 183.721 180.083 217.221C144.583 250.721 86.385 304.222 51.5833 260.721C14.8736 214.837 31.9376 113.575 87.8851 78.0482C143.833 42.5215 221.287 51.3217 244.083 87.2214Z" 
                                      fill={colors.buttonHighlightColor} 
                                      fillOpacity={glassEnabled ? glassShineOpacity : 0.4} 
                                  />
                             </svg>
                          </div>
                      </div>
                  </button>
        </div>
      </div>
    </div>
  );
};

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
  openPresetsModal,
  dockSettings,
  onDockContextMenu,
  onAccessoryButtonContextMenu,
  onAccessoryButtonClick,
  accessoryButtonConfig
}) => {
  return (
    <div className="wii-dock-wrapper">
      <WiiDock 
        dockSettings={dockSettings} 
        onContextMenu={onDockContextMenu}
        onAccessoryButtonContextMenu={onAccessoryButtonContextMenu}
        onAccessoryButtonClick={onAccessoryButtonClick}
        onButtonClick={onButtonClick}
        onButtonContextMenu={onButtonContextMenu}
        buttonConfigs={buttonConfigs}
        accessoryButtonConfig={accessoryButtonConfig}
      />
    </div>
  );
};

export default ClassicWiiDock; 