const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const Candidate = require('../models/candidate');
const multer = require('multer');


//for image storage
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, './PartyLogo_images');
    },
    filename : function(req,file,cb){
        cb(null,`${Date.now()}_${file.originalname}`)
    }
});
var upload = multer({
    storage : storage
}).single("partyLogo");


const checkAdminRole = async (userID) => {
   try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
   }catch(err){
        return false;
   }
}
//this two route is for the case where the 
router.get("/signup", (req, res) => {
    res.redirect('/user/signup');
})
router.get("/login", (req, res) => {
    res.redirect('/user/login');
})


//candidate route, this is to show all the candidates in the home page of candidateRoute.js
router.get("/",jwtAuthMiddleware,async(req,res)=>{
    if(!(await checkAdminRole(req.user.id))){
        return res.render("candidateViews/complete", {message: 'Sorry!!User does not have Admin Role....'});   //res.status(403).json({message: 'user does not have admin role")//res.status(403).json({message: 'user does not have admin role'});
    }
    const { type, message } = req.query;
    const allCandidates = await Candidate.find({});
    // console.log(allCandidates);
    res.render("candidateViews/candidate",{candidates:allCandidates,message: type && message ? { type, message } : null});
})
router.get("/add",jwtAuthMiddleware,async(req,res)=>{
    if(!(await checkAdminRole(req.user.id))){
         return res.status(403).json({message: 'user does not have admin role'})  ;
    }


    const { type, message } = req.query;
    res.render("candidateViews/addCandidate",{ message: type && message ? { type, message } : null });
})
// POST route to add a candidate
router.post('/add', jwtAuthMiddleware,upload, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body // Assuming the request body contains the candidate data
        
        
        if (req.file) {
            data.partyLogo = req.file.filename; // This will store the new file name generated with Date.now()
        }
        
        console.log("data",data);

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();

       
        console.log('data saved');
        // res.status(200).json({response: response});
        const redirectUrl = `\add?type=success&message=${encodeURIComponent("Candidate added Successfully!")}`;
        res.redirect(redirectUrl);
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get("/update/:candidateID", jwtAuthMiddleware, async (req, res)=>{
     
    //if the user is not admin
     if(!(await checkAdminRole(req.user.id))){
        if(!(await checkAdminRole(req.user.id))){
            return res.status(403).json({message: 'user does not have admin role'});
        }
     }
        
    const userid = req.params.candidateID;
    const user = await Candidate.findById(userid);
    // console.log(user);
    return res.render('candidateViews/update',{userss: user});
})
router.put('/update/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        const redirectUrl = `/candidate?type=warning&message=${encodeURIComponent("Candidate data Updated Successfully!")}`;
        res.redirect(redirectUrl);
        // res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        const redirectUrl = `/candidate?type=danger&message=${encodeURIComponent("Candidate Deleted Successfully!")}`;
        res.redirect(redirectUrl);
        // res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// let's start voting
router.get('/vote/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    // no admin can vote
    // user can only vote once
    
    candidateID = req.params.candidateID;
    userId = req.user.id;

    try{
        // Find the Candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return  res.render('candidateViews/complete', {message: 'Sorry!!Candidate not Found....'});//res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if(!user){
            return res.render('candidateViews/complete', {message: 'Sorry!!User not Found....'});//res.status(404).json({ message: 'user not found' });
        }
        if(user.role == 'admin'){
            return res.render('candidateViews/complete', {message: 'Sorry!!Admin is not Allowed to Vote....'});//res.status(403).json({ message: 'admin is not allowed'});
        }
        if(user.isVoted){
            return res.render('candidateViews/complete', {message: 'Sorry!!You have already voted....'});//res.status(400).json({ message: 'You have already voted' });
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true
        await user.save();

        console.log('vote recorded successfully');
         return res.render('candidateViews/complete', {message: 'Vote recorded successfully....'});//res.status(200).json({ message: 'Vote recorded successfully' });
    }catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

// vote count 
router.get('/vote/count',jwtAuthMiddleware, async (req, res) => {
    try{
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Get List of all candidates with only name and party fields
// router.get('/', async (req, res) => {
//     try {
//         // Find all candidates and select only the name and party fields, excluding _id
//         const candidates = await Candidate.find({}, 'name party -_id');

//         // Return the list of candidates
//         res.status(200).json(candidates);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.get("/vote",jwtAuthMiddleware, async (req, res) => {
    const allCandidates = await Candidate.find({});
    res.render("candidateViews/vote", {candidates: allCandidates});
})


router.get("/dashboard", async (req, res) => {    
    const allCandidates = await Candidate.find({});
    let partyName = [];
    let voteCount = [];
    for(let candidate of allCandidates){
        partyName.push(candidate.party);
        voteCount.push(candidate.voteCount);
    }
    res.render("candidateViews/dashboard", {partyName: partyName, voteCount: voteCount});
});


module.exports = router;