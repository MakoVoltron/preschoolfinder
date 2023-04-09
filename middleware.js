const School = require('./models/school')
const User = require('./models/user')
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in!');
        return res.redirect('/user/login')
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const school = await School.findById(id);
    console.log(school.author)
    if (!school.author.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to do that!');
        return res.redirect(`/school/${id}`);
    }
    next();
};

module.exports.isAdmin = async(req, res, next) => {
    console.log(req.user)
    // const { id } = req.params;
    if (!req.user || (req.user && req.user.role !== 'admin')) {
        res.status(403)
        req.flash('error', 'Access denied.')
        return res.redirect('/')
    }
    next()
}

module.exports.validateId = (req, res, next) => {
    const id = req.params.id;
    if (ObjectId.isValid(id)) {
        next()
    } else {
        req.flash('error', 'Invalid school id!')
        res.redirect('/')
    }
};

// module.exports.pathCheck = (req, res, next) => {
//     console.log("from middleware")
//     console.log(req.path)
    
//     const arr = ['europe', 'asia', 'north_america'];
//     arr.forEach(el => {
//         console.log(el)
//         console.log(req.path)
//         if (req.path !== el) {
//             next()
//         }
//     })
// }


// NEEDS EDIT!!!
// I need to make a condition if the user has a role of Admin 
// OR if the SCHOOL in question has as an owner listed the user
// now it looks simply for the role of 'admin' or 'owner' as a criteria
// the thing is, there can be a lot of different 'owners'...
// but the school can have only one specific
module.exports.hasRole = function(roles) {
    return async (req, res, next) => {
        console.log('coming from REQ')
        console.log(req.user)
        const user = await User.findById(req.user._id);
        // const user = req.user
        console.log('found user')
        console.log(user)
        // if (!user || !roles.includes(user.role)) {
        if (!user || !roles.includes(user.role)) {
            res.status(403)
            // return res.status(403).send({error: { status:403, message:'Access denied.'}})
            req.flash('error', 'Access denied.')
            return res.redirect('/')
        }
        next();
    }
}

module.exports.isAdminOrOwner = async (req, res, next) => {
    const school = await School.findById(req.params.id);

    if (!((req.user && req.user.role == 'admin') || (req.user && (school.owner.toString() === req.user._id.toString())))) {
        req.flash('error', 'Access denied.')
        return res.redirect('/')
    }

    next()
}

// module.exports = {
//     hasRole
// }

// module.exports.authRole(role) {
//     return (req, res, next) => {
//         if (req.user.role !== role) {
//             res.status(401)
//             req.flash('danger', "Sorry, you don't have the right permissions.")
//             return res.redirect('/')
//         }
//     }
//     next()
// }

// module.exports.hasRole(roles) = async (req, res, next) => {
//     const user = await User.findOne({id: req.user._id});
//     if (!user || !roles.includes(user.role)) {
//         // res.status(403)
//         req.flash('error', 'Access denied.')
//         return res.redirect('/')
//     }
//     next()
// }



