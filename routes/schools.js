const express = require('express');
const router = express.Router();
// const schools = require('../controllers/schools');
const { isLoggedIn, isOwner, isAdmin , validateId, isAdminOrOwner } = require('../middleware')
const catchAsync = require('../utils/catchAsync');

const { schoolSchema } = require('../schemas.js');

const multer = require('multer');
const { storage, businessProof } = require('../cloudinary');
const upload = multer({ storage });
const uploadProof = multer({ storage: businessProof });

const sendEmail = require('../utils/sendMail');

const School = require('../models/school');
const Review = require('../models/review');
const User = require('../models/user');
const cloudinary = require('cloudinary').v2;

const { categories, amenities } = require('../categories');

const ExpressError = require('../utils/ExpressError');
const { searchconsole_v1 } = require('googleapis');


const validateSchool = (req, res, next) => {
    const { error } = schoolSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}


router.get('/new', isLoggedIn, async(req, res) => {
    res.render('schools/new', { categories, amenities});
})

router.post('/', isLoggedIn, upload.array('image'), catchAsync(async(req, res, next) => {
    console.log(req.body, req.files)
    
    // parse coordinates from input
    const coords = req.body.school.geometry.coordinates;
    const parsedCoords = coords.split(',').map(Number);

    const cityCenterCoords = req.body.school.city.coordinates;
    const parsedCityCoords = cityCenterCoords.split(',').map(Number);

    // update req.body object with geometry data
    req.body.school.geometry.coordinates = parsedCoords;
    req.body.school.geometry.type = 'Point';

    req.body.school.city.coordinates = parsedCityCoords;
    req.body.school.city.type = 'Point';

    // format the CONTINENT name for url purposes
    const strCont = req.body.school.context.continent.name;
    const continent = strCont.split(' ').join('_').toLowerCase();
    req.body.school.context.continent.lowercase = continent;

    // format the COUNTRY name for url purposes
    const strCountry = req.body.school.country.name;
    const country = strCountry.split(' ').join('_').toLowerCase();
    req.body.school.country.lowercase = country;

    // format the CITY name for url purposes
    const strCity = req.body.school.city.name;
    const city = strCity.split(' ').join('_').toLowerCase();
    req.body.school.city.lowercase = city;
   
    const school = new School(req.body.school);
    school.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    school.author = req.user._id;
    school.owner = null;

    if (req.body.school.owner === 'true') {
        school.ownership.owner = req.user._id
    }

    console.log(school);
    await school.save();
    console.log(school);
    req.flash('success', 'New school added!');
    res.redirect(`/school/${school._id}`);
}))

router.get('/:id/claim', validateId, catchAsync(async(req, res) => {
    const { id } = req.params;
    const school = await School.findById(id);
    console.log(school)

    if (!school)  {
        req.flash('error', 'Invalid url!');
        res.redirect('/');
    }

    // define returnTo page so user is redirected back here after login
    req.session.returnTo = req.originalUrl;

    res.render('schools/claim', { school })
}));

router.post('/:id/claim', isLoggedIn, uploadProof.array('image'), async(req, res) => {
    const { id } = req.params;
    
    const school = await School.findById(id)
    .populate('ownership')
    // const user = await User.findById(req.user._id);
    console.log(school)
    console.log(req.user._id)

    if (req.files.length === 0) {
        req.flash('error', 'Oops! No document submitted. Please, try again!')
        res.redirect(`/school/claim/${id}`)
    } else {
        // check if the user already didn't upload some documents
        const ownershipArr = school.ownership;
        if (ownershipArr.some(user => user.owner.toString() === req.user._id.toString())) {
            console.log('user found')
            // array of new image documents to be added to existing business proof array
            const newProof = req.files.map(f => ({ url: f.path, filename: f.filename}))

            const existingOwner = school.ownership.find(owner => owner.owner.toString() === req.user._id.toString())
            existingOwner.businessProof.push(...newProof)
            console.log(existingOwner)
            console.log(school)
            await school.save()
            req.flash('success', 'Your document submitted successfully! Please, give us up to 7 days for review.')
            res.redirect(`/school/${id}`)
        } else {
            console.log('user NOT found')
            const claim = {
                owner: req.user._id,
                businessProof: req.files.map(f => ({ url: f.path, filename: f.filename}))
            }
            school.ownership.push(claim);
            school.save();
            req.flash('success', 'Your document submitted successfully! Please, give us up to 7 days for review.')
            res.redirect(`/school/${id}`)
        }
    }
})

router.get('/:id', catchAsync(async (req, res) => {
    console.log(req.user)
    const { id } = req.params;
    const school = await School.findById(id)
    .populate('author')
    .populate('reviews')
    .populate('ownership')
    .populate({
        path: 'ownership',
        populate: { path: 'owner'}
    })
    // .populate('ownership.owner')
    .populate({
        path: 'reviews',
        populate: { path: 'author'}
    });
    // console.log(school)
    // console.log(school.totalRating)
    return res.render('schools/show', { school })
}))

router.get('/:id/edit', isLoggedIn, isAdminOrOwner, async (req, res) => {
    console.log('school edit route')
    const school = await School.findById(req.params.id);
    return res.render('schools/edit', { school, categories, amenities });
});

// UPDATE IMAGE
router.post('/:id/images', isLoggedIn,  upload.array('image'), async(req, res) => {
    let imageLimit = 3;

    const { id } = req.params;
    const school = await School.findById(id);
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    
    console.log(req.user)

    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }

        await school.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } }}})
        req.flash('success', 'Image(s) deleted.');
        res.redirect(`/school/${school._id}`);
    }

    // BASIC TIER
    // check how many images this school have already
    if (school.tier == 'free') {
        if (school.images.length >= imageLimit) {
            req.flash('error', 'You reached your maximum image upload limit. Please, upgrade to Premium to remove all limitations.')
            res.redirect(`/school/${school._id}`);
        } else {
            // if someone attempts to upload more images on a Free Tier, limit how many images go through
            // const trimValue = imageLimit - school.images.length;
            const startIndex = imageLimit - school.images.length;
            // imgs.splice(0, trimValue);
            imgs.splice(startIndex);
            school.images.push(...imgs);
            await school.save();
        }
    }
    req.flash('success', 'Image uploaded!');
    res.redirect(`/school/${school._id}`)
})

router.put('/:id', isLoggedIn, isAdminOrOwner, upload.array('image'), validateSchool, catchAsync(async(req, res) => {
    const { id } = req.params;
    console.log(id)

    console.log('*****************')
    console.log('THIS COMES FROM BODY')
    console.log(req.body.school)
    console.log('*****************')

    // parse School coordinates from input
    const coords = req.body.school.geometry.coordinates;
    const parsedCoords = coords.split(',').map(Number);

    // parse City coordinates from input
    const cityCenterCoords = req.body.school.city.coordinates;
    const parsedCityCoords = cityCenterCoords.split(',').map(Number);
 
    // update req.body object with geometry data
    req.body.school.geometry.coordinates = parsedCoords;
    req.body.school.geometry.type = 'Point';

    req.body.school.city.coordinates = parsedCityCoords;
    req.body.school.city.type = 'Point';

    // format the CONTINENT name for url purposes
    const strCont = req.body.school.context.continent.name;
    const continent = strCont.split(' ').join('_').toLowerCase();
    req.body.school.context.continent.lowercase = continent;

    // format the COUNTRY name for url purposes
    const strCountry = req.body.school.country.name;
    const country = strCountry.split(' ').join('_').toLowerCase();
    req.body.school.country.lowercase = country;

    // format the CITY name for url purposes
    const strCity = req.body.school.city.name;
    const city = strCity.split(' ').join('_').toLowerCase();
    req.body.school.city.lowercase = city;

    const school = await School.findByIdAndUpdate(id, { ...req.body.school }, { new: true });
    // await school.save()

    console.log(school)

    res.redirect(`/school/${school._id}`)
}));

// admin access only
router.post('/:id/verifyowner/:userId', async (req, res) => {
    const { id, userId } = req.params;
    const school = await School.findById(id);
    const user = await User.findById(userId);

    if (req.body.verified) {
        for (const owner of school.ownership) {
            if (owner.owner.toString() === userId) {
                owner.verified = true;
                // school.ownerVerified = true;
                school.owner = userId;
            } else {
                owner.verified = false
                
            }; 
        }
        console.log(school)   

        // Send mail notification?
        if (req.body.mailNotification) {
            
            const message = `Congratulations, ${user.username}, 
            ownership of your listing has been verified! 
            Sincerely, Your PreschoolFinder team`;
            
            const html = `<p>Congratulations, <em>${user.username}</em>,</p> 
            <p>ownership of your listing <a href="${process.env.BASE_URL}/school/${school._id}" target="_blank"><strong>${school.title}</strong></a> has been verified!</p>
            <p>Now you can edit and update your listing as much as your heart desires! <a href="${process.env.BASE_URL}/school/${school._id}" target="_blank">Try it now!</a></p> 
            <p>With love,</p>
            <p><em>Your PreschoolFinder team</em></p>`
            
            await sendEmail(user.email, "Ownership verified", message, html);
            await school.save();

            req.flash('success', 'Owner rights granted and user notified.')
            res.redirect(`/school/${id}`);
        }

        // await school.save()
        req.flash('success', 'Owner rights granted.')
        res.redirect(`/school/${id}`);
    } else {
        for (const owner of school.ownership) {
            owner.verified = false;
            // school.ownerVerified = false;
            school.owner = null;
        }
        await school.save()
        req.flash('success', 'Owner rights removed!')
        res.redirect(`/school/${id}`);
    }
})

router.post('/:id/deleteclaim/:userId', isAdmin, upload.array('image'), async (req, res) => {
    const { id, userId } = req.params;
    const school = await School.findById(id);

    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        console.log("Image(s) removed from Cloudinary")
        // await school.updateOne({ $pull: { 'ownership.businessProof': { filename: { $in: req.body.deleteImages } }}})
        // console.log("Image(s) removed from database")
    }

    await school.updateOne({ $pull: { ownership: { owner: userId }}})
    console.log("Claimant removed from database.")

    console.log(school)
    req.flash('success', 'Claimant removed.');
    res.redirect(`/school/${school._id}`);
})

router.delete('/:id', isLoggedIn, isOwner, async(req, res) => {
    const { id } = req.params;
    req.flash('success', 'School was successfully deleted!')
    // res.send('deleted')
    // implement separate image deletion function
    await School.findByIdAndDelete(id);
    res.redirect('/');
})

// router.post('/:id/reviews', validateReview, catchAsync(async(req, res) => {
//     const school = await School.findById(req.params.id);
//     const review = new Review(req.body.review);
//     school.reviews.push(review);
//     console.log(req.user._id)
//     review.author = req.user._id;
//     await review.save();
//     await school.save();
//     res.redirect(`/school/${school._id}`);
// }));

// router.delete('/:id/reviews/:reviewId', catchAsync(async(req, res, next) => {
//     const { id, reviewId } = req.params;
//     await School.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); 
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/school/${id}`);
// }));



module.exports = router;