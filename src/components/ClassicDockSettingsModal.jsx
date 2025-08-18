import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Slider from '../ui/Slider';
import Text from '../ui/Text';
import WToggle from '../ui/WToggle';
import SDCardiconModal from './SDCardiconModal';
import WSelect from '../ui/WSelect';
import { spacing } from '../ui/tokens';

import './SoundModal.css';

// Theme groups for collapsible organization
const THEME_GROUPS = {
  classic: {
    name: 'Classic & Modern Themes',
    description: 'Original Wii, gaming-inspired, and contemporary themes',
    themes: {
      default: {
        name: 'Default Wii',
        description: 'Classic Wii dock colors',
        colors: {
          dockBaseGradientStart: '#BDBEC2',
          dockBaseGradientEnd: '#DADDE6',
          dockAccentColor: '#33BEED',
          sdCardBodyColor: '#B9E1F2',
          sdCardBorderColor: '#33BEED',
          sdCardLabelColor: 'white',
          sdCardLabelBorderColor: '#F4F0EE',
          sdCardBottomColor: '#31BEED',
          leftPodBaseColor: '#D2D3DA',
          leftPodAccentColor: '#B6B6BB',
          leftPodDetailColor: '#D7D8DA',
          rightPodBaseColor: '#DCDCDF',
          rightPodAccentColor: '#E4E4E4',
          rightPodDetailColor: '#B6B6BB',
          buttonBorderColor: '#22BEF3',
          buttonGradientStart: '#E0DCDC',
          buttonGradientEnd: '#CBCBCB',
          buttonIconColor: '#979796',
          rightButtonIconColor: '#A4A4A4',
          buttonHighlightColor: 'rgba(255, 255, 255, 0.5)',
        }
      },
      chrome: {
        name: 'Monochrome',
        description: 'Monochrome effect',
        colors: {
          dockBaseGradientStart: '#e5e7eb',
          dockBaseGradientEnd: '#d1d5db',
          dockAccentColor: '#4b5563', 
          buttonBorderColor: '#6b7280', 
          buttonGradientStart: '#ffffff',
          buttonGradientEnd: '#f9fafb',
          buttonIconColor: '#1f2937',
          buttonHighlightColor: 'rgba(255, 255, 255, 0.6)',
          leftPodBaseColor: '#f3f4f6',
          leftPodAccentColor: '#5A5A82',
          leftPodDetailColor: '#424268',
          rightButtonIconColor: '#00FFFF',
          rightPodBaseColor: '#f9fafb',
          rightPodAccentColor: '#5A5A82',
          rightPodDetailColor: '#424268',
          sdCardBodyColor: '#f3f4f6',
          sdCardBorderColor: '#9ca3af',
          sdCardLabelColor: '#374151',
          sdCardLabelBorderColor: '#e5e7eb',
          sdCardBottomColor: '#6b7280',
        }
      },
      cyberpunk: {
        name: 'Cyberpunk',
        description: 'Cyberpunk esque effect',
        colors: {
          dockBaseGradientStart: '#2C2C40',
          dockBaseGradientEnd: '#1a1a2e',
          dockAccentColor: '#FF00FF',
          sdCardBodyColor: '#1a1a2e',
          sdCardBorderColor: '#00FFFF',
          sdCardLabelColor: '#00FFFF',
          sdCardLabelBorderColor: '#424268',
          sdCardBottomColor: '#00FFFF',
          leftPodBaseColor: '#33334F',
          leftPodAccentColor: '#5A5A82',
          leftPodDetailColor: '#424268',
          rightPodBaseColor: '#33334F',
          rightPodAccentColor: '#5A5A82',
          rightPodDetailColor: '#424268',
          buttonBorderColor: '#00FFFF',
          buttonGradientStart: '#1a1a2e',
          buttonGradientEnd: '#1a1a2e',
          buttonIconColor: '#00FFFF',
          rightButtonIconColor: '#00FFFF',
          buttonHighlightColor: 'rgba(255, 0, 255, 0.4)',
        }
      },
      dark: {
        name: 'Dark Mode',
        description: 'Modern dark theme',
        colors: {
          dockBaseGradientStart: 'rgba(10,10,10,255)',
          dockBaseGradientEnd: 'rgba(20,20,20,255)',
          dockAccentColor: 'rgba(51,185,234,255)',
          sdCardBodyColor: 'rgba(15,15,15,255)',
          sdCardBorderColor: 'rgba(51,185,234,255)',
          sdCardLabelColor: 'rgba(25,25,25,255)',
          sdCardLabelBorderColor: 'rgba(30,30,30,255)',
          sdCardBottomColor: 'rgba(51,185,234,255)',
          leftPodBaseColor: 'rgba(18,18,18,255)',
          leftPodAccentColor: 'rgba(25,25,25,255)',
          leftPodDetailColor: 'rgba(22,22,22,255)',
          rightPodBaseColor: 'rgba(18,18,18,255)',
          rightPodAccentColor: 'rgba(25,25,25,255)',
          rightPodDetailColor: 'rgba(22,22,22,255)',
          buttonBorderColor: 'rgba(51,185,234,255)',
          buttonGradientStart: 'rgba(33,33,33,255)',
          buttonGradientEnd: 'rgba(28,28,28,255)',
          buttonIconColor: 'rgba(38,39,38,255)',
          rightButtonIconColor: 'rgba(38,39,38,255)',
          buttonHighlightColor: 'rgba(51,185,234,255)',
        }
      },
      ice: {
        name: 'Frozen Ice',
        description: 'Cool ice theme',
        colors: {
          dockBaseGradientStart: '#0F172A',
          dockBaseGradientEnd: '#1E293B',
          dockAccentColor: '#38BDF8',
          sdCardBodyColor: '#1E293B',
          sdCardBorderColor: '#38BDF8',
          sdCardLabelColor: '#334155',
          sdCardLabelBorderColor: '#475569',
          sdCardBottomColor: '#38BDF8',
          leftPodBaseColor: '#1E293B',
          leftPodAccentColor: '#334155',
          leftPodDetailColor: '#475569',
          rightPodBaseColor: '#1E293B',
          rightPodAccentColor: '#334155',
          rightPodDetailColor: '#475569',
          buttonBorderColor: '#38BDF8',
          buttonGradientStart: '#334155',
          buttonGradientEnd: '#1E293B',
          buttonIconColor: '#0EA5E9',
          rightButtonIconColor: '#0EA5E9',
          buttonHighlightColor: '#38BDF8',
        }
      },
      retro: {
        name: 'Retro Gaming',
        description: 'Vintage gaming aesthetic',
        colors: {
          dockBaseGradientStart: '#2C1810',
          dockBaseGradientEnd: '#4A2C1A',
          dockAccentColor: '#FF6B35',
          sdCardBodyColor: '#3D2314',
          sdCardBorderColor: '#FF6B35',
          sdCardLabelColor: '#5A3A2A',
          sdCardLabelBorderColor: '#4A2C1A',
          sdCardBottomColor: '#FF6B35',
          leftPodBaseColor: '#3D2314',
          leftPodAccentColor: '#5A3A2A',
          leftPodDetailColor: '#4A2C1A',
          rightPodBaseColor: '#3D2314',
          rightPodAccentColor: '#5A3A2A',
          rightPodDetailColor: '#4A2C1A',
          buttonBorderColor: '#FF6B35',
          buttonGradientStart: '#5A3A2A',
          buttonGradientEnd: '#4A2C1A',
          buttonIconColor: '#FFD700',
          rightButtonIconColor: '#FFD700',
          buttonHighlightColor: '#FFD700',
        }
      },
    }
  },
  games: {
    name: 'Gamer Collection',
    description:'Some gamer type themes',
    themes: {
      kingdomHearts: {
        name: 'Kingdom Hearts',
        description: 'Kingdom Hearts franchise theme',
        colors: {
          dockBaseGradientStart: '#0f172a',
          dockBaseGradientEnd: '#020617',
          dockAccentColor: '#facc15',
          sdCardBodyColor: '#334155',
          sdCardBorderColor: '#facc15',
          sdCardLabelColor: '#fefce8',
          sdCardLabelBorderColor: '#64748b',
          sdCardBottomColor: '#ca8a04',
          leftPodBaseColor: '#1e293b',
          leftPodAccentColor: '#475569',
          leftPodDetailColor: '#334155',
          rightPodBaseColor: '#1e293b',
          rightPodAccentColor: '#475569',
          rightPodDetailColor: '#334155',
          buttonBorderColor: '#fde047',
          buttonGradientStart: '#475569',
          buttonGradientEnd: '#1e293b',
          buttonIconColor: '#fde047',
          rightButtonIconColor: '#fde047',
          buttonHighlightColor: 'rgba(250, 204, 21, 0.3)',
        }
      },
      metroid: {
        name: 'Metroid',
        description: 'Metroid Prime theme',
        colors: {
          dockBaseGradientStart: '#7f1d1d',
          dockBaseGradientEnd: '#450a0a',
          dockAccentColor: '#22c55e',
          sdCardBodyColor: '#dc2626',
          sdCardBorderColor: '#f97316',
          sdCardLabelColor: '#fef2f2',
          sdCardLabelBorderColor: '#fca5a5',
          sdCardBottomColor: '#4d7c0f',
          leftPodBaseColor: '#991b1b',
          leftPodAccentColor: '#E1BEE7',
          leftPodDetailColor: '#F1E8F6',
          rightPodBaseColor: '#991b1b',
          rightPodAccentColor: '#E1BEE7',
          rightPodDetailColor: '#F1E8F6',
          buttonBorderColor: '#f97316',
          buttonGradientStart: '#b91c1c',
          buttonGradientEnd: '#7f1d1d',
          buttonIconColor: '#fef2f2',
          rightButtonIconColor: '#9C7BB0',
          buttonHighlightColor: 'rgba(251, 146, 60, 0.4)',
        }
      },
      zelda: {
        name: 'Zelda Green',
        description: 'Zelda Green theme',
        colors: {
          dockBaseGradientStart: '#14532d',
          dockBaseGradientEnd: '#052e16',
          dockAccentColor: '#fde047',
          sdCardBodyColor: '#bbf7d0',
          sdCardBorderColor: '#ca8a04',
          sdCardLabelColor: '#14532d',
          sdCardLabelBorderColor: '#d9f99d',
          sdCardBottomColor: '#84cc16',
          leftPodBaseColor: '#4d7c0f',
          leftPodAccentColor: '#059669',
          leftPodDetailColor: '#065F46',
          rightPodBaseColor: '#4d7c0f',
          rightPodAccentColor: '#059669',
          rightPodDetailColor: '#065F46',
          buttonBorderColor: '#ca8a04',
          buttonGradientStart: '#fefce8',
          buttonGradientEnd: '#fef9c3',
          buttonIconColor: '#166534',
          rightButtonIconColor: '#34D399',
          buttonHighlightColor: 'rgba(254, 252, 232, 0.6)',
        }
      },
    }
  },
  pastel: {
    name: 'Soft Pastel Collection',
    description:'Gentle, soothing pastel themes',
    themes: {
      pastel: {
        name: 'Soft Pastel',
        description: 'Gentle pastel colors',
        colors: {
          dockBaseGradientStart: '#E8F4FD',
          dockBaseGradientEnd: '#F0F8FF',
          dockAccentColor: '#87CEEB',
          sdCardBodyColor: '#E6F3FF',
          sdCardBorderColor: '#87CEEB',
          sdCardLabelColor: '#F8FBFF',
          sdCardLabelBorderColor: '#E8F4FD',
          sdCardBottomColor: '#87CEEB',
          leftPodBaseColor: '#E8F4FD',
          leftPodAccentColor: '#D4E6F1',
          leftPodDetailColor: '#E6F3FF',
          rightPodBaseColor: '#E8F4FD',
          rightPodAccentColor: '#D4E6F1',
          rightPodDetailColor: '#E6F3FF',
          buttonBorderColor: '#87CEEB',
          buttonGradientStart: '#D4E6F1',
          buttonGradientEnd: '#C5D8E6',
          buttonIconColor: '#6B8E9E',
          rightButtonIconColor: '#6B8E9E',
          buttonHighlightColor: '#FFFFFF',
        }
      },
      pastelLavender: {
        name: 'Lavender Dreams',
        description: 'Soft lavender pastel theme',
        colors: {
          dockBaseGradientStart: '#F3E5F5',
          dockBaseGradientEnd: '#F8F4FF',
          dockAccentColor: '#CE93D8',
          sdCardBodyColor: '#F1E8F6',
          sdCardBorderColor: '#CE93D8',
          sdCardLabelColor: '#FDFAFF',
          sdCardLabelBorderColor: '#F3E5F5',
          sdCardBottomColor: '#CE93D8',
          leftPodBaseColor: '#F3E5F5',
          leftPodAccentColor: '#E1BEE7',
          leftPodDetailColor: '#F1E8F6',
          rightPodBaseColor: '#F3E5F5',
          rightPodAccentColor: '#E1BEE7',
          rightPodDetailColor: '#F1E8F6',
          buttonBorderColor: '#CE93D8',
          buttonGradientStart: '#E1BEE7',
          buttonGradientEnd: '#D1C4E9',
          buttonIconColor: '#9C7BB0',
          rightButtonIconColor: '#9C7BB0',
          buttonHighlightColor: '#FFFFFF',
        }
      },
      pastelMint: {
        name: 'Mint Breeze',
        description: 'Fresh mint pastel theme',
        colors: {
          dockBaseGradientStart: '#E8F5E8',
          dockBaseGradientEnd: '#F0FFF0',
          dockAccentColor: '#A5D6A7',
          sdCardBodyColor: '#E8F5E8',
          sdCardBorderColor: '#A5D6A7',
          sdCardLabelColor: '#F8FFF8',
          sdCardLabelBorderColor: '#E8F5E8',
          sdCardBottomColor: '#A5D6A7',
          leftPodBaseColor: '#E8F5E8',
          leftPodAccentColor: '#C8E6C9',
          leftPodDetailColor: '#E8F5E8',
          rightPodBaseColor: '#E8F5E8',
          rightPodAccentColor: '#C8E6C9',
          rightPodDetailColor: '#E8F5E8',
          buttonBorderColor: '#A5D6A7',
          buttonGradientStart: '#C8E6C9',
          buttonGradientEnd: '#B8D9B9',
          buttonIconColor: '#7A9B7A',
          rightButtonIconColor: '#7A9B7A',
          buttonHighlightColor: '#FFFFFF',
        }
      },
      pastelPeach: {
        name: 'Peach Blossom',
        description: 'Warm peach pastel theme',
        colors: {
          dockBaseGradientStart: '#FFF3E0',
          dockBaseGradientEnd: '#FFF8E1',
          dockAccentColor: '#FFCC80',
          sdCardBodyColor: '#FFF3E0',
          sdCardBorderColor: '#FFCC80',
          sdCardLabelColor: '#FFFDF8',
          sdCardLabelBorderColor: '#FFF3E0',
          sdCardBottomColor: '#FFCC80',
          leftPodBaseColor: '#FFF3E0',
          leftPodAccentColor: '#FFE0B2',
          leftPodDetailColor: '#FFF3E0',
          rightPodBaseColor: '#FFF3E0',
          rightPodAccentColor: '#FFE0B2',
          rightPodDetailColor: '#FFF3E0',
          buttonBorderColor: '#FFCC80',
          buttonGradientStart: '#FFE0B2',
          buttonGradientEnd: '#FFD180',
          buttonIconColor: '#E6A23C',
          rightButtonIconColor: '#E6A23C',
          buttonHighlightColor: '#FFFFFF',
        }
      },
      pastelRose: {
        name: 'Rose Petals',
        description: 'Delicate rose pastel theme',
        colors: {
          dockBaseGradientStart: '#FCE4EC',
          dockBaseGradientEnd: '#FFF0F3',
          dockAccentColor: '#F8BBD9',
          sdCardBodyColor: '#FCE4EC',
          sdCardBorderColor: '#F8BBD9',
          sdCardLabelColor: '#FFF8FA',
          sdCardLabelBorderColor: '#FCE4EC',
          sdCardBottomColor: '#F8BBD9',
          leftPodBaseColor: '#FCE4EC',
          leftPodAccentColor: '#F3E5F5',
          leftPodDetailColor: '#FCE4EC',
          rightPodBaseColor: '#FCE4EC',
          rightPodAccentColor: '#F3E5F5',
          rightPodDetailColor: '#FCE4EC',
          buttonBorderColor: '#F8BBD9',
          buttonGradientStart: '#F3E5F5',
          buttonGradientEnd: '#E1BEE7',
          buttonIconColor: '#E91E63',
          rightButtonIconColor: '#E91E63',
          buttonHighlightColor: '#FFFFFF',
        }
      },
      dark: {
        name: 'Dark Mode',
        description: 'Modern dark theme',
        colors: {
          dockBaseGradientStart: 'rgba(10,10,10,255)',
          dockBaseGradientEnd: 'rgba(20,20,20,255)',
          dockAccentColor: 'rgba(51,185,234,255)',
          sdCardBodyColor: 'rgba(15,15,15,255)',
          sdCardBorderColor: 'rgba(51,185,234,255)',
          sdCardLabelColor: 'rgba(25,25,25,255)',
          sdCardLabelBorderColor: 'rgba(30,30,30,255)',
          sdCardBottomColor: 'rgba(51,185,234,255)',
          leftPodBaseColor: 'rgba(18,18,18,255)',
          leftPodAccentColor: 'rgba(25,25,25,255)',
          leftPodDetailColor: 'rgba(22,22,22,255)',
          rightPodBaseColor: 'rgba(18,18,18,255)',
          rightPodAccentColor: 'rgba(25,25,25,255)',
          rightPodDetailColor: 'rgba(22,22,22,255)',
          buttonBorderColor: 'rgba(51,185,234,255)',
          buttonGradientStart: 'rgba(33,33,33,255)',
          buttonGradientEnd: 'rgba(28,28,28,255)',
          buttonIconColor: 'rgba(38,39,38,255)',
          rightButtonIconColor: 'rgba(38,39,38,255)',
          buttonHighlightColor: 'rgba(51,185,234,255)',
        }
      },
      neon: {
        name: 'Neon Cyberpunk',
        description: 'Futuristic neon theme',
        colors: {
          dockBaseGradientStart: '#0A0A0F',
          dockBaseGradientEnd: '#1A1A2E',
          dockAccentColor: '#00FFFF',
          sdCardBodyColor: '#16213E',
          sdCardBorderColor: '#00FFFF',
          sdCardLabelColor: '#0F3460',
          sdCardLabelBorderColor: '#1A1A2E',
          sdCardBottomColor: '#00FFFF',
          leftPodBaseColor: '#16213E',
          leftPodAccentColor: '#0F3460',
          leftPodDetailColor: '#1A1A2E',
          rightPodBaseColor: '#16213E',
          rightPodAccentColor: '#0F3460',
          rightPodDetailColor: '#1A1A2E',
          buttonBorderColor: '#00FFFF',
          buttonGradientStart: '#0F3460',
          buttonGradientEnd: '#16213E',
          buttonIconColor: '#FF00FF',
          rightButtonIconColor: '#FF00FF',
          buttonHighlightColor: '#00FFFF',
        }
      },
      ice: {
        name: 'Frozen Ice',
        description: 'Cool ice theme',
        colors: {
          dockBaseGradientStart: '#0F172A',
          dockBaseGradientEnd: '#1E293B',
          dockAccentColor: '#38BDF8',
          sdCardBodyColor: '#1E293B',
          sdCardBorderColor: '#38BDF8',
          sdCardLabelColor: '#334155',
          sdCardLabelBorderColor: '#475569',
          sdCardBottomColor: '#38BDF8',
          leftPodBaseColor: '#1E293B',
          leftPodAccentColor: '#334155',
          leftPodDetailColor: '#475569',
          rightPodBaseColor: '#1E293B',
          rightPodAccentColor: '#334155',
          rightPodDetailColor: '#475569',
          buttonBorderColor: '#38BDF8',
          buttonGradientStart: '#334155',
          buttonGradientEnd: '#1E293B',
          buttonIconColor: '#0EA5E9',
          rightButtonIconColor: '#0EA5E9',
          buttonHighlightColor: '#38BDF8',
        }
      }
    }
  },
  vibrant: {
    name: 'Vibrant & Nature Themes',
    description: 'Bold and energetic colors, inspired by natural elements',
    themes: {
      purple: {
        name: 'Royal Purple',
        description: 'Elegant purple theme',
        colors: {
          dockBaseGradientStart: '#4C1D95',
          dockBaseGradientEnd: '#7C3AED',
          dockAccentColor: '#A855F7',
          sdCardBodyColor: '#581C87',
          sdCardBorderColor: '#A855F7',
          sdCardLabelColor: '#6B21A8',
          sdCardLabelBorderColor: '#7C3AED',
          sdCardBottomColor: '#A855F7',
          leftPodBaseColor: '#581C87',
          leftPodAccentColor: '#6B21A8',
          leftPodDetailColor: '#7C3AED',
          rightPodBaseColor: '#581C87',
          rightPodAccentColor: '#6B21A8',
          rightPodDetailColor: '#7C3AED',
          buttonBorderColor: '#A855F7',
          buttonGradientStart: '#6B21A8',
          buttonGradientEnd: '#581C87',
          buttonIconColor: '#C084FC',
          rightButtonIconColor: '#C084FC',
          buttonHighlightColor: '#A855F7',
        }
      },
      fire: {
        name: 'Fiery Red',
        description: 'Hot fire theme',
        colors: {
          dockBaseGradientStart: '#7F1D1D',
          dockBaseGradientEnd: '#DC2626',
          dockAccentColor: '#F59E0B',
          sdCardBodyColor: '#991B1B',
          sdCardBorderColor: '#F59E0B',
          sdCardLabelColor: '#B91C1C',
          sdCardLabelBorderColor: '#DC2626',
          sdCardBottomColor: '#F59E0B',
          leftPodBaseColor: '#991B1B',
          leftPodAccentColor: '#B91C1C',
          leftPodDetailColor: '#DC2626',
          rightPodBaseColor: '#991B1B',
          rightPodAccentColor: '#B91C1C',
          rightPodDetailColor: '#DC2626',
          buttonBorderColor: '#F59E0B',
          buttonGradientStart: '#B91C1C',
          buttonGradientEnd: '#991B1B',
          buttonIconColor: '#EF4444',
          rightButtonIconColor: '#EF4444',
          buttonHighlightColor: '#F59E0B',
        }
      },
      gold: {
        name: 'Golden Luxury',
        description: 'Premium gold theme',
        colors: {
          dockBaseGradientStart: '#92400E',
          dockBaseGradientEnd: '#F59E0B',
          dockAccentColor: '#FCD34D',
          sdCardBodyColor: '#A16207',
          sdCardBorderColor: '#FCD34D',
          sdCardLabelColor: '#B45309',
          sdCardLabelBorderColor: '#F59E0B',
          sdCardBottomColor: '#FCD34D',
          leftPodBaseColor: '#A16207',
          leftPodAccentColor: '#B45309',
          leftPodDetailColor: '#F59E0B',
          rightPodBaseColor: '#A16207',
          rightPodAccentColor: '#B45309',
          rightPodDetailColor: '#F59E0B',
          buttonBorderColor: '#FCD34D',
          buttonGradientStart: '#B45309',
          buttonGradientEnd: '#A16207',
          buttonIconColor: '#F59E0B',
          rightButtonIconColor: '#F59E0B',
          buttonHighlightColor: '#FCD34D',
        }
      },
      sunset: {
        name: 'Sunset Orange',
        description: 'Warm sunset gradient',
        colors: {
          dockBaseGradientStart: '#FF6B35',
          dockBaseGradientEnd: '#F7931E',
          dockAccentColor: '#FFD700',
          sdCardBodyColor: '#FF8C42',
          sdCardBorderColor: '#FFD700',
          sdCardLabelColor: '#FFA500',
          sdCardLabelBorderColor: '#FFB347',
          sdCardBottomColor: '#FFD700',
          leftPodBaseColor: '#FF8C42',
          leftPodAccentColor: '#FFA500',
          leftPodDetailColor: '#FFB347',
          rightPodBaseColor: '#FF8C42',
          rightPodAccentColor: '#FFA500',
          rightPodDetailColor: '#FFB347',
          buttonBorderColor: '#FFD700',
          buttonGradientStart: '#FFA500',
          buttonGradientEnd: '#FF8C42',
          buttonIconColor: '#FF4500',
          rightButtonIconColor: '#FF4500',
          buttonHighlightColor: '#FFD700',
        }
      },
      forest: {
        name: 'Forest Green',
        description: 'Natural forest theme',
        colors: {
          dockBaseGradientStart: '#2D5016',
          dockBaseGradientEnd: '#4A7C59',
          dockAccentColor: '#90EE90',
          sdCardBodyColor: '#3B5323',
          sdCardBorderColor: '#90EE90',
          sdCardLabelColor: '#556B2F',
          sdCardLabelBorderColor: '#4A7C59',
          sdCardBottomColor: '#90EE90',
          leftPodBaseColor: '#3B5323',
          leftPodAccentColor: '#556B2F',
          leftPodDetailColor: '#4A7C59',
          rightPodBaseColor: '#3B5323',
          rightPodAccentColor: '#556B2F',
          rightPodDetailColor: '#4A7C59',
          buttonBorderColor: '#90EE90',
          buttonGradientStart: '#556B2F',
          buttonGradientEnd: '#3B5323',
          buttonIconColor: '#228B22',
          rightButtonIconColor: '#228B22',
          buttonHighlightColor: '#90EE90',
        }
      },
      ocean: {
        name: 'Ocean Blue',
        description: 'Deep ocean depths',
        colors: {
          dockBaseGradientStart: '#1E3A8A',
          dockBaseGradientEnd: '#3B82F6',
          dockAccentColor: '#06B6D4',
          sdCardBodyColor: '#1E40AF',
          sdCardBorderColor: '#06B6D4',
          sdCardLabelColor: '#1D4ED8',
          sdCardLabelBorderColor: '#3B82F6',
          sdCardBottomColor: '#06B6D4',
          leftPodBaseColor: '#1E40AF',
          leftPodAccentColor: '#1D4ED8',
          leftPodDetailColor: '#3B82F6',
          rightPodBaseColor: '#1E40AF',
          rightPodAccentColor: '#1D4ED8',
          rightPodDetailColor: '#3B82F6',
          buttonBorderColor: '#06B6D4',
          buttonGradientStart: '#1D4ED8',
          buttonGradientEnd: '#1E40AF',
          buttonIconColor: '#0EA5E9',
          rightButtonIconColor: '#0EA5E9',
          buttonHighlightColor: '#06B6D4',
        }
      }
    }
  },
  custom: {
    name: 'Your Themes',
    description: 'Your saved custom themes',
    themes: {}
  }
};

