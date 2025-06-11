import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaHistory,
  FaBookmark,
  FaEnvelope,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';

interface UserMenuProps {
  handleProfile: () => void;
  handleHistory: () => void;
  handleViewMore: () => void;
  onSettingsOpen: () => void;
  logout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = memo(({
  handleProfile,
  handleHistory,
  handleViewMore,
  onSettingsOpen,
  logout
}) => {
  const redHoverBg = useColorModeValue('red.50', 'red.900');

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<FaUser />}
        variant="ghost"
        size="sm"
        aria-label="User menu"
      />
      <MenuList>
        <MenuItem icon={<FaUser />} onClick={handleProfile}>
          Hồ sơ
        </MenuItem>
        <MenuItem icon={<FaHistory />} onClick={handleHistory}>
          my content
        </MenuItem>
        <MenuItem icon={<FaCog />} onClick={onSettingsOpen}>
          Cài đặt
        </MenuItem>
        <Divider />
        <MenuItem
          icon={<FaSignOutAlt />}
          onClick={logout}
          color="red.500"
          _hover={{ bg: redHoverBg }}
        >
          Đăng xuất
        </MenuItem>
        <Divider />
        <MenuItem as={RouterLink} to="/about" icon={<FaInfoCircle />}>
          About
        </MenuItem>
        <MenuItem as={RouterLink} to="/contact" icon={<FaEnvelope />}>
          Contact
        </MenuItem>
      </MenuList>
    </Menu>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;