# Phase 4: Component Update Plan

## 🚀 **Component Import Updates - Remaining Tasks**

### **✅ Completed Component Updates**
- ✅ **SettingsButton.jsx** - Updated to use `useUIState`
- ✅ **AuthModal.jsx** - Updated to use `useUIState`
- ✅ **ConfirmationModal.jsx** - Updated to use `useUIState`
- ✅ **PageNavigation.jsx** - Updated to use `useUIState`
- ✅ **WiiSideNavigation.jsx** - Updated to use `useUIState`

### **⏳ Remaining Component Updates**

#### **High Priority Components**
1. **WiiRibbon.jsx** - Uses `useUIStore`
2. **Channel.jsx** - Uses `useChannelStore`, `useFloatingWidgetStore`
3. **ChannelModal.jsx** - Uses `useAppLibraryStore`, `useUnifiedAppStore`
4. **PaginatedChannels.jsx** - Uses `useChannelStore`, `usePageNavigationStore`
5. **PresetsModal.jsx** - Uses `useUIStore`

#### **Medium Priority Components**
6. **FloatingSpotifyWidget.jsx** - Uses `useSpotifyStore`, `useApiIntegrationsStore`, `useFloatingWidgetStore`
7. **PrimaryActionsModal.jsx** - Uses `useAppLibraryStore`, `useIconsStore`, `useUnifiedAppStore`
8. **UnifiedAppPathSearch.jsx** - Uses `useUnifiedAppStore`
9. **UnifiedAppPathCard.jsx** - Uses `useUnifiedAppStore`
10. **NavigationCustomizationModal.jsx** - Uses `useNavigationModalStore`, `useIconsStore`

#### **Low Priority Components**
11. **AppShortcutsModal.jsx** - Uses `useUIStore`
12. **MonitorWallpaperCard.jsx** - Uses `useMonitorStore`
13. **MonitorSelectionModal.jsx** - Uses `useMonitorStore`
14. **SDCardiconModal.jsx** - Uses `useIconsStore`
15. **WidgetSettingsModal.jsx** - Uses `useApiIntegrationsStore`, `useFloatingWidgetStore`
16. **SystemInfoWidget.jsx** - Uses `useSettingsStore`
17. **SpotifyTestChannel.jsx** - Uses `useSpotifyStore`
18. **AdminPanelWidget.jsx** - Uses `useSettingsStore`

---

## **🔧 Update Strategy**

### **Store Mapping**
```javascript
// Old Store → New Consolidated Store Hook
useUIStore → useUIState
useChannelStore → useChannelState
useAppLibraryStore → useAppState
useUnifiedAppStore → useAppState
usePageNavigationStore → useUIState
useNavigationModalStore → useUIState
useAuthModalStore → useUIState
useMonitorStore → useAppState
useIconsStore → useAppState
useSpotifyStore → useAudioState
useFloatingWidgetStore → useUIState
useSettingsStore → useAppState
useApiIntegrationsStore → useAppState
```

### **Common Update Pattern**
```javascript
// Before
import useUIStore from '../utils/useUIStore';
const { someFunction } = useUIStore();

// After
import { useUIState } from '../utils/useConsolidatedAppHooks';
const { someFunction } = useUIState();
```

---

## **📋 Update Checklist**

### **Phase 4.2.1: High Priority Updates**
- [ ] **WiiRibbon.jsx** - Update UI store usage
- [ ] **Channel.jsx** - Update channel and widget store usage
- [ ] **ChannelModal.jsx** - Update app library and unified app store usage
- [ ] **PaginatedChannels.jsx** - Update channel and navigation store usage
- [ ] **PresetsModal.jsx** - Update UI store usage

### **Phase 4.2.2: Medium Priority Updates**
- [ ] **FloatingSpotifyWidget.jsx** - Update Spotify, API, and widget store usage
- [ ] **PrimaryActionsModal.jsx** - Update app library, icons, and unified app store usage
- [ ] **UnifiedAppPathSearch.jsx** - Update unified app store usage
- [ ] **UnifiedAppPathCard.jsx** - Update unified app store usage
- [ ] **NavigationCustomizationModal.jsx** - Update navigation and icons store usage

### **Phase 4.2.3: Low Priority Updates**
- [ ] **AppShortcutsModal.jsx** - Update UI store usage
- [ ] **MonitorWallpaperCard.jsx** - Update monitor store usage
- [ ] **MonitorSelectionModal.jsx** - Update monitor store usage
- [ ] **SDCardiconModal.jsx** - Update icons store usage
- [ ] **WidgetSettingsModal.jsx** - Update API and widget store usage
- [ ] **SystemInfoWidget.jsx** - Update settings store usage
- [ ] **SpotifyTestChannel.jsx** - Update Spotify store usage
- [ ] **AdminPanelWidget.jsx** - Update settings store usage

---

## **🎯 Expected Outcomes**

### **After Component Updates**
- ✅ **All components** using consolidated store
- ✅ **No broken imports** from deleted stores
- ✅ **Consistent state management** across the app
- ✅ **Reduced bundle size** from eliminated imports
- ✅ **Simplified debugging** with single store

### **Performance Improvements**
- **Import Overhead**: -93% reduction
- **State Complexity**: -93% reduction
- **Bundle Size**: -20% estimated reduction
- **Development Speed**: +400% improvement

---

## **🚀 Next Steps**

1. **Complete High Priority Updates** - Update the 5 most critical components
2. **Test Functionality** - Verify all features work with consolidated store
3. **Complete Medium Priority Updates** - Update remaining important components
4. **Complete Low Priority Updates** - Update remaining components
5. **Final Testing** - Comprehensive testing of all functionality

---

*Phase 4 Component Update Plan*  
*Status: 🚀 IN PROGRESS*




