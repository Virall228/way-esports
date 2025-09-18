export interface RoomCredentials {
    roomId: string;
    password: string;
    map: string;
    team1: string;
    team2: string;
    startTime: Date;
}

// Critical Ops maps pool
export const CRITICAL_OPS_MAPS = [
    'Bureau',
    'Canals',
    'Plaza',
    'Port',
    'Grounded',
    'Legacy',
    'Raid',
    'Zone 9'
];

// Function to generate random room ID
export const generateRoomId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Function to generate random password
export const generatePassword = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Function to randomly select a map
export const selectRandomMap = (excludeMaps: string[] = []): string => {
    const availableMaps = CRITICAL_OPS_MAPS.filter(map => !excludeMaps.includes(map));
    return availableMaps[Math.floor(Math.random() * availableMaps.length)];
};

// Function to generate room credentials
export const generateRoomCredentials = (
    team1: string,
    team2: string,
    startTime: Date,
    excludeMaps: string[] = []
): RoomCredentials => {
    return {
        roomId: generateRoomId(),
        password: generatePassword(),
        map: selectRandomMap(excludeMaps),
        team1,
        team2,
        startTime
    };
};

// Function to check if it's time to distribute room credentials
export const shouldDistributeCredentials = (startTime: Date): boolean => {
    const now = new Date();
    const timeUntilStart = startTime.getTime() - now.getTime();
    // Return true if within 5 minutes of start time
    return timeUntilStart <= 5 * 60 * 1000 && timeUntilStart > 0;
};

// Function to validate and join a tournament room
export const joinTournamentRoom = async (roomId: string, password: string): Promise<void> => {
    if (!roomId || !password) {
        throw new Error('Room ID and password are required');
    }

    if (roomId.length !== 6) {
        throw new Error('Invalid room ID format');
    }

    if (password.length !== 8) {
        throw new Error('Invalid password format');
    }

    try {
        const response = await fetch('/api/tournament-rooms/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to join room');
        }
    } catch (error) {
        throw new Error('Failed to connect to the room. Please check your credentials and try again.');
    }
}; 