function ClassicDockSettingsModal({ isOpen, onClose, onSettingsChange, dockSettings = {} }) {
  // Color states
  const [dockBaseGradientStart, setDockBaseGradientStart] = useState(dockSettings.dockBaseGradientStart || '#BDBEC2');
  const [dockBaseGradientEnd, setDockBaseGradientEnd] = useState(dockSettings.dockBaseGradientEnd || '#DADDE6');
  const [dockAccentColor, setDockAccentColor] = useState(dockSettings.dockAccentColor || '#33BEED');
  const [sdCardBodyColor, setSdCardBodyColor] = useState(dockSettings.sdCardBodyColor || '#B9E1F2');
  const [sdCardBorderColor, setSdCardBorderColor] = useState(dockSettings.sdCardBorderColor || '#33BEED');
  const [sdCardLabelColor, setSdCardLabelColor] = useState(dockSettings.sdCardLabelColor || 'white');
  const [sdCardLabelBorderColor, setSdCardLabelBorderColor] = useState(dockSettings.sdCardLabelBorderColor || '#F4F0EE');
  const [sdCardBottomColor, setSdCardBottomColor] = useState(dockSettings.sdCardBottomColor || '#31BEED');
  const [leftPodBaseColor, setLeftPodBaseColor] = useState(dockSettings.leftPodBaseColor || '#D2D3DA');
  const [leftPodAccentColor, setLeftPodAccentColor] = useState(dockSettings.leftPodAccentColor || '#B6B6BB');
  const [leftPodDetailColor, setLeftPodDetailColor] = useState(dockSettings.leftPodDetailColor || '#D7D8DA');
  const [rightPodBaseColor, setRightPodBaseColor] = useState(dockSettings.rightPodBaseColor || '#DCDCDF');
  const [rightPodAccentColor, setRightPodAccentColor] = useState(dockSettings.rightPodAccentColor || '#E4E4E4');
  const [rightPodDetailColor, setRightPodDetailColor] = useState(dockSettings.rightPodDetailColor || '#B6B6BB');
  const [buttonBorderColor, setButtonBorderColor] = useState(dockSettings.buttonBorderColor || '#22BEF3');
  const [buttonGradientStart, setButtonGradientStart] = useState(dockSettings.buttonGradientStart || '#E0DCDC');
  const [buttonGradientEnd, setButtonGradientEnd] = useState(dockSettings.buttonGradientEnd || '#CBCBCB');
  const [buttonIconColor, setButtonIconColor] = useState(dockSettings.buttonIconColor || '#979796');
  const [rightButtonIconColor, setRightButtonIconColor] = useState(dockSettings.rightButtonIconColor || '#A4A4A4');
  const [buttonHighlightColor, setButtonHighlightColor] = useState(dockSettings.buttonHighlightColor || '#E4E4E4');

  // Glass effect states
  const [glassEnabled, setGlassEnabled] = useState(dockSettings.glassEnabled || false);
  const [glassOpacity, setGlassOpacity] = useState(dockSettings.glassOpacity || 0.18);
  const [glassBlur, setGlassBlur] = useState(dockSettings.glassBlur || 2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(dockSettings.glassBorderOpacity || 0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(dockSettings.glassShineOpacity || 0.7);

  // SD Card icon state
  const [sdCardIcon, setSdCardIcon] = useState(dockSettings.sdCardIcon || 'default');

  // Custom themes state
  const [customThemes, setCustomThemes] = useState(dockSettings.customThemes || {});
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');

  // Helper function to normalize icon value
  const normalizeIconValue = (iconValue) => {
    // If it's 'default', empty, null, or undefined, show default icon
    if (!iconValue || iconValue === 'default' || iconValue === '') {
      return 'default';
    }
    // If it's a URL, show custom icon
    return iconValue;
  };

  // Helper function to check if an icon is built-in
  const isBuiltInIcon = (iconValue) => {
    return ['palette', 'star', 'heart'].includes(iconValue);
  };

  // Helper function to render built-in icons
  const renderBuiltInIcon = (iconType) => {
    switch (iconType) {
      case 'palette':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5"/>
            <circle cx="17.5" cy="10.5" r="2.5"/>
            <circle cx="8.5" cy="7.5" r="2.5"/>
            <circle cx="6.5" cy="12.5" r="2.5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        );
      case 'star':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        );
      case 'heart':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const normalizedSdCardIcon = normalizeIconValue(sdCardIcon);

  // Size settings
  const [dockScale, setDockScale] = useState(dockSettings.dockScale || 1.0);
  const [buttonSize, setButtonSize] = useState(dockSettings.buttonSize || 1.0);
  const [sdCardSize, setSdCardSize] = useState(dockSettings.sdCardSize || 1.0);

  // Modal states
  const [showSdCardIconModal, setShowSdCardIconModal] = useState(false);

  // Collapsible groups state
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    pastel: false,
    modern: false,
    nature: false,
    vibrant: false,
    custom: false
  });

  // Recent colors
  const [recentColors, setRecentColors] = useState(dockSettings.recentColors || []);

  // Track current theme
  const [currentTheme, setCurrentTheme] = useState('default');

  // Update states when dockSettings changes
  useEffect(() => {
    if (dockSettings) {
      setDockBaseGradientStart(dockSettings.dockBaseGradientStart || '#BDBEC2');
      setDockBaseGradientEnd(dockSettings.dockBaseGradientEnd || '#DADDE6');
      setDockAccentColor(dockSettings.dockAccentColor || '#33BEED');
      setSdCardBodyColor(dockSettings.sdCardBodyColor || '#B9E1F2');
      setSdCardBorderColor(dockSettings.sdCardBorderColor || '#33BEED');
      setSdCardLabelColor(dockSettings.sdCardLabelColor || 'white');
      setSdCardLabelBorderColor(dockSettings.sdCardLabelBorderColor || '#F4F0EE');
      setSdCardBottomColor(dockSettings.sdCardBottomColor || '#31BEED');
      setLeftPodBaseColor(dockSettings.leftPodBaseColor || '#D2D3DA');
      setLeftPodAccentColor(dockSettings.leftPodAccentColor || '#B6B6BB');
      setLeftPodDetailColor(dockSettings.leftPodDetailColor || '#D7D8DA');
      setRightPodBaseColor(dockSettings.rightPodBaseColor || '#DCDCDF');
      setRightPodAccentColor(dockSettings.rightPodAccentColor || '#E4E4E4');
      setRightPodDetailColor(dockSettings.rightPodDetailColor || '#B6B6BB');
      setButtonBorderColor(dockSettings.buttonBorderColor || '#22BEF3');
      setButtonGradientStart(dockSettings.buttonGradientStart || '#E0DCDC');
      setButtonGradientEnd(dockSettings.buttonGradientEnd || '#CBCBCB');
      setButtonIconColor(dockSettings.buttonIconColor || '#979796');
      setRightButtonIconColor(dockSettings.rightButtonIconColor || '#A4A4A4');
      setButtonHighlightColor(dockSettings.buttonHighlightColor || '#E4E4E4');
      setGlassEnabled(dockSettings.glassEnabled || false);
      setGlassOpacity(dockSettings.glassOpacity || 0.18);
      setGlassBlur(dockSettings.glassBlur || 2.5);
      setGlassBorderOpacity(dockSettings.glassBorderOpacity || 0.5);
      setGlassShineOpacity(dockSettings.glassShineOpacity || 0.7);
      setSdCardIcon(dockSettings.sdCardIcon || 'default');
      setDockScale(dockSettings.dockScale || 1.0);
      setButtonSize(dockSettings.buttonSize || 1.0);
      setSdCardSize(dockSettings.sdCardSize || 1.0);
      setRecentColors(dockSettings.recentColors || []);
      setCustomThemes(dockSettings.customThemes || {});
    }
  }, [dockSettings]);

  // Update THEME_GROUPS with custom themes
  useEffect(() => {
    THEME_GROUPS.custom.themes = customThemes;
  }, [customThemes]);

  // Save custom theme
  const saveCustomTheme = () => {
    if (!themeName.trim()) return;

    const newTheme = {
      name: themeName.trim(),
      description: themeDescription.trim() || 'Custom theme',
      colors: {
        dockBaseGradientStart,
        dockBaseGradientEnd,
        dockAccentColor,
        sdCardBodyColor,
        sdCardBorderColor,
        sdCardLabelColor,
        sdCardLabelBorderColor,
        sdCardBottomColor,
        leftPodBaseColor,
        leftPodAccentColor,
        leftPodDetailColor,
        rightPodBaseColor,
        rightPodAccentColor,
        rightPodDetailColor,
        buttonBorderColor,
        buttonGradientStart,
        buttonGradientEnd,
        buttonIconColor,
        rightButtonIconColor,
        buttonHighlightColor,
      }
    };

    const themeKey = themeName.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (editingTheme) {
      // Edit existing theme
      const updatedThemes = { ...customThemes };
      delete updatedThemes[editingTheme];
      updatedThemes[themeKey] = newTheme;
      setCustomThemes(updatedThemes);
    } else {
      // Save new theme
      setCustomThemes(prev => ({
        ...prev,
        [themeKey]: newTheme
      }));
    }

    setThemeName('');
    setThemeDescription('');
    setEditingTheme(null);
    setShowSaveThemeModal(false);
  };

  // Edit custom theme
  const editCustomTheme = (themeKey) => {
    const theme = customThemes[themeKey];
    setThemeName(theme.name);
    setThemeDescription(theme.description);
    setEditingTheme(themeKey);
    setShowSaveThemeModal(true);
  };

  // Delete custom theme
  const deleteCustomTheme = (themeKey) => {
    if (window.confirm(`Are you sure you want to delete "${customThemes[themeKey].name}"?`)) {
      const updatedThemes = { ...customThemes };
      delete updatedThemes[themeKey];
      setCustomThemes(updatedThemes);
    }
  };

  // Open save theme modal
  const openSaveThemeModal = () => {
    setThemeName('');
    setThemeDescription('');
    setEditingTheme(null);
    setShowSaveThemeModal(true);
  };

  // Reset to default values
  const resetToDefault = () => {
    applyTheme('classic.default');
    setGlassEnabled(false);
    setGlassOpacity(0.18);
    setGlassBlur(2.5);
    setGlassBorderOpacity(0.5);
    setGlassShineOpacity(0.7);
    setDockScale(1.0);
    setButtonSize(1.0);
    setSdCardSize(1.0);
    setRecentColors([]);
  };

  const handleSave = async (handleClose) => {
    try {
      let newRecentColors = [dockBaseGradientStart, dockAccentColor, ...recentColors.filter(c => c !== dockBaseGradientStart && c !== dockAccentColor)].slice(0, 3);
       
      setRecentColors(newRecentColors);
      
      const settings = {
        dockBaseGradientStart,
        dockBaseGradientEnd,
        dockAccentColor,
        sdCardBodyColor,
        sdCardBorderColor,
        sdCardLabelColor,
        sdCardLabelBorderColor,
        sdCardBottomColor,
        leftPodBaseColor,
        leftPodAccentColor,
        leftPodDetailColor,
        rightPodBaseColor,
        rightPodAccentColor,
        rightPodDetailColor,
        buttonBorderColor,
        buttonGradientStart,
        buttonGradientEnd,
        buttonIconColor,
        rightButtonIconColor,
        buttonHighlightColor,
        glassEnabled,
        glassOpacity,
        glassBlur,
        glassBorderOpacity,
        glassShineOpacity,
        sdCardIcon,
        dockScale,
        buttonSize,
        sdCardSize,
        recentColors: newRecentColors,
        customThemes,
      };

      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving dock settings:', error);
    }
  };

  const handleSdCardIconChange = (newSettings) => {
    if (newSettings.sdCardIcon) {
      setSdCardIcon(newSettings.sdCardIcon);
    }
  };

  // Check if current colors match a theme
  const getCurrentTheme = () => {
    for (const [groupKey, group] of Object.entries(THEME_GROUPS)) {
      for (const [themeKey, theme] of Object.entries(group.themes)) {
        const themePath = `${groupKey}.${themeKey}`;
        const colors = theme.colors;
        
        if (
          colors.dockBaseGradientStart === dockBaseGradientStart &&
          colors.dockBaseGradientEnd === dockBaseGradientEnd &&
          colors.dockAccentColor === dockAccentColor &&
          colors.sdCardBodyColor === sdCardBodyColor &&
          colors.sdCardBorderColor === sdCardBorderColor &&
          colors.sdCardLabelColor === sdCardLabelColor &&
          colors.sdCardLabelBorderColor === sdCardLabelBorderColor &&
          colors.sdCardBottomColor === sdCardBottomColor &&
          colors.leftPodBaseColor === leftPodBaseColor &&
          colors.leftPodAccentColor === leftPodAccentColor &&
          colors.leftPodDetailColor === leftPodDetailColor &&
          colors.rightPodBaseColor === rightPodBaseColor &&
          colors.rightPodAccentColor === rightPodAccentColor &&
          colors.rightPodDetailColor === rightPodDetailColor &&
          colors.buttonBorderColor === buttonBorderColor &&
          colors.buttonGradientStart === buttonGradientStart &&
          colors.buttonGradientEnd === buttonGradientEnd &&
          colors.buttonIconColor === buttonIconColor &&
          colors.rightButtonIconColor === rightButtonIconColor &&
          colors.buttonHighlightColor === buttonHighlightColor
        ) {
          return themePath;
        }
      }
    }
    return null; // No matching theme found
  };

  // Apply theme function
  const applyTheme = (themePath) => {
    const [groupKey, themeKey] = themePath.split('.');
    const group = THEME_GROUPS[groupKey];
    const theme = group?.themes[themeKey];
    if (theme) {
      setDockBaseGradientStart(theme.colors.dockBaseGradientStart);
      setDockBaseGradientEnd(theme.colors.dockBaseGradientEnd);
      setDockAccentColor(theme.colors.dockAccentColor);
      setSdCardBodyColor(theme.colors.sdCardBodyColor);
      setSdCardBorderColor(theme.colors.sdCardBorderColor);
      setSdCardLabelColor(theme.colors.sdCardLabelColor);
      setSdCardLabelBorderColor(theme.colors.sdCardLabelBorderColor);
      setSdCardBottomColor(theme.colors.sdCardBottomColor);
      setLeftPodBaseColor(theme.colors.leftPodBaseColor);
      setLeftPodAccentColor(theme.colors.leftPodAccentColor);
      setLeftPodDetailColor(theme.colors.leftPodDetailColor);
      setRightPodBaseColor(theme.colors.rightPodBaseColor);
      setRightPodAccentColor(theme.colors.rightPodAccentColor);
      setRightPodDetailColor(theme.colors.rightPodDetailColor);
      setButtonBorderColor(theme.colors.buttonBorderColor);
      setButtonGradientStart(theme.colors.buttonGradientStart);
      setButtonGradientEnd(theme.colors.buttonGradientEnd);
      setButtonIconColor(theme.colors.buttonIconColor);
      setRightButtonIconColor(theme.colors.rightButtonIconColor);
      setButtonHighlightColor(theme.colors.buttonHighlightColor);
      setCurrentTheme(themePath);
    }
  };

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Customize Classic Dock"
      onClose={onClose}
      maxWidth="1000px"
      footerContent={({ handleClose }) => (
        <div className="flex justify-end items-center gap-2">
          <button
            className="reset-button px-4 py-2 rounded-md border-2 border-[#0099ff] bg-transparent text-[#0099ff] font-medium text-sm transition-all hover:bg-[#0099ff] hover:text-white"
            onClick={resetToDefault}
            type="button"
          >
            Reset to Default
          </button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
        </div>
      )}
    >
      {/* Preset Themes */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Preset Themes</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose from pre-made themes or customize your own.
          <div className="mt-3.5">
            {Object.entries(THEME_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="mb-5">
                <div
                  className="wee-card-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedGroups(prev => ({
                    ...prev,
                    [groupKey]: !prev[groupKey]
                  }))}
                >
                  <div>
                    <span className="wee-card-title">{group.name}</span>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {group.description}
                    </div>
                  </div>
                  <div
                    className={`transition-transform text-lg text-gray-600 ${expandedGroups[groupKey] ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </div>
                </div>
                {expandedGroups[groupKey] && (
                  <div className="grid gap-3.5 mt-3.5 p-3 bg-gray-50 rounded-lg"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {Object.entries(group.themes).map(([themeKey, theme]) => {
                      const themePath = `${groupKey}.${themeKey}`;
                      const isSelected = getCurrentTheme() === themePath;
                      const isCustomTheme = groupKey === 'custom';
                      return (
                        <button
                          key={themeKey}
                          onClick={() => applyTheme(themePath)}
                          type="button"
                          className={`relative flex flex-col gap-1.5 text-left p-3 rounded-lg border-2 transition-all
                            ${isSelected ? 'border-[#0099ff] bg-blue-50' : 'border-gray-200 bg-white'}
                            hover:border-[#0099ff] hover:bg-gray-50`}
                        >
                          <div className="font-semibold text-sm text-gray-800">{theme.name}</div>
                          <div className="text-xs text-gray-600">{theme.description}</div>
                          <div className="flex gap-1 mt-1">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.dockBaseGradientStart }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.dockAccentColor }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.buttonGradientStart }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.buttonIconColor }} />
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0099ff] flex items-center justify-center text-white text-xs font-bold">
                              ✓
                            </div>
                          )}
                          {isCustomTheme && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); editCustomTheme(themeKey); }}
                                className="w-5 h-5 rounded-full bg-[#0099ff] border-none text-white text-xs flex items-center justify-center"
                                title="Edit theme"
                                type="button"
                              >✏️</button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteCustomTheme(themeKey); }}
                                className="w-5 h-5 rounded-full bg-red-600 border-none text-white text-xs flex items-center justify-center"
                                title="Delete theme"
                                type="button"
                              >🗑️</button>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Current Theme Button */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Save Current Theme</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Save your current color configuration as a custom theme for future use.
          <div className="mt-3.5">
            <Button
              variant="primary"
              onClick={openSaveThemeModal}
              className="text-sm px-4 py-2"
            >
              Save Current Theme
            </Button>
          </div>
        </div>
      </div>

      {/* Dock Base Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Dock Base Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the main dock structure colors.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Gradient Start</label>
              <input
                type="color"
                value={dockBaseGradientStart}
                onChange={e => setDockBaseGradientStart(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockBaseGradientStart.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Gradient End</label>
              <input
                type="color"
                value={dockBaseGradientEnd}
                onChange={e => setDockBaseGradientEnd(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockBaseGradientEnd.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Accent Color</label>
              <input
                type="color"
                value={dockAccentColor}
                onChange={e => setDockAccentColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockAccentColor.toUpperCase()}</span>
            </div>
            {recentColors.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 mr-0.5">Recent:</span>
                {recentColors.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => setDockAccentColor(color)}
                    className={`w-7 h-7 rounded-full outline-none cursor-pointer border ${color === dockAccentColor ? 'border-2 border-[#0099ff]' : 'border border-gray-400'}`}
                    style={{ background: color, marginLeft: idx === 0 ? 0 : 2 }}
                    title={color}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SD Card Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">SD Card Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the SD card appearance.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Card Body</label>
              <input
                type="color"
                value={sdCardBodyColor}
                onChange={e => setSdCardBodyColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBodyColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Card Border</label>
              <input
                type="color"
                value={sdCardBorderColor}
                onChange={e => setSdCardBorderColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBorderColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Label Area</label>
              <input
                type="color"
                value={sdCardLabelColor}
                onChange={e => setSdCardLabelColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardLabelColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Bottom Section</label>
              <input
                type="color"
                value={sdCardBottomColor}
                onChange={e => setSdCardBottomColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBottomColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Button Pod Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Button Pod Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the button pod appearance.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Left Pod Base</label>
              <input
                type="color"
                value={leftPodBaseColor}
                onChange={e => setLeftPodBaseColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{leftPodBaseColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Right Pod Base</label>
              <input
                type="color"
                value={rightPodBaseColor}
                onChange={e => setRightPodBaseColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{rightPodBaseColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Button Border</label>
              <input
                type="color"
                value={buttonBorderColor}
                onChange={e => setButtonBorderColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{buttonBorderColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Button Icon</label>
              <input
                type="color"
                value={buttonIconColor}
                onChange={e => setButtonIconColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{buttonIconColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Effect Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header flex items-center justify-between">
          <span className="wee-card-title">Glass Effect</span>
          <WToggle
            checked={glassEnabled}
            onChange={(checked) => setGlassEnabled(checked)}
          />
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Apply a glass morphism effect to the dock. Creates a frosted glass appearance.
          {glassEnabled && (
            <div className="mt-3.5">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Opacity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassOpacity}
                  onChange={setGlassOpacity}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Blur</span>
                  <span className="text-sm text-gray-600">{glassBlur}px</span>
                </div>
                <Slider
                  value={glassBlur}
                  onChange={setGlassBlur}
                  min={0.5}
                  max={8}
                  step={0.1}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Border Opacity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassBorderOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassBorderOpacity}
                  onChange={setGlassBorderOpacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Shine Opacity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassShineOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassShineOpacity}
                  onChange={setGlassShineOpacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Settings Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Size Settings</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Adjust the height of dock elements. The dock maintains full width while scaling height.
          <div className="mt-3.5">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">Dock Height</span>
                <span className="text-sm text-gray-600">{Math.round(dockScale * 100)}%</span>
              </div>
              <Slider
                value={dockScale}
                onChange={setDockScale}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">Button Size</span>
                <span className="text-sm text-gray-600">{Math.round(buttonSize * 100)}%</span>
              </div>
              <Slider
                value={buttonSize}
                onChange={setButtonSize}
                min={0.5}
                max={1.5}
                step={0.05}
              />
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">SD Card Size</span>
                <span className="text-sm text-gray-600">{Math.round(sdCardSize * 100)}%</span>
              </div>
              <Slider
                value={sdCardSize}
                onChange={setSdCardSize}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button Customization Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Button Customization</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the dock buttons. Right-click on any button to open the customization menu.
          <div className="mt-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium mb-2">Left Button</div>
                <div className="text-xs text-gray-600 mb-3">
                  Right-click to customize
                </div>
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xs text-gray-600">Wii</span>
                </div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium mb-2">Right Button</div>
                <div className="text-xs text-gray-600 mb-3">
                  Right-click to customize
                </div>
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xs text-gray-600">Mail</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              💡 Tip: Right-click on any dock button to open the customization menu where you can change icons, text, and add actions.
            </div>
          </div>
        </div>
      </div>

      {/* SD Card Icon Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">SD Card Icon</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the SD card icon that appears on the dock.
          <div className="mt-3.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-gray-200 rounded-md flex items-center justify-center bg-gray-100">
                {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? (
                  <svg width="32" height="32" viewBox="0 0 147 198" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* ...svg paths unchanged... */}
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
                ) : isBuiltInIcon(normalizedSdCardIcon) ? (
                  <div className="flex items-center justify-center">
                    {renderBuiltInIcon(normalizedSdCardIcon)}
                  </div>
                ) : (
                  <img
                    src={normalizedSdCardIcon}
                    alt="Custom SD Card Icon"
                    className="w-8 h-8 object-contain rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">
                  {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? 'Default SD Card' : isBuiltInIcon(normalizedSdCardIcon) ? 'Built-in Icon' : 'Custom Icon'}
                </div>
                <div className="text-xs text-gray-600">
                  {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? 'Classic Wii SD card icon' : isBuiltInIcon(normalizedSdCardIcon) ? `${normalizedSdCardIcon.charAt(0).toUpperCase() + normalizedSdCardIcon.slice(1)} icon` : 'Custom uploaded icon'}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowSdCardIconModal(true)}
                className="text-xs px-3 py-1.5"
              >
                Change Icon
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SD Card Icon Modal */}
      <SDCardiconModal
        isOpen={showSdCardIconModal}
        onClose={() => setShowSdCardIconModal(false)}
        onSettingsChange={handleSdCardIconChange}
        sdCardIcon={normalizedSdCardIcon}
      />

      {/* Save Theme Modal */}
      {showSaveThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[400px] max-w-[90vw] shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 text-lg font-semibold">
                {editingTheme ? 'Edit Theme' : 'Save Theme'}
              </h3>
              <button
                onClick={() => setShowSaveThemeModal(false)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-500"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium">
                Theme Name *
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm"
                autoFocus
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1.5 font-medium">
                Description (optional)
              </label>
              <textarea
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
                placeholder="Enter theme description"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm resize-vertical"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowSaveThemeModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveCustomTheme}
                disabled={!themeName.trim()}
              >
                {editingTheme ? 'Update Theme' : 'Save Theme'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </WBaseModal>
  );
}

ClassicDockSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  dockSettings: PropTypes.object,
};

export default ClassicDockSettingsModal;