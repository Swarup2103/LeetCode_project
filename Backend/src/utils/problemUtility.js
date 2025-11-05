const axios = require('axios');

const getLanguageById = (lang) =>{
    const language = {
        "cpp" : 54,
        "java" : 62,
        "javascript" : 63
    }

    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions) => {
    const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
        base64_encoded: 'false'
    },
    headers: {
        'x-rapidapi-key': '4c0234e970msh14100b7267776a3p110ffajsnd3dfb297eeae',
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
    },
    data: {
        submissions
    }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    return await fetchData();
}
    const waiting = async (timer)=>{
        setTimeout(()=>{
            return 1; //we can return any val 
        }, timer)
    }

const submitToken = async (resultToken) => {
    const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
        tokens: resultToken.join(","),      //array of string seperated by comma
        base64_encoded: 'false',
        fields: '*'
    },
    headers: {
        'x-rapidapi-key': '4c0234e970msh14100b7267776a3p110ffajsnd3dfb297eeae',
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }


    while(true){
        const result = await fetchData();

        //check is result 1 or 2... we need 3
        const isResultObtain = result.submissions.every((r)=> r.status_id > 2);

        if(isResultObtain)
            return result.submissions;
        
        await waiting(1000);
    }
}

module.exports = {getLanguageById, submitBatch, submitToken};