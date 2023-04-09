const express = require('express');
const router = express.Router({mergeParams: true});

const { isLoggedIn, isOwner } = require('../middleware')

const { reviewSchema } = require('../schemas.js');

const reviews = require('../controllers/reviews');

const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

router.get('/', isLoggedIn, catchAsync(reviews.newReview));
router.post('/', validateReview, catchAsync(reviews.createReview));
router.get('/:reviewId', catchAsync(reviews.showReview));
router.delete('/:reviewId', catchAsync(reviews.deleteReview));
router.put('/:reviewId', catchAsync(reviews.updateReview));

module.exports = router;
