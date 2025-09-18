import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #ff6b00;
  }
`;

const Title = styled.h2`
  color: #ffffff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  color: #ffffff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  &::placeholder {
    color: #666666;
  }
`;

const Select = styled.select`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  color: #ffffff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: ${({ theme }) => theme.colors.background};
    color: #ffffff;
  }
`;

const TextArea = styled.textarea`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  color: #ffffff;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  &::placeholder {
    color: #666666;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #ff6b00;
`;

const CheckboxLabel = styled.label`
  color: #cccccc;
  font-size: 0.9rem;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #ff6b00, #ff4757);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 107, 0, 0.4);
    }
  ` : `
    background: transparent;
    color: #cccccc;
    border: 1px solid #666666;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #ff6b00;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  font-size: 0.9rem;
  margin-top: 5px;
`;

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamData: any) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam }) => {
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: '',
    description: '',
    isPrivate: false,
    requiresApproval: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    }

    if (!formData.tag.trim()) {
      newErrors.tag = 'Team tag is required';
    } else if (formData.tag.length < 2 || formData.tag.length > 5) {
      newErrors.tag = 'Team tag must be 2-5 characters';
    }

    if (!formData.game) {
      newErrors.game = 'Please select a game';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCreateTeam(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        tag: '',
        game: '',
        description: '',
        isPrivate: false,
        requiresApproval: true
      });
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>Create New Team</Title>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter team name"
              maxLength={50}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="tag">Team Tag *</Label>
            <Input
              id="tag"
              name="tag"
              type="text"
              value={formData.tag}
              onChange={handleInputChange}
              placeholder="e.g., WAY, PRO, etc."
              maxLength={5}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.tag && <ErrorMessage>{errors.tag}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="game">Primary Game *</Label>
            <Select
              id="game"
              name="game"
              value={formData.game}
              onChange={handleInputChange}
            >
              <option value="">Select a game</option>
              <option value="cs2">Counter-Strike 2</option>
              <option value="valorant">Valorant</option>
              <option value="critical-ops">Critical Ops</option>
              <option value="pubg-mobile">PUBG Mobile</option>
              <option value="apex-legends">Apex Legends</option>
              <option value="rainbow-six">Rainbow Six Siege</option>
            </Select>
            {errors.game && <ErrorMessage>{errors.game}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Team Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell others about your team, goals, and requirements..."
              maxLength={500}
            />
          </FormGroup>

          <FormGroup>
            <CheckboxGroup>
              <Checkbox
                id="isPrivate"
                name="isPrivate"
                type="checkbox"
                checked={formData.isPrivate}
                onChange={handleInputChange}
              />
              <CheckboxLabel htmlFor="isPrivate">
                Make team private (invite only)
              </CheckboxLabel>
            </CheckboxGroup>
          </FormGroup>

          <FormGroup>
            <CheckboxGroup>
              <Checkbox
                id="requiresApproval"
                name="requiresApproval"
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={handleInputChange}
              />
              <CheckboxLabel htmlFor="requiresApproval">
                Require approval for new members
              </CheckboxLabel>
            </CheckboxGroup>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" $variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" $variant="primary">
              Create Team
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateTeamModal;