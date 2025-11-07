const express = require('express');
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemRoute');
const submitRouter = require('./routes/submit');
const aiRouter = require('./routes/aiChatting');
const videoRouter = require('./routes/videoCreator');
const cors = require('cors'); 


const app = express();

// 2. Configure and use cors middleware
// The origin should match your frontend's URL. credentials: true is needed for cookies.
app.use(cors({
    origin: 'http://localhost:5173', // or your frontend's port
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission',submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);

const initializeConnection = async ()=>{
    try{
        await Promise.all([main(), redisClient.connect()]);
        console.log('DB & Redis is Connected...')

        app.listen(process.env.PORT, ()=>{
            console.log('Server is listening at Port: '+process.env.PORT);
        })
    }
    catch(err){
        console.log('Error: '+err);
    }
}

initializeConnection();
/*
main()
.then(async ()=>{
        app.listen(process.env.PORT, ()=> {
        console.log('Server listening st port: '+ process.env.PORT);
    })
})
.catch(err => console.log('Error occurred'+err));
*/


