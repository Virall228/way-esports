import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { getFullUrl } from '../../config/api';

const Wrapper = styled.div`
  padding: 1rem;
  color: #fff;
`;

const Panel = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0d0d0d;
  color: #fff;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0d0d0d;
  color: #fff;
`;

const Drop = styled.label`
  display: block;
  padding: 18px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 107, 0, 0.6);
  background: rgba(255, 107, 0, 0.06);
  cursor: pointer;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  border: 1px solid ${({ $variant }) => ($variant === 'secondary' ? 'rgba(255,255,255,0.25)' : 'rgba(255,107,0,0.75)')};
  background: ${({ $variant }) => ($variant === 'secondary' ? 'rgba(255,255,255,0.08)' : '#ff6b00')};
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  td, th {
    padding: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    text-align: left;
  }
`;

type Candidate = {
  userId: string;
  displayName: string;
  ingameNickname: string;
  ingameId: string;
  avatar?: string;
};

type Suggestion = {
  parsed: {
    nickname: string;
    kills: number;
    deaths: number;
    assists: number;
    mvp_status: boolean;
    damage: number;
  };
  matchedUserId: string | null;
  matchedBy: 'ingame_id' | 'nickname_fuzzy' | 'none';
  confidence: number;
};

const AdminOcrPage: React.FC = () => {
  const [tournamentId, setTournamentId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameType, setGameType] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [manualMap, setManualMap] = useState<Record<number, string>>({});

  const { data: tournaments = [] } = useQuery({
    queryKey: ['ocr', 'tournaments'],
    queryFn: async () => {
      const response: any = await api.get('/api/tournaments?limit=100');
      const items = Array.isArray(response?.data) ? response.data : Array.isArray(response?.tournaments) ? response.tournaments : [];
      return items.map((item: any) => ({
        id: String(item?.id || item?._id || ''),
        name: String(item?.name || item?.title || ''),
        game: String(item?.game || '')
      })).filter((item: any) => item.id);
    }
  });

  const selectedTournament = useMemo(
    () => tournaments.find((t: any) => t.id === tournamentId) || null,
    [tournaments, tournamentId]
  );

  const onUpload = async () => {
    if (!tournamentId || !file) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const form = new FormData();
      form.append('image', file);
      form.append('tournamentId', tournamentId);
      if (matchId.trim()) form.append('matchId', matchId.trim());

      const response = await fetch(getFullUrl('/api/admin/parse-match-screenshot'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });

      const payload: any = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to parse screenshot');
      }

      const data = payload.data || {};
      setGameType(String(data.gameType || selectedTournament?.game || ''));
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      setManualMap({});
    } catch (error: any) {
      window.alert(error?.message || 'Failed to parse screenshot');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!tournamentId || !suggestions.length) return;
    setLoading(true);
    try {
      const results = suggestions.map((item, index) => {
        const selectedUserId = manualMap[index] || item.matchedUserId || '';
        const candidate = candidates.find((row) => row.userId === selectedUserId);
        return {
          userId: selectedUserId || undefined,
          ingameNickname: candidate?.ingameNickname || item.parsed.nickname,
          ingameId: candidate?.ingameId || '',
          stats: {
            kills: item.parsed.kills,
            deaths: item.parsed.deaths,
            assists: item.parsed.assists,
            damage: item.parsed.damage,
            isMvp: item.parsed.mvp_status
          }
        };
      });

      const response: any = await api.post('/api/admin/match-stats/confirm', {
        tournamentId,
        matchId: matchId.trim() || undefined,
        gameType: gameType || selectedTournament?.game || 'Unknown',
        results
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to save match stats');
      }
      window.alert('Match stats saved');
    } catch (error: any) {
      window.alert(error?.message || 'Failed to save match stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Panel>
        <h2 style={{ marginTop: 0 }}>OCR Match Parser</h2>
        <Row>
          <Select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            <option value="">Select tournament</option>
            {tournaments.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.game})
              </option>
            ))}
          </Select>
          <Input
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Optional matchId"
          />
        </Row>
        <Drop>
          <strong>Drag & drop screenshot</strong> or click
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div style={{ marginTop: 8, color: '#ccc', fontSize: 12 }}>
            {file ? `Selected: ${file.name}` : 'No file selected'}
          </div>
        </Drop>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <Button onClick={onUpload} disabled={loading || !file || !tournamentId}>
            {loading ? 'Parsing...' : 'Parse screenshot'}
          </Button>
          <Button $variant="secondary" onClick={onConfirm} disabled={loading || !suggestions.length}>
            Confirm & Save to DB
          </Button>
        </div>
      </Panel>

      {!!suggestions.length && (
        <Panel>
          <h3 style={{ marginTop: 0 }}>Verification</h3>
          <Table>
            <thead>
              <tr>
                <th>Screenshot Data</th>
                <th>Matched Platform User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((item, index) => {
                const selectedUserId = manualMap[index] || item.matchedUserId || '';
                const selectedUser = candidates.find((row) => row.userId === selectedUserId);
                const status = item.confidence >= 0.8 ? 'green' : 'yellow';
                return (
                  <tr key={`${item.parsed.nickname}-${index}`}>
                    <td>
                      <strong>{item.parsed.nickname}</strong>
                      <div>K/D/A: {item.parsed.kills}/{item.parsed.deaths}/{item.parsed.assists}</div>
                      <div>DMG: {item.parsed.damage} • MVP: {item.parsed.mvp_status ? 'yes' : 'no'}</div>
                    </td>
                    <td>
                      <Select
                        value={selectedUserId}
                        onChange={(e) => setManualMap((prev) => ({ ...prev, [index]: e.target.value }))}
                      >
                        <option value="">No match</option>
                        {candidates.map((candidate) => (
                          <option key={candidate.userId} value={candidate.userId}>
                            {candidate.displayName} • {candidate.ingameNickname} • {candidate.ingameId}
                          </option>
                        ))}
                      </Select>
                      {selectedUser && (
                        <div style={{ marginTop: 6, color: '#bbb' }}>
                          Platform ID: {selectedUser.userId}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 8,
                          background: status === 'green' ? 'rgba(76,175,80,0.2)' : 'rgba(255,193,7,0.2)',
                          color: status === 'green' ? '#81c784' : '#ffd54f'
                        }}
                      >
                        {status === 'green' ? 'Green' : 'Yellow'} ({Math.round(item.confidence * 100)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      )}
    </Wrapper>
  );
};

export default AdminOcrPage;
