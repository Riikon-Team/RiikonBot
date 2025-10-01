const GetBioFromUser = (users =[]) => {
    return users.map(user => {
        return {
            id: user.id,
            bio: user.bio || "No bio available"
        };
    });
};

const funcs = {
    
};

export default funcs