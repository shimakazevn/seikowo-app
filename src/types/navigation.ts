import { User } from './common';

export interface MenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  isAction?: boolean; // For special action items like search
}

export interface NavActions {
  handleOpenSearch: () => void;
  handleHistory: () => void;
  handleProfile: () => void;
  handleViewMore: () => void;
  login: () => void;
  logout: () => void;
  checkUpdatedFollows: () => void;
}

export interface NavProps {
  user?: User;

  onLogin: () => void;
  onLogout: () => void;
  onSettingsOpen: () => void;
}

export interface UserMenuProps {
  handleProfile: () => void;
  handleHistory: () => void;
  handleViewMore: () => void;
  onSettingsOpen: () => void;
  logout: () => void;
}

export interface NavMenuProps {
  menuItems: MenuItem[];
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
  hoverColor: string;
}