const express = require('express');
const {register, login, logout, adminRegister, deleteProfile} = require('../controllers/userAuthent');
const userMiddleware = require('../middleware/userMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')

const authRouter = express.Router();

//register
//login
//logout
//getProfile
authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/logout',userMiddleware,logout);
authRouter.post('/admin/register', adminMiddleware, adminRegister);
authRouter.post('/deleteProfile', userMiddleware, deleteProfile);
authRouter.get('/check', userMiddleware, (req, res) => {
    const reply = {
        firstName : req.result.firstName,
        emailId : req.result.emailId,
        _id : req.result._id,
        role : req.result.role
    }
    res.status(200).json({
        user : reply,
        message : "Valid User..."
    })
})
//authRouter.get('getProfile',getProfile);


module.exports = authRouter;