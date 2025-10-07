const Problem = require('../models/problem');
const Submission = require('../models/submission');
const {getLanguageById, submitBatch, submitToken} = require('../utils/problemUtility');

const submitCode = async(req,res) =>{
    try{
        const userId = req.result._id;
        const problemId = req.params.id;

        const{code, language} = req.body;

        if(!userId || !code || !problemId || !language)
            return res.status(400).send("Some Field is Missing...");

        const problem = await Problem.findById(problemId);
        //now we can access hidden testcases

        //firstly save submitted code to DB, status: pending
        //because if  judge0 not gace any result then we might miss that submission
        //when judge0 gave result then we update that in DB
        const submittedResult = await Submission.create({
            userId, problemId, code, language, 
            testCasesTotal: problem.hiddenTestCases.length,
            status: 'pending'
        })

        const langId = getLanguageById(language);
            
            //ip & op
            //creating Batch Submission
        const submission = problem.hiddenTestCases.map((testcase)=>({
            source_code: code,
            language_id: langId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submission); //object of {tokens:...., token:....}

        const resultToken = submitResult.map((val)=> (val.token)); //array of tokens [ ... , ...]

        const testResult = await submitToken(resultToken);

        //submit how many testcases passed
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted'
        let errorMessage = null;

        for(const test of testResult){
            if(test.status_id == 3){
                testCasesPassed++;
                runtime += parseFloat(test.runtime);
                memory = Math.max(memory, test.memory);
            } else {
                if(test.status_id == 4){
                    status = 'error'
                    errorMessage = test.stderr;
                }
                else{
                    status = 'wrong';
                    errorMessage = test.stderr;
                }
            }
        }

        //store result in DB
        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;

        await submittedResult.save();

        //after submitting code.. 
        //we need to save problemId in userSchema(solvedProblem)
        //if it is not present there else not
        if(!req.result.problemSolved.includes(problemId)){
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }

        res.status(201).send('Submitted Successfully...');


    }
    catch(err){
        res.status(500).send('Internal Server Error..' +err);
    }
}

const runCode = async(req,res) =>{
    try{
        const userId = req.result._id;
        const problemId = req.params.id;

        const{code, language} = req.body;

        if(!userId || !code || !problemId || !language)
            return res.status(400).send("Some Field is Missing...");

        const problem = await Problem.findById(problemId);
        //now we can access hidden testcases

        const langId = getLanguageById(language);
            
            //ip & op
            //creating Batch Submission
        const submission = problem.visibleTestCases.map((testcase)=>({
            source_code: code,
            language_id: langId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submission); //object of {tokens:...., token:....}

        const resultToken = submitResult.map((val)=> (val.token)); //array of tokens [ ... , ...]

        const testResult = await submitToken(resultToken);

        //testResult is an Array of Objrcts... => [ {}, {}, {} ]
        //***to traverse array elemnts we use map here...
        const showResult = testResult.map((r) => ({
            source_code: r.source_code,
            stdin: r.stdin,
            expected_output: r.expected_output,
            stdout: r.stdout,
            status_id: r.status_id,
            time: r.time,
            memory: r.memory,
            status: r.status,
        }));

        res.status(201).send(showResult);
    }
    catch(err){
        res.status(500).send('Internal Server Error..' +err);
    }
}

module.exports = {submitCode, runCode};