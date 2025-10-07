const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {createProblem, updateProblem, deleteProblem, getProblemById, getAllProblems, solvedAllProblemsByUser, submittedProblem} = require('../controllers/userProlem');


//with Admin access
problemRouter.post('/create',adminMiddleware, createProblem);
problemRouter.patch('/update/:id',adminMiddleware, updateProblem);
problemRouter.delete('/delete/:id',adminMiddleware, deleteProblem);

//with user access
problemRouter.get('/problemById/:id',userMiddleware, getProblemById);
problemRouter.get('/getAllProblems',userMiddleware, getAllProblems);
problemRouter.get('/problemSolvedByUser',userMiddleware, solvedAllProblemsByUser);
problemRouter.get('/submittedProblem/:pid', userMiddleware, submittedProblem);
 

module.exports = problemRouter;

/*
Problem.find({
  votes: { $gte : 100},
  tags: {$in: ["array", "hashmap"]}
})

$eq => equals to
$ne => not equals
$gt => greater than
$gte => greater than equals to
$lt => less than
$lte => ---''--- equals to
$in => match any value in array
$nin => exculde values in an array
 */