const School = require('../models/school');
const Review = require('../models/review');


module.exports.newReview = async(req, res) => {
    const { id } = req.params;
    // const review = await Review.findById(reviewId);
    const school = await School.findById(id).populate('reviews');
    // console.log(review);
    console.log(school);
    res.render('reviews/new', { school });
}

module.exports.createReview = async(req, res) => {
    const school = await School.findById(req.params.id)
    .populate('reviews')
    .populate({
        path: 'reviews',
        populate: { path: 'author'}
    });
    
    // check if user haven't reviewed school already
    const arr = school.reviews;
    arr.forEach(el => {console.log(el.rating)})
    const count = arr.filter(review => (review.author.id === req.user._id.toString())).length;
    if (count >= 1) {
        req.flash('error', 'You already reviewed this school!');
        return res.redirect(`/school/${school._id}`);
    }

    const review = new Review(req.body.review);
    
    review.author = req.user._id;
    console.log('before')
    console.log(school)
    school.reviews.push(review);
    console.log('after')
    console.log(school)
    
    // update school's total rating
    const reviewArray = school.reviews.map(el => el.rating);
    // reviewArray.push(req.body.review.rating)
    school.totalRating = reviewArray.reduce((sum, a) => sum + a, 0) / school.reviews.length;
    
    await review.save();
    await school.save();
    req.flash('success', 'Thanks for sharing your opinion!')
    res.redirect(`/school/${school._id}`);
};

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;

    await School.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); 
    await Review.findByIdAndDelete(reviewId);

    // update the totalRating value of the related school
    const school = await School.findById(id).populate('reviews');
    console.log(school)
    if (school.reviews.length == 0) {
        school.totalRating = 0;
    } else {
        const arr = school.reviews.map(el => el.rating);
        school.totalRating = arr.reduce((sum, a) => sum + a, 0) / school.reviews.length;
    }
    school.save()


    req.flash('success', 'Review was deleted.')
    res.redirect(`/school/${id}`);
};

module.exports.updateReview = async(req, res) => {
    const { id, reviewId } = req.params;
    await Review.findByIdAndUpdate(reviewId, { ...req.body.review });

    // update the totalRating value of the related school
    const school = await School.findOne({ reviews: { _id: reviewId }}).populate('reviews');
    const arr = school.reviews.map(el => el.rating);
    school.totalRating = arr.reduce((sum, a) => sum + a, 0) / school.reviews.length;
    school.save()

    req.flash('success', 'Review was updated.')
    res.redirect(`/school/${id}`)
}

module.exports.showReview = async(req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    const school = await School.findById(id);
    console.log(review);
    console.log(school);
    res.render('reviews/edit', { school, review });
}
