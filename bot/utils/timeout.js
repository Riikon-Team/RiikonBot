export const handleTimeout = (timeouts, userId, cooldownTime) => {
    const now = Date.now();
    
    if (timeouts.has(userId)) {
        const expirationTime = timeouts.get(userId);
        
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return { onCooldown: true, timeLeft: Math.ceil(timeLeft) };
        }
    }
    
    timeouts.set(userId, now + cooldownTime);
    
    setTimeout(() => {
        timeouts.delete(userId);
    }, cooldownTime);
    
    return { onCooldown: false, timeLeft: 0 };
};

export const formatTimeLeft = (seconds) => {
    if (seconds < 60) {
        return `${seconds} giây`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} phút ${remainingSeconds} giây`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours} giờ ${minutes} phút`;
    }
};