import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  Badge,
  useToast,
  Spinner,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

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
        api.get(`/valorant-mobile/rewards/team/${user.teamId}`),
      ]);

      setAvailableRewards(availableRes.data.rewards);
      setPlayerRewards(playerRes.data.rewards);
      setTeamRewards(teamRes.data.rewards);
    } catch (error) {
      toast({
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

  const handleWithdrawal = async () => {
    if (!selectedReward) return;

    try {
      await api.post(`/valorant-mobile/rewards/player/withdraw/${selectedReward.rewardId._id}`, {
        amount: withdrawalAmount,
      });
      
      fetchRewards();
      onClose();
      toast({
        title: 'Withdrawal initiated successfully',
        description: `$${withdrawalAmount} will be sent to your account minus $${withdrawalFee} fee`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error processing withdrawal',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openWithdrawalModal = (reward: PlayerReward) => {
    setSelectedReward(reward);
    setWithdrawalAmount(reward.rewardId.currencyDetails?.minWithdrawal || 0);
    onOpen();
  };

  const claimPlayerReward = async (rewardId: string) => {
    try {
      await api.post(`/valorant-mobile/rewards/player/claim/${rewardId}`);
      fetchRewards();
      toast({
        title: 'Reward claimed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error claiming reward',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const claimTeamReward = async (rewardId: string) => {
    try {
      await api.post(`/valorant-mobile/rewards/team/claim/${rewardId}`);
      fetchRewards();
      toast({
        title: 'Team reward share claimed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error claiming team reward',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderRewardValue = (reward: Reward) => {
    if (reward.type === 'currency' && reward.currencyDetails) {
      return (
        <Text fontSize="sm" fontWeight="bold" color="green.500">
          ${reward.currencyDetails.amount.toFixed(2)}
        </Text>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Available Rewards */}
        <Box>
          <Heading size="md" mb={4}>Available Rewards</Heading>
          <HStack spacing={4} overflowX="auto" pb={2}>
            {availableRewards.map((reward) => (
              <Box
                key={reward._id}
                p={4}
                borderWidth={1}
                borderRadius="lg"
                minW="200px"
              >
                {reward.imageUrl && (
                  <Image
                    src={reward.imageUrl}
                    alt={reward.name}
                    boxSize="100px"
                    objectFit="cover"
                    mb={2}
                  />
                )}
                <Heading size="sm">{reward.name}</Heading>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {reward.description}
                </Text>
                {renderRewardValue(reward)}
                <Badge colorScheme={getRewardTypeColor(reward.type)} mb={2}>
                  {reward.type}
                </Badge>
                {reward.requirements && (
                  <VStack align="start" spacing={1} fontSize="sm">
                    {reward.requirements.minRank && (
                      <Text>Min Rank: {reward.requirements.minRank}</Text>
                    )}
                    {reward.requirements.minLevel && (
                      <Text>Min Level: {reward.requirements.minLevel}</Text>
                    )}
                    {reward.requirements.minWins && (
                      <Text>Min Wins: {reward.requirements.minWins}</Text>
                    )}
                  </VStack>
                )}
              </Box>
            ))}
          </HStack>
        </Box>

        <Divider />

        {/* Player Rewards */}
        <Box>
          <Heading size="md" mb={4}>Your Rewards</Heading>
          <VStack spacing={4} align="stretch">
            {playerRewards.map((reward) => (
              <Box
                key={reward._id}
                p={4}
                borderWidth={1}
                borderRadius="lg"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Heading size="sm">{reward.rewardId.name}</Heading>
                  <Text fontSize="sm" color="gray.600">
                    {reward.rewardId.description}
                  </Text>
                  {renderRewardValue(reward.rewardId)}
                  <Badge
                    colorScheme={getStatusColor(reward.status)}
                    mt={2}
                  >
                    {reward.status}
                  </Badge>
                </Box>
                {reward.status === 'earned' && (
                  reward.rewardId.type === 'currency' ? (
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={() => openWithdrawalModal(reward)}
                    >
                      Withdraw
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => claimPlayerReward(reward.rewardId._id)}
                    >
                      Claim
                    </Button>
                  )
                )}
              </Box>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Team Rewards */}
        {user.teamId && (
          <Box>
            <Heading size="md" mb={4}>Team Rewards</Heading>
            <VStack spacing={4} align="stretch">
              {teamRewards.map((reward) => (
                <Box
                  key={reward._id}
                  p={4}
                  borderWidth={1}
                  borderRadius="lg"
                >
                  <HStack justify="space-between" mb={2}>
                    <Box>
                      <Heading size="sm">{reward.rewardId.name}</Heading>
                      <Text fontSize="sm" color="gray.600">
                        {reward.rewardId.description}
                      </Text>
                      {renderRewardValue(reward.rewardId)}
                    </Box>
                    <Badge colorScheme={getStatusColor(reward.status)}>
                      {reward.status}
                    </Badge>
                  </HStack>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      Distribution
                    </Text>
                    {reward.distribution.map((share) => (
                      <HStack key={share.userId} justify="space-between">
                        <Text fontSize="sm">
                          {share.userId === user._id ? 'You' : 'Teammate'}
                        </Text>
                        <HStack>
                          <Text fontSize="sm">
                            {reward.rewardId.type === 'currency' && reward.rewardId.currencyDetails
                              ? `$${((reward.rewardId.currencyDetails.amount * share.share) / 100).toFixed(2)} (${share.share}%)`
                              : `${share.share}%`}
                          </Text>
                          {share.userId === user._id && !share.claimedAt && reward.status === 'earned' && (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => claimTeamReward(reward.rewardId._id)}
                            >
                              Claim Share
                            </Button>
                          )}
                          {share.claimedAt && (
                            <Badge colorScheme="green">Claimed</Badge>
                          )}
                        </HStack>
                      </HStack>
                    ))}
                  </Box>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Withdrawal Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Withdraw Funds</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedReward && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Available Balance</FormLabel>
                  <Text fontSize="xl" fontWeight="bold" color="green.500">
                    ${selectedReward.rewardId.currencyDetails?.amount.toFixed(2)}
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Withdrawal Amount</FormLabel>
                  <NumberInput
                    min={selectedReward.rewardId.currencyDetails?.minWithdrawal || 0}
                    max={selectedReward.rewardId.currencyDetails?.maxWithdrawal || selectedReward.rewardId.currencyDetails?.amount || 0}
                    value={withdrawalAmount}
                    onChange={(_, value) => setWithdrawalAmount(value)}
                    precision={2}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Min: ${selectedReward.rewardId.currencyDetails?.minWithdrawal}
                    {selectedReward.rewardId.currencyDetails?.maxWithdrawal && 
                      ` | Max: $${selectedReward.rewardId.currencyDetails.maxWithdrawal}`}
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Withdrawal Fee ({selectedReward.rewardId.currencyDetails?.withdrawalFee}%)</FormLabel>
                  <Text>${withdrawalFee}</Text>
                </FormControl>

                <FormControl>
                  <FormLabel>You Will Receive</FormLabel>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    ${(withdrawalAmount - withdrawalFee).toFixed(2)}
                  </Text>
                </FormControl>

                <Button
                  colorScheme="green"
                  width="full"
                  mt={4}
                  onClick={handleWithdrawal}
                  isDisabled={withdrawalAmount <= 0}
                >
                  Confirm Withdrawal
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const getRewardTypeColor = (type: string) => {
  switch (type) {
    case 'currency':
      return 'green';
    case 'item':
      return 'purple';
    case 'badge':
      return 'blue';
    case 'title':
      return 'yellow';
    case 'skin':
      return 'pink';
    default:
      return 'gray';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'earned':
      return 'yellow';
    case 'claimed':
      return 'green';
    case 'expired':
      return 'red';
    default:
      return 'gray';
  }
};

export default RewardsPanel; 