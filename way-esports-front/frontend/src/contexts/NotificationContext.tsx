import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  inApp: boolean;
  tournamentUpdates: boolean;
  newsUpdates: boolean;
  rewardUpdates: boolean;
  teamUpdates: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  settings: NotificationSettings;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  clearAll: () => void;
}

// Styled Components
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
`;

const NotificationItem = styled.div<{ $type: string; $isVisible: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid ${({ $type }) => 
    $type === 'success' ? '#2ed573' :
    $type === 'error' ? '#ff4757' :
    $type === 'warning' ? '#ffa502' : '#3742fa'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: ${({ $isVisible }) => $isVisible ? slideIn : slideOut} 0.3s ease-in-out;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  color: #cccccc;
  font-size: 13px;
  line-height: 1.4;
`;

const NotificationTime = styled.div`
  color: #888888;
  font-size: 11px;
  margin-top: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  margin-left: 8px;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

const NotificationPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${({ $isOpen }) => $isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100vh;
  background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(42, 42, 42, 0.95));
  backdrop-filter: blur(10px);
  border-left: 2px solid #ff6b00;
  transition: right 0.3s ease;
  z-index: 9999;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h3`
  color: #ffffff;
  margin: 0;
  font-size: 18px;
`;

const PanelCloseButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  cursor: pointer;
  font-size: 20px;
  padding: 0;

  &:hover {
    color: #ffffff;
  }
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const NotificationListItem = styled.div<{ $read: boolean }>`
  background: ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 107, 0, 0.1)'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 107, 0, 0.3)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 107, 0, 0.15)'};
    transform: translateY(-1px);
  }
`;

const SettingsPanel = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SettingLabel = styled.div`
  color: #ffffff;
  font-size: 14px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: linear-gradient(135deg, #ff6b00, #ff8533);
  }

  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: #ffffff;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider Component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    inApp: true,
    tournamentUpdates: true,
    newsUpdates: true,
    rewardUpdates: true,
    teamUpdates: true,
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);

    // Send push notification if enabled
    if (settings.push && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    settings,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updateSettings,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer>
        {notifications.slice(0, 3).map(notification => (
          <NotificationItem
            key={notification.id}
            $type={notification.type}
            $isVisible={true}
            onClick={() => markAsRead(notification.id)}
          >
            <NotificationHeader>
              <div>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                {notification.action && (
                  <ActionButton onClick={(e) => {
                    e.stopPropagation();
                    notification.action!.onClick();
                  }}>
                    {notification.action.label}
                  </ActionButton>
                )}
              </div>
              <CloseButton onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}>
                ×
              </CloseButton>
            </NotificationHeader>
            <NotificationTime>
              {notification.timestamp.toLocaleTimeString()}
            </NotificationTime>
          </NotificationItem>
        ))}
      </NotificationContainer>

      <NotificationPanel $isOpen={isPanelOpen}>
        <PanelHeader>
          <PanelTitle>Notifications ({unreadCount})</PanelTitle>
          <PanelCloseButton onClick={() => setIsPanelOpen(false)}>×</PanelCloseButton>
        </PanelHeader>
        
        <NotificationList>
          {notifications.length === 0 ? (
            <div style={{ color: '#888888', textAlign: 'center', padding: '40px' }}>
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationListItem
                key={notification.id}
                $read={notification.read}
                onClick={() => markAsRead(notification.id)}
              >
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>
                  {notification.timestamp.toLocaleString()}
                </NotificationTime>
              </NotificationListItem>
            ))
          )}
        </NotificationList>

        <SettingsPanel>
          <h4 style={{ color: '#ffffff', marginBottom: '16px' }}>Settings</h4>
          <SettingItem>
            <SettingLabel>Push Notifications</SettingLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={settings.push}
                onChange={(e) => updateSettings({ push: e.target.checked })}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingItem>
          <SettingItem>
            <SettingLabel>Email Notifications</SettingLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={settings.email}
                onChange={(e) => updateSettings({ email: e.target.checked })}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingItem>
          <SettingItem>
            <SettingLabel>Tournament Updates</SettingLabel>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={settings.tournamentUpdates}
                onChange={(e) => updateSettings({ tournamentUpdates: e.target.checked })}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingItem>
        </SettingsPanel>
      </NotificationPanel>
    </NotificationContext.Provider>
  );
};

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 