const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// Define the Person schema
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    adharcardNumber: {
        type: Number,
        required: true,
        unique: true
    },
    email:{
        type: String
    },
    party: {
        type: String,
        required: true
    },
    age: {  
        type: Number,
        required: true
    },
    partyLogo: {
        type: String
    },
    votes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            votedAt: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    voteCount: {
        type: Number,
        default: 0
    }
});

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;