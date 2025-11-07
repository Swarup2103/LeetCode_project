const {getLanguageById, submitBatch, submitToken} = require('../utils/problemUtility');
const Problem = require('../models/problem');
const User = require('../models/user');
const { findById } = require('../models/user');
const Submission = require('../models/submission');
const SolutionVideo = require('../models/solutionVideo')

const createProblem = async(req, res) =>{
    const {title, description, difficulty, tags, 
        visibleTestCases, hiddenTestCases, startCode, referenceSolution} = req.body;
    
    //first need to check that refSolCode pass every testcases for all language codes
    //input ==> code ==> output..... for that we require "Judge0"
    //we give {language, code, ip, op} to "judge0" 
    //{source_code, language_id, stdin, expected_output}.... this is format

    try{
        //for-of loop on array
        //Axios ==> build on fetch, easy to use, have some more advantages
        for(const {language, completeCode} of referenceSolution){

            //source_code
            
            //langId
            const langId = getLanguageById(language);
            
            //ip & op
            //creating Batch Submission
            const submission = visibleTestCases.map((testcase)=>({
                source_code: completeCode,
                language_id: langId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult = await submitBatch(submission);
            console.log(submitResult); //result = array of tokens
            //send token to judge0 using get request.. if status_id: 3 = Accepted
            //check status_id for each testcase

            const resultToken = submitResult.map((val)=> val.token);
            //console.log(resultToken);
            const testResult = await submitToken(resultToken);
            //console.log(testResult);

            for(const test of testResult){
              if(test.status_id!= 3){
                return res.status(400).send("Error occured...")
              }
            }

        }

        //after complete execution of "for loop"
        //now we can store it in our db
        const userProblem = await Problem.create({
          ...req.body,
          problemCreator: req.result._id
        });

        res.status(201).send("Problem Saved Successfully...");

    }
    catch(err){
      res.status(400).send("Error: "+err);
    }
}

const updateProblem = async (req, res)=> {
  const {id} = req.params;
  const {title, description, difficulty, tags, 
        visibleTestCases, hiddenTestCases, startCode, referenceSolution} = req.body;

  try{

    if(!id){
      return res.status(400).send('Invalid Id..')
    }

    //Check that id is present in db ot not
    const dsaProblem = await Problem.findById(id);
    if(!dsaProblem){
      return res.status(404).send('ID is not present in server..')
    }
    //firstly check data came from frontend is right or not... then same as create problem..
    for(const {language, completeCode} of referenceSolution){

            //source_code
            
            //langId
            const langId = getLanguageById(language);
            
            //ip & op
            //creating Batch Submission
            const submission = visibleTestCases.map((testcase)=>({
                source_code: completeCode,
                language_id: langId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult = await submitBatch(submission);
            console.log(submitResult); //result = array of tokens
            //send token to judge0 using get request.. if status_id: 3 = Accepted
            //check status_id for each testcase

            const resultToken = submitResult.map((val)=> val.token);
            //console.log(resultToken);
            const testResult = await submitToken(resultToken);
            //console.log(testResult);

            for(const test of testResult){
              if(test.status_id!= 3){
                return res.status(400).send("Error occured...")
              }
            }

        }
    
    const newProblem = await Problem.findByIdAndUpdate(id, {...req.body}, {runValidators: true, new: true});
                                                          //run validaotrs, give updated document
    res.status(200).send(newProblem);

  }

  catch(err) {
    res.status(400).send('Error: '+err);
  }
}

const deleteProblem = async (req, res)=> {
  const {id} = req.params;

  try{

    if(!id){
      return res.status(400).send('ID is Missing..');
    }

    const dsaProblem = await Problem.findById(id);
    if(!dsaProblem){
      return res.status(404).res('ID not present in server..');
    }

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if(!deletedProblem){
      return res.status(404).send('Problem is Missing..');
    }

    res.status(200).send('Successfully deleted..');

  }
  catch(err){
    res.status(500).send('Error: '+err);
  }
}

const getProblemById = async(req, res) =>{
  const {id} = req.params;
  try{
    if(!id)
      return res.status(400).send('ID is Missing..');

    const getProblem = await Problem.findById(id).select('title description difficulty tags visibleTestCases startCode referenceSolution');
    if(!getProblem)
      return res.status(404).send('Problem is Missing..');
    // video ka jo bhi url wagera le aao
    const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send('Error: '+err);
  }
}

const getAllProblems = async(req, res)=> {
  try{
    //const getProblems = await Problem.find({});
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1)* limit;
    const getProblems = await Problem.find({}).select('title difficulty tags');
    //const getProblems = await Problem.find({}).skip(skip).limit(limit);

    if(getProblems.length == 0) //beacuse it return an array
      return res.status(404).send(getProblems);

    res.status(200).json({ problems : getProblems});
  }
  catch(err){
    res.status(500).send('Error: '+err);
  }
}

const solvedAllProblemsByUser = async(req, res) => {
  try{
    const userId = req.result._id;

    const user = await User.findById(userId).populate({
      path: 'problemSolved',
      select: "_id"
    });

    const solvedProblemIds = user.problemSolved.map(p => p._id);

    res.status(200).json({ solvedProblems : solvedProblemIds});
  }
  catch(err){
    res.status(500).send("Server Error");
  }
}

const submittedProblem = async(req, res)=> {
  try{
    const userId = req.result._id;
    const problemId = req.params.pid;

    const answer = await Submission.find({userId, problemId})
    .populate({
      path: 'problemId',
      select: "title difficulty tags"
    })
    //select('title difficulty tags status');

    if(answer.length == 0){
      res.status(200).send('No any Submissions..');
    }

    res.status(200).send(answer);
  }
  catch(err){
    res.status(500).send('Internal Server Error: ',err);
  }
}

const getAllUserSubmissions = async (req, res) => {
  try {
    const userId = req.result._id;

    const submissions = await Submission.find({ userId })
      .populate({
        path: 'problemId',
        select: 'title', // We only need the problem title
      })
      .sort({ createdAt: -1 }); // Sort by most recent first

    if (!submissions) {
      return res.status(200).json([]);
    }

    res.status(200).json(submissions);
  } catch (err) {
    console.error('Error fetching all user submissions:', err);
    res.status(500).send('Internal Server Error');
  }
};



module.exports = {createProblem, updateProblem, deleteProblem, getProblemById, getAllProblems, solvedAllProblemsByUser, submittedProblem, getAllUserSubmissions};


/*
{
    "id": 54,
    "name": "cpp (GCC 9.2.0)"
}

{
    "id": 63,
    "name": "JavaScript (Node.js 12.14.0)"
}

{
    "id": 91,
    "name": "Java (JDK 17.0.6)"
}
*/

/*
status_id < 3 ==> hit api request again
status_id and its value:-
[
  {
    "id": 1,
    "description": "In Queue"
  },
  {
    "id": 2,
    "description": "Processing"
  },
  {
    "id": 3,
    "denscription": "Accepted"
  },
  {
    "id": 4,
    "description": "Wrong Answer"
  },
  {
    "id": 5,
    "description": "Time Limit Exceeded"
  },
  {
    "id": 6,
    "description": "Compilation Error"
  },
  {
    "id": 7,
    "description": "Runtime Error (SIGSEGV)"
  },
  {
    "id": 8,
    "description": "Runtime Error (SIGXFSZ)"
  },
  {
    "id": 9,
    "description": "Runtime Error (SIGFPE)"
  },
  {
    "id": 10,
    "description": "Runtime Error (SIGABRT)"
  },
  {
    "id": 11,
    "description": "Runtime Error (NZEC)"
  },
  {
    "id": 12,
    "description": "Runtime Error (Other)"
  },
  {
    "id": 13,
    "description": "Internal Error"
  },
  {
    "id": 14,
    "description": "Exec Format Error"
  }
]

*/