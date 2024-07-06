const express = require('express')
const app = express();
const db = require('./db');
require('dotenv').config();
const path = require('path');
var cookieParser = require('cookie-parser');

const bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // req.body
const PORT = 3000;




app.use(express.json());
app.use(express.urlencoded({extened:true}));
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Import the router files.
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

// Use the router
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);

app.get('/', (req, res)=>{
    res.render('home');
})

app.listen(PORT, ()=>{
    console.log('listening on port 3000');
})