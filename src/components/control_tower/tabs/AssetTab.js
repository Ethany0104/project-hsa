// src/components/control_tower/tabs/AssetTab.js
import React from 'react';
import AssetExplorer from './AssetExplorer'; // Import our new explorer component

/**
 * The AssetTab component now acts as a container for the AssetExplorer.
 */
const AssetTab = () => {
    // The entire UI and logic are now handled by the AssetExplorer component.
    return <AssetExplorer />;
};

export default AssetTab;
