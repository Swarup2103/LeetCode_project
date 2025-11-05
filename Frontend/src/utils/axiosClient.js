import axios from 'axios';
//for giving base url
const axiosClient = axios.create({
    baseURL : 'http://localhost:3000',  //Backend hosted on port 3000
    withCredentials : true,             //attach cookies
    headers : {
        'Content-Type' : 'application/json' //data is in json format
    }
});

export default axiosClient; 