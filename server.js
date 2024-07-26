const express = require('express')
const app = express();
const db = require('./db');
require('dotenv').config();
const path = require('path');
var cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');
const bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // req.body
const PORT = 4000;
const User = require('./models/user');
const session = require('express-session');
var methodOverride = require('method-override')


// app.use(session({
//     secret: 'lolopopo', 
//     resave: false,
//     saveUninitialized: true
// }));

app.use(express.json());
app.use(express.urlencoded({extened:true}));
app.use(express.static(path.join(__dirname,'public')))
app.use('/partyLogo_images', express.static(path.join(__dirname,'PartyLogo_images')));
app.use(cookieParser());
app.use(methodOverride('_method'))


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Import the router files.
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

// Use the router
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);

app.get('/', async(req, res)=>{
    // this is to show the name in the place of the sign-in in the home page try catch is used if the token get expired then server may crash to handle that it will redirect to home page
    let token=req.cookies.token;
    try {
        if(token){
            let  response =jwt.verify(token,'lolopopo');
            const userss = await User.findById(response.id);
            res.render('userViews/home',{name:userss.name});
        }
        else{
            res.render('userViews/home',{name:null});
        }
    } catch (error) {
        res.render('userViews/home',{name:null});
    }
    
})

app.listen(PORT, ()=>{
    console.log('listening on port 4000');
})