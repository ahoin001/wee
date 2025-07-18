import React from 'react';
import HomeButton from './HomeButton';
import SettingsButton from './SettingsButton';
import NotificationsButton from './NotificationsButton';
import '../App.css';

function FlatBar(props) {
  return (
    <div className="ui-bar">
      <HomeButton />
      <SettingsButton 
        onClick={props.onSettingsClick} 
        isActive={props.isEditMode} 
        onToggleDarkMode={props.onToggleDarkMode}
        onToggleCursor={props.onToggleCursor}
        useCustomCursor={props.useCustomCursor}
        onSettingsChange={props.onSettingsChange}
        barType={props.barType}
        onBarTypeChange={props.onBarTypeChange}
        defaultBarType={props.defaultBarType}
        onDefaultBarTypeChange={props.onDefaultBarTypeChange}
      />
      <NotificationsButton />
    </div>
  );
}

export default FlatBar; 