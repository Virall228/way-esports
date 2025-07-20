export interface TeamTag {
    id: string;
    name: string;
    tag: string;
    color: string;
    createdAt: Date;
}

// Predefined team colors
export const TEAM_COLORS = {
    WAY: '#FF6B00',  // WAY Esports Orange
    NAVI: '#FFF200', // NAVI Yellow
    RED: '#FF4444',
    BLUE: '#4444FF',
    GREEN: '#44FF44',
    PURPLE: '#9944FF',
    GOLD: '#FFD700',
    CYAN: '#00FFFF'
};

// Function to generate a team ID
export const generateTeamId = (tag: string): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${tag}_${timestamp.toString().slice(-4)}${randomNum}`;
};

// Function to validate team tag format
export const isValidTeamTag = (tag: string): boolean => {
    // Team tags should be 2-4 uppercase letters
    return /^[A-Z]{2,4}$/.test(tag);
};

// Function to format team tag with brackets
export const formatTeamTag = (tag: string): string => {
    return `[${tag}]`;
};

// Function to create a new team
export const createTeam = (name: string, tag: string, color: string = TEAM_COLORS.WAY): TeamTag => {
    if (!isValidTeamTag(tag)) {
        throw new Error('Invalid team tag format. Tag must be 2-4 uppercase letters.');
    }

    return {
        id: generateTeamId(tag),
        name,
        tag,
        color,
        createdAt: new Date()
    };
};

// Function to generate display name with team tag
export const getDisplayNameWithTag = (username: string, teamTag?: TeamTag): string => {
    if (!teamTag) return username;
    return `${formatTeamTag(teamTag.tag)} ${username}`;
}; 