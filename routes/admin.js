const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isAdmin } = require('../middleware')
const User = require('../models/user.js');
const School = require('../models/school.js');


router.get('/dashboard', isAdmin, catchAsync(async (req, res) => {
    const schools = await School.find();
    // console.log(schools)
    res.render('admin/dashboard', { schools})
}));


router.delete('/school', isAdmin, async(req, res) => {
    console.log(req.body)
    for (const id of req.body.school) {
        await School.findByIdAndDelete(id)
    }

    req.flash('success', 'Selected listing(s) deleted.');
    res.redirect('/admin/dashboard');
});


module.exports = router;