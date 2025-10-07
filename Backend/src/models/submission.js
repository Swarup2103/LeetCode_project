const mongoose = require('mongoose');
const { type } = require('os');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },

    code:{
        type: String,
        required: true
    },

    language: {
        type: String,
        required: true,
        enum: ['javascript', 'c++', 'java']
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'wrong', 'error'],
        default: 'pending'
    },

    runtime: {
        type: String,   //in miliSecond
        default: 0
    },

    memory: {
        type: String,   //in kB
        default: 0
    },

    errorMessage: {
        type: String,
        default: ''
    },

    testCasesPassed: {
        type: Number,
        default: 0
    },

    testCasesTotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

submissionSchema.index({userId:1, problemId:1});    //Compound index
//firstly: UserId: in Ascending order.. then problemId also in Asce order
/**1=> Ascending order;     -1=>Descending order
 * 4    10
 * 5    15
 * 7    5
 * 4    6
 * 4    10
 * userId   problemId
 * 
 * 4    6
 * 4    10
 * 4    10
 * 5    15
 * 7    5
 * 
 * also we can now apply query on userId => in optimized way
 * not in problemId... because in in Asce order
 * 
 */
const Submission = mongoose.model('submission', submissionSchema);

module.exports = Submission;


/*
pId, userId, code, language, status, totalTestCases, 
runtime //total time taken to run all test cases
memory //max memory need taken by testcase
passedTestCases,
errorMessage //only one Error msg
*/