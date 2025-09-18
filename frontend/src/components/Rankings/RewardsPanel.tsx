import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

// Styled components
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 1rem;
`;

const Text = styled.p`
  color: #cccccc;
  margin-bottom: 1rem;
`;

const VStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HStack = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Box = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const Badge = styled.span`
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const Spinner = styled.div`
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #333;
  margin: 1rem 0;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  background-color: #1a1a1a;
  margin: 15% auto;
  padding: 2rem;
  border: 1px solid #333;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
`;

const ModalHeader = styled.h2`
  color: #ffffff;
  margin-bottom: 1rem;
`;

const ModalBody = styled.div`
  margin-bottom: 1rem;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  font-size: 1.5rem;
  cursor: pointer;
  float: right;
  
  &:hover {
    color: #ffffff;
  }
`;

const FormControl = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #333;
  border-radius: 4px;
  background: #262626;
  color: #ffffff;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const FormHelperText = styled.p`
  color: #666;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const NumberInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NumberInputField = styled.input`
  width: 100px;
  padding: 0.5rem;
  border: 1px solid #333;
  border-radius: 4px;
  background: #262626;
  color: #ffffff;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const NumberInputStepper = styled.div`
  display: flex;
  flex-direction: column;
`;

const NumberIncrementStepper = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.25rem;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background: #0056b3;
  }
`;

const NumberDecrementStepper = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background: #c82333;
  }
`;

// Custom hooks for modal and toast
const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  return { isOpen, onOpen, onClose };
};

const useToast = () => {
  return {
    toast: (options: any) => {
      // Simple toast implementation
      console.log('Toast:', options);
    }
  };
};

interface CurrencyDetails {
  amount: number;
  currency: 'USD';
  minWithdrawal?: number;
  maxWithdrawal?: number;
  withdrawalFee?: number;
}

interface Reward {
  _id: string;
  name: string;
  description: string;
  type: 'currency' | 'item' | 'badge' | 'title' | 'skin';
  value: number;
  currencyDetails?: CurrencyDetails;
  imageUrl?: string;
  requirements: {
    minRank?: number;
    minLevel?: number;
    minWins?: number;
  };
  expiresAt?: string;
}

interface PlayerReward {
  _id: string;
  rewardId: Reward;
  earnedAt: string;
  claimedAt?: string;
  expiresAt?: string;
  status: 'earned' | 'claimed' | 'expired';
}

interface TeamReward {
  _id: string;
  rewardId: Reward;
  earnedAt: string;
  claimedAt?: string;
  expiresAt?: string;
  status: 'earned' | 'claimed' | 'expired';
  distribution: {
    userId: string;
    share: number;
    claimedAt?: string;
  }[];
}

const RewardsPanel: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [playerRewards, setPlayerRewards] = useState<PlayerReward[]>([]);
  const [teamRewards, setTeamRewards] = useState<TeamReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<PlayerReward | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [withdrawalFee, setWithdrawalFee] = useState<number>(0);

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    if (selectedReward?.rewardId.currencyDetails) {
      const fee = (withdrawalAmount * (selectedReward.rewardId.currencyDetails.withdrawalFee || 0)) / 100;
      setWithdrawalFee(parseFloat(fee.toFixed(2)));
    }
  }, [withdrawalAmount, selectedReward]);

  const fetchRewards = async () => {
    try {
      const [availableRes, playerRes, teamRes] = await Promise.all([
        api.get('/valorant-mobile/rewards/available'),
        api.get('/valorant-mobile/rewards/player'),
        api.get(`/valorant-mobile/rewards/team/${user.teamId || 'default'}`),
      ]);

      setAvailableRewards(availableRes.data.rewards);
      setPlayerRewards(playerRes.data.rewards);
      setTeamRewards(teamRes.data.rewards);
    } catch (error: any) {
      toast.toast({
        title: 'Error fetching rewards',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (reward: PlayerReward) => {
    try {
      await api.post(`/valorant-mobile/rewards/claim/${reward._id}`, {});
      toast.toast({
        title: 'Reward claimed successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchRewards();
    } catch (error: any) {
      toast.toast({
        title: 'Error claiming reward',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleWithdraw = async () => {
    if (!selectedReward) return;
    
    try {
      await api.post(`/valorant-mobile/rewards/withdraw/${selectedReward._id}`, {
        amount: withdrawalAmount
      });
      
      toast.toast({
        title: 'Withdrawal successful!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
      fetchRewards();
    } catch (error: any) {
      toast.toast({
        title: 'Error processing withdrawal',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <VStack>
          <Spinner />
          <Text>Loading rewards...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container>
      <Heading>Rewards & Achievements</Heading>
      
      <VStack>
        <Box>
          <Heading style={{ fontSize: '1.5rem' }}>Available Rewards</Heading>
          <VStack>
            {availableRewards.map((reward) => (
              <Box key={reward._id}>
                <HStack>
                  <VStack style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{reward.name}</Text>
                    <Text>{reward.description}</Text>
                    <Badge>{reward.type}</Badge>
                  </VStack>
                  <Button onClick={() => handleClaimReward(reward as any)}>
                    Claim
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading style={{ fontSize: '1.5rem' }}>Your Rewards</Heading>
          <VStack>
            {playerRewards.map((reward) => (
              <Box key={reward._id}>
                <HStack>
                  <VStack style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{reward.rewardId.name}</Text>
                    <Text>{reward.rewardId.description}</Text>
                    <Badge>{reward.status}</Badge>
                  </VStack>
                  {reward.status === 'earned' && reward.rewardId.type === 'currency' && (
                    <Button onClick={() => {
                      setSelectedReward(reward);
                      onOpen();
                    }}>
                      Withdraw
                    </Button>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>

      <Modal isOpen={isOpen}>
        <ModalContent>
          <ModalHeader>Withdraw Funds</ModalHeader>
          <ModalCloseButton onClick={onClose}>&times;</ModalCloseButton>
          <ModalBody>
            <FormControl>
              <FormLabel>Amount</FormLabel>
              <NumberInput>
                <NumberInputField
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                  min={0}
                  max={selectedReward?.rewardId.currencyDetails?.amount || 0}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper onClick={() => setWithdrawalAmount(prev => prev + 1)}>+</NumberIncrementStepper>
                  <NumberDecrementStepper onClick={() => setWithdrawalAmount(prev => Math.max(0, prev - 1))}>-</NumberDecrementStepper>
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Fee: ${withdrawalFee.toFixed(2)}
              </FormHelperText>
            </FormControl>
            <Button onClick={handleWithdraw} style={{ width: '100%' }}>
              Confirm Withdrawal
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RewardsPanel; 