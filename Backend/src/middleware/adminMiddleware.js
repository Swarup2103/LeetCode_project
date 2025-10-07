const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../models/user')

const adminMiddleware = async (req, res, next)=>{
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

        //admin or not
        if(payload.role != "admin")
            throw new Error("Invalid Token..");

        /*
        also possible
        if(req.result.role != 'admin')
            throw new Error("Invalid Token..");
        */

        req.result = result;
        //res.send();
        next();
    }
    catch(err){
        console.log('Error: '+err);
    }

}
module.exports = adminMiddleware; 