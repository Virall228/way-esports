export const generateWayId = (username: string): string => {
    // Current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Take last 4 digits of timestamp
    const timeCode = timestamp.toString().slice(-4);
    
    // Generate a random 2-digit number
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    // Combine all parts: WAY prefix + username (max 8 chars) + time code + random number
    const formattedUsername = username.toLowerCase().slice(0, 8);
    
    return `WAY_${formattedUsername}_${timeCode}${randomNum}`;
};

// Function to validate WAY ID format
export const isValidWayId = (id: string): boolean => {
    const wayIdPattern = /^WAY_[a-z0-9]{1,8}_\d{6}$/;
    return wayIdPattern.test(id);
};

// Function to extract username from WAY ID
export const getUsernameFromWayId = (wayId: string): string | null => {
    const match = wayId.match(/^WAY_([a-z0-9]{1,8})_\d{6}$/);
    return match ? match[1] : null;
}; 