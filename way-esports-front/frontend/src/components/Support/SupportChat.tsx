import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

type SenderType = 'user' | 'ai' | 'admin' | 'system';

type SupportMessage = {
  id: string;
  senderType: SenderType;
  content: string;
  createdAt?: string | null;
  provider?: string | null;
};

type SupportConversation = {
  id: string;
  status: 'open' | 'waiting_user' | 'waiting_admin' | 'resolved';
  unreadForUser: number;
  unreadForAdmin: number;
};

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid
    ${({ $status }) =>
      $status === 'resolved'
        ? 'rgba(76,175,80,0.5)'
        : $status === 'waiting_user'
          ? 'rgba(255,193,7,0.5)'
          : 'rgba(255,107,0,0.5)'};
  color:
    ${({ $status }) =>
      $status === 'resolved'
        ? '#81c784'
        : $status === 'waiting_user'
          ? '#ffd54f'
          : '#ffb280'};
`;

const Messages = styled.div`
  min-height: 220px;
  max-height: 420px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const Bubble = styled.div<{ $sender: SenderType }>`
  max-width: min(95%, 760px);
  border-radius: 10px;
  padding: 10px 12px;
  justify-self: ${({ $sender }) => ($sender === 'user' ? 'end' : 'start')};
  background:
    ${({ $sender }) =>
      $sender === 'user'
        ? 'rgba(255,107,0,0.18)'
        : $sender === 'admin'
          ? 'rgba(76,175,80,0.17)'
          : $sender === 'ai'
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.05)'};
  border: 1px solid
    ${({ $sender }) =>
      $sender === 'user'
        ? 'rgba(255,107,0,0.45)'
        : $sender === 'admin'
          ? 'rgba(76,175,80,0.4)'
          : 'rgba(255,255,255,0.16)'};
`;

const BubbleMeta = styled.div`
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 6px;
`;

const InputRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
`;

const MessageInput = styled.textarea`
  min-height: 48px;
  max-height: 120px;
  resize: vertical;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 10px;
  padding: 10px 12px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SendButton = styled.button`
  min-width: 120px;
  min-height: 48px;
  border: none;
  border-radius: 10px;
  background: #ff6b00;
  color: #000;
  font-weight: 700;
  cursor: pointer;
`;

const Hint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const formatSender = (sender: SenderType) => {
  if (sender === 'user') return 'You';
  if (sender === 'admin') return 'Admin';
  if (sender === 'ai') return 'WAY AI Support';
  return 'System';
};

interface SupportChatProps {
  teamId?: string;
  source?: 'settings' | 'profile' | 'team' | 'other';
  subject?: string;
}

const SupportChat: React.FC<SupportChatProps> = ({
  teamId,
  source = 'settings',
  subject = 'Emergency Support'
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = async () => {
    if (!api.hasToken()) return;
    try {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      const res: any = await api.get(`/api/support/thread${query}`);
      const data = res?.data || {};
      setConversation(data.conversation || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load support chat');
    }
  };

  useEffect(() => {
    void loadThread();
    const timer = setInterval(() => {
      void loadThread();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const onSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = value.trim();
    if (!message || busy) return;

    try {
      setBusy(true);
      setError(null);
      setValue('');
      await api.post('/api/support/message', {
        message,
        source,
        subject,
        ...(teamId ? { teamId } : {})
      });
      await loadThread();
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return left - right;
      }),
    [messages]
  );

  return (
    <Wrapper>
      <StatusRow>
        <StatusBadge $status={conversation?.status || 'open'}>
          {(conversation?.status || 'open').toUpperCase()}
        </StatusBadge>
        <Hint>AI first response + manual admin reply when needed</Hint>
      </StatusRow>

      <Messages>
        {!sortedMessages.length && (
          <Hint>No messages yet. Describe the problem and AI support will answer.</Hint>
        )}
        {sortedMessages.map((msg) => (
          <Bubble key={msg.id} $sender={msg.senderType}>
            <BubbleMeta>
              {formatSender(msg.senderType)}
              {msg.provider ? ` • ${msg.provider}` : ''}
              {msg.createdAt ? ` • ${new Date(msg.createdAt).toLocaleString()}` : ''}
            </BubbleMeta>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </Bubble>
        ))}
      </Messages>

      <InputRow onSubmit={onSend}>
        <MessageInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe issue: what you did -> expected result -> actual error"
          maxLength={2000}
          required
        />
        <SendButton type="submit" disabled={busy}>
          {busy ? 'Sending...' : 'Send'}
        </SendButton>
      </InputRow>

      {error && <Hint style={{ color: '#ff8a80' }}>{error}</Hint>}
    </Wrapper>
  );
};

export default SupportChat;
