const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../models/user')

const userMiddleware = async (req, res, next)=>{
    try{
        const {token} = req.cookies;
        if(!token) 
            throw new Error('Token is NOT Present');

        //check that token is valid or not
        const payload = jwt.verify(token, process.env.JWT_KEY);
        const {_id} = payload;

        if(!_id)
            throw new Error('ID is Missing');

        const result = await User.findById(_id);
        if(!result)
            throw new Error("User doesn't exist");

        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked)
            throw new Error('Blocked token');

        req.result = result;
        //res.send();
        next();
    }
    catch(err){
        // FIX: The catch block MUST send a response to the client.
        // This handles errors like an expired or malformed JWT.
        console.error('Middleware Error:', err.message); // Log the actual error for debugging
        return res.status(401).json({ message: 'Authentication failed: Invalid or expired token.' });
    }

}
module.exports = userMiddleware; 