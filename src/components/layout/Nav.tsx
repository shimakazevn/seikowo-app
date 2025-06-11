import React, { memo } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { NAV_COLORS, BOTTOM_NAV_ITEMS } from './Nav/NavConstants';
import SidebarNav from './Nav/SidebarNav';
import BottomNav from './Nav/BottomNav';
import SettingsModal from '../Modals/SettingsModal';

const Nav: React.FC = () => {
  // Hooks
  const {
    colors,
    handlers,
    modals
  } = useNavigation();

  return (
    <>
      {/* Right Sidebar Navigation for Desktop */}
      <SidebarNav
        activeColor={NAV_COLORS.activeColor}
        textColor={colors.textColor}
        onSearchOpen={handlers.handleOpenSearch}
      />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        menuItems={BOTTOM_NAV_ITEMS}
        activeColor={NAV_COLORS.activeColor}
        textColor={colors.textColor}
        onSearchOpen={handlers.handleOpenSearch}
      />

      {/* Modals */}
      <SettingsModal isOpen={modals.settings.isOpen} onClose={modals.settings.onClose} />
    </>
  );
};

export default memo(Nav);