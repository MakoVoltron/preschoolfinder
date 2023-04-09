const express = require('express');
const router = express.Router();
// const { isLoggedIn, isOwner } = require('../middleware')
// const catchAsync = require('../utils/catchAsync');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const School = require('../models/school.js');

// const cloudinary = require('cloudinary').v2;
// const { categories, amenities } = require('../categories');


// router.get('/:country', async (req, res) => {
//     console.log('country params')
//     const { country } = req.params;
//     const schools = await School.find({'country.name' : country});

//     const counts = {};
//     let cities = [];

//     schools.forEach(el => {
//         counts[el.city.name] = (counts[el.city.name] || 0) +1;
//     })
    
//     res.render('indexes/countryIndex', { schools, counts })
// })

// router.get('/:country/:city', async (req, res) => {
//     console.log('country and city params')
//     const { country, city } = req.params;
//     console.log(country)
//     console.log(city)
//     const schools = await School.find({'country.name' : country, 'city.name' : city});

//     const counts = {};
//     let cities = [];

//     schools.forEach(el => {
//         counts[el.city.name] = (counts[el.city.name] || 0) +1;
//     })

    
//     res.render('indexes/cityIndex', { schools })
// })



module.exports = router;