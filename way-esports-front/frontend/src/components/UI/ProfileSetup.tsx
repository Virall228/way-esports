import React, { useState } from 'react';
import styled from 'styled-components';
import Card from './Card';
import Input from './Input';
import Button from './Button';

interface ProfileSetupProps {
  onComplete: (data: ProfileData) => void;
  selectedGame: 'CS2' | 'CriticalOps' | 'PUBG';
}

interface ProfileData {
  username: string;
  gameUsername: string;
  email: string;
  country: string;
  teamPreference: 'solo' | 'findTeam' | 'createTeam';
}

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TeamPreferenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PreferenceCard = styled(Card)<{ selected?: boolean }>`
  cursor: pointer;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid transparent;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ selected, theme }) => selected && `
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 15px ${theme.colors.accent}33;
  `}

  &:hover {
    transform: translateY(-2px);
  }
`;

const PreferenceIcon = styled.div`
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.accent};
`;

const PreferenceTitle = styled.h4`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PreferenceDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const teamPreferences = [
  {
    id: 'solo',
    icon: '\u{1F3AE}',
    title: 'Play Solo',
    description: 'Compete individually in tournaments'
  },
  {
    id: 'findTeam',
    icon: '\u{1F50D}',
    title: 'Find a Team',
    description: 'Join an existing team'
  },
  {
    id: 'createTeam',
    icon: '\u{1F465}',
    title: 'Create Team',
    description: 'Start your own team'
  }
] as const;

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, selectedGame }) => {
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    gameUsername: '',
    email: '',
    country: '',
    teamPreference: 'solo'
  });

  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }
    if (!formData.gameUsername) {
      newErrors.gameUsername = 'Game username is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleChange = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Input
            label="Username"
            placeholder="Choose your WAY Esports username"
            value={formData.username}
            onChange={handleChange('username')}
            error={errors.username}
            fullWidth
          />
          
          <Input
            label={`${selectedGame} Username`}
            placeholder="Enter your in-game username"
            value={formData.gameUsername}
            onChange={handleChange('gameUsername')}
            error={errors.gameUsername}
            fullWidth
          />
          
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            fullWidth
          />
          
          <Input
            label="Country"
            placeholder="Enter your country"
            value={formData.country}
            onChange={handleChange('country')}
            fullWidth
          />
        </InputGroup>

        <div>
          <h3>Team Preference</h3>
          <TeamPreferenceGrid>
            {teamPreferences.map((pref) => (
              <PreferenceCard
                key={pref.id}
                selected={formData.teamPreference === pref.id}
                onClick={() => setFormData({ ...formData, teamPreference: pref.id })}
              >
                <PreferenceIcon>{pref.icon}</PreferenceIcon>
                <PreferenceTitle>{pref.title}</PreferenceTitle>
                <PreferenceDescription>{pref.description}</PreferenceDescription>
              </PreferenceCard>
            ))}
          </TeamPreferenceGrid>
        </div>

        <Button type="submit" fullWidth>
          Complete Setup
        </Button>
      </Form>
    </Container>
  );
};

export default ProfileSetup; 
