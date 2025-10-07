const mongoose = require('mongoose');
const {Schema} = mongoose;

const problemScheme = new Schema({
    title:{
        type: String,
        retuired: true,
    },
    description:{
        type:String,
        required: true,
    },
    difficulty:{
        type: String,
        enum:['easy', 'medium', 'hard'],
    },
    tags:{
        type:String,
        enum:['array', 'string', 'linked list', 'tree', 'graph'],
        required: true,
    },
    visibleTestCases: [
        {
            input:{
            type:String,
            required: true,
            },
        output:{
            type:String,
            required: true,
            },
        explanation:{
            type:String,
            required: true,
            }
        }
    ],
        
    hiddenTestCases: [
        {
            input:{
                type:String,
                required: true,
            },
            output:{
                type:String,
                required: true,
            }
        }
    ],

    startCode:[
        {
            language:{
                type:String,
                required: true,
            },
            initialCode: {
                type: String,
                required: true,
            }
        }
    ],

    referenceSolution: [
        {
            language:{
                type:String,
                required: true,
            },
            completeCode: {
                type: String,
                required: true,
            }
        }
    ], //if user inserted some sample testcases then to test those solutions

    problemCreator:{
        type: Schema.Types.ObjectId,    //Object id of Admin
        ref: 'user',                    //id of User schema 
        required: true 
    }
})

const Problem = mongoose.model('problem',problemScheme);
module.exports = Problem;


/**


 */