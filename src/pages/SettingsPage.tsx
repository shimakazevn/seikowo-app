import React, { useState, lazy, Suspense } from 'react';
import { Spinner, Center } from '@chakra-ui/react';
import useUserStore from '../store/useUserStore';
import TabLayout, { TabItem } from '../components/layouts/TabLayout';

const SETTINGS_TABS: TabItem[] = [
  {
    id: 'profile',
    label: 'tài khoản',
    icon: lazy(() => import('react-icons/fi').then(mod => ({ default: mod.FiUser }))),
    description: 'cài đặt tài khoản',
    color: '#3b82f6',
    component: lazy(() => import('../components/Settings/Profile/ProfileSettings')),
  },
  {
    id: 'appearance',
    label: 'giao diện',
    icon: lazy(() => import('react-icons/fi').then(mod => ({ default: mod.FiSettings }))),
    description: 'tùy chỉnh giao diện',
    color: '#8b5cf6',
    component: lazy(() => import('./settings/AppearanceSettings')),
  },
  {
    id: 'accessibility',
    label: 'khả năng tiếp cận',
    icon: lazy(() => import('react-icons/fi').then(mod => ({ default: mod.FiEye }))),
    description: 'cài đặt khả năng tiếp cận',
    color: '#10b981',
    component: lazy(() => import('./settings/AccessibilitySettings')),
  },
  {
    id: 'advanced',
    label: 'nâng cao',
    icon: lazy(() => import('react-icons/fi').then(mod => ({ default: mod.FiTool }))),
    description: 'cài đặt nâng cao',
    color: '#64748b',
    component: lazy(() => import('./settings/AdvancedSettings')),
  }
];

const SettingsPage = () => {
  const { isAuthenticated, user } = useUserStore();
  const [activeTab, setActiveTab] = useState('');

  const TabComponent = SETTINGS_TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <TabLayout
      title="cài đặt"
      description="quản lý tài khoản và tùy chỉnh ứng dụng"
      tabs={SETTINGS_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBackToList={() => setActiveTab('')}
    >
      {TabComponent && (
        <Suspense fallback={<Center h="200px"><Spinner size="xl" /></Center>}>
          <TabComponent />
        </Suspense>
      )}
    </TabLayout>
  );
};

export default SettingsPage;
