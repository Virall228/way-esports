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
    transform: translateX(100%) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
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

const floatAura = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: calc(18px + var(--sat, 0px));
  right: calc(18px + var(--sar, 0px));
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90vw;
  max-width: 380px;
`;

const NotificationItem = styled.div<{ $type: string; $isVisible: boolean }>`
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(18, 21, 27, 0.96), rgba(8, 10, 13, 0.98));
  border-radius: 20px;
  padding: 16px 16px 14px;
  border: 1px solid
    ${({ $type }) =>
      $type === 'success'
        ? 'rgba(52, 211, 153, 0.26)'
        : $type === 'error'
          ? 'rgba(248, 113, 113, 0.28)'
          : $type === 'warning'
            ? 'rgba(245, 154, 74, 0.3)'
            : 'rgba(96, 165, 250, 0.26)'};
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
  animation: ${({ $isVisible }) => $isVisible ? slideIn : slideOut} 0.3s ease-in-out;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;

  &::before {
    content: '';
    position: absolute;
    inset: auto -18% -36% auto;
    width: 9rem;
    height: 9rem;
    border-radius: 50%;
    background: ${({ $type }) =>
      $type === 'success'
        ? 'radial-gradient(circle, rgba(52, 211, 153, 0.24), transparent 68%)'
        : $type === 'error'
          ? 'radial-gradient(circle, rgba(248, 113, 113, 0.24), transparent 68%)'
          : $type === 'warning'
            ? 'radial-gradient(circle, rgba(245, 154, 74, 0.22), transparent 68%)'
            : 'radial-gradient(circle, rgba(96, 165, 250, 0.22), transparent 68%)'};
    pointer-events: none;
    animation: ${floatAura} 6s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 28px 52px rgba(0, 0, 0, 0.38);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
`;

const NotificationTitle = styled.div`
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  color: #cfd6df;
  font-size: 13px;
  line-height: 1.55;
`;

const NotificationTime = styled.div`
  color: #8f98a5;
  font-size: 11px;
  margin-top: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #aeb6c0;
  cursor: pointer;
  font-size: 14px;
  min-width: 30px;
  min-height: 30px;
  border-radius: 10px;
  padding: 0;
  transition: color 0.24s ease, background 0.24s ease, border-color 0.24s ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.14);
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(180deg, rgba(34, 38, 45, 0.96), rgba(16, 19, 24, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f5f7fa;
  padding: 8px 13px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease, background 0.24s ease;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(180deg, rgba(40, 45, 53, 0.98), rgba(19, 22, 27, 1));
    border-color: rgba(255, 255, 255, 0.18);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28);
  }
`;

const NotificationMeta = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

const ToneBadge = styled.span<{ $type: Notification['type'] }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ $type }) =>
    $type === 'success'
      ? '#a9f0d1'
      : $type === 'error'
        ? '#ffc3c3'
        : $type === 'warning'
          ? '#ffd1a3'
          : '#c7dcff'};
  background: ${({ $type }) =>
    $type === 'success'
      ? 'rgba(52, 211, 153, 0.12)'
      : $type === 'error'
        ? 'rgba(248, 113, 113, 0.12)'
        : $type === 'warning'
          ? 'rgba(245, 154, 74, 0.12)'
          : 'rgba(96, 165, 250, 0.12)'};
  border: 1px solid
    ${({ $type }) =>
      $type === 'success'
        ? 'rgba(52, 211, 153, 0.18)'
        : $type === 'error'
          ? 'rgba(248, 113, 113, 0.18)'
          : $type === 'warning'
            ? 'rgba(245, 154, 74, 0.2)'
            : 'rgba(96, 165, 250, 0.2)'};
`;

const NotificationPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${({ $isOpen }) => $isOpen ? '0' : '-430px'};
  width: min(410px, 100vw);
  height: 100vh;
  background: linear-gradient(180deg, rgba(11, 14, 19, 0.98), rgba(6, 8, 11, 1));
  backdrop-filter: blur(18px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  transition: right 0.3s ease;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -28px 0 60px rgba(0, 0, 0, 0.34);
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
  background: ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 154, 74, 0.1)'};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 154, 74, 0.2)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $read }) => $read ? 'rgba(255, 255, 255, 0.06)' : 'rgba(245, 154, 74, 0.14)'};
    transform: translateY(-1px);
  }
`;

const EmptyPanelState = styled.div`
  display: grid;
  gap: 0.7rem;
  align-content: center;
  justify-items: center;
  min-height: 240px;
  color: #9ba5b2;
  text-align: center;
  padding: 2rem 1rem;
`;

const EmptyPanelOrb = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 32%, rgba(255,255,255,0.82), rgba(255,255,255,0) 28%),
    radial-gradient(circle, rgba(245, 154, 74, 0.82), rgba(245, 154, 74, 0.18) 58%, transparent 72%);
  box-shadow: 0 0 0 0.65rem rgba(245, 154, 74, 0.08);
`;

const SettingsPanel = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SettingsHeading = styled.div`
  display: grid;
  gap: 0.3rem;
  margin-bottom: 1rem;
`;

const SettingsTitle = styled.h4`
  margin: 0;
  color: #ffffff;
  font-size: 0.96rem;
  letter-spacing: 0.01em;
`;

const SettingsCopy = styled.p`
  margin: 0;
  color: #8f98a5;
  font-size: 0.8rem;
  line-height: 1.55;
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
  width: 54px;
  height: 32px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: linear-gradient(180deg, rgba(68, 211, 139, 0.92), rgba(34, 197, 94, 0.96));
    border-color: rgba(167, 243, 208, 0.28);
    box-shadow:
      0 12px 26px rgba(34, 197, 94, 0.18),
      inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  &:checked + span:before {
    transform: translateX(22px);
  }

  &:focus-visible + span {
    box-shadow:
      0 0 0 4px rgba(255, 255, 255, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.22);
  transition: background 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
  border-radius: 999px;

  &:before {
    position: absolute;
    content: "";
    height: 24px;
    width: 24px;
    left: 3px;
    top: 3px;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(228, 233, 240, 0.94));
    box-shadow:
      0 6px 14px rgba(0, 0, 0, 0.22),
      0 1px 0 rgba(255, 255, 255, 0.7) inset;
    transition: transform 0.24s ease;
    border-radius: 50%;
  }
`;

const getToneLabel = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Alert';
    case 'warning':
      return 'Watch';
    case 'info':
    default:
      return 'Update';
  }
};

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
        icon: '/knife.svg',
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
              <NotificationMeta>
                <ToneBadge $type={notification.type}>{getToneLabel(notification.type)}</ToneBadge>
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
              </NotificationMeta>
              <CloseButton onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}>
                {'\u2715'}
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
          <PanelCloseButton onClick={() => setIsPanelOpen(false)}>
            {'\u2715'}
          </PanelCloseButton>
        </PanelHeader>
        
        <NotificationList>
          {notifications.length === 0 ? (
            <EmptyPanelState>
              <EmptyPanelOrb aria-hidden="true" />
              <NotificationTitle>All clear for now</NotificationTitle>
              <NotificationMessage>
                Match results, rewards, team updates and important signals will appear here the moment they matter.
              </NotificationMessage>
            </EmptyPanelState>
          ) : (
            notifications.map(notification => (
              <NotificationListItem
                key={notification.id}
                $read={notification.read}
                onClick={() => markAsRead(notification.id)}
              >
                <NotificationMeta>
                  <ToneBadge $type={notification.type}>{getToneLabel(notification.type)}</ToneBadge>
                </NotificationMeta>
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
          <SettingsHeading>
            <SettingsTitle>Notification settings</SettingsTitle>
            <SettingsCopy>
              Keep the signal high and the noise low. Choose which updates deserve your attention.
            </SettingsCopy>
          </SettingsHeading>
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
