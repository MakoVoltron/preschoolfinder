const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn } = require('../middleware')

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const cloudinary = require('cloudinary').v2;

const ObjectID = require('mongodb').ObjectID;

const User = require('../models/user.js');
const School = require('../models/school.js');

const sendEmail = require('../utils/sendMail');
const Token = require('../models/token');

const crypto = require('crypto');
const async = require('async');

const nodemailer = require('nodemailer');
const { ObjectId } = require('bson');
// const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;
// const { send } = require('q');


// const createTransporter = async () => {
//     const oauth2Client = new OAuth2(
//         process.env.OAUTH_CLIENTID,
//         process.env.OAUTH_CLIENT_SECRET,
//         "https://developers.google.com/oauthplayground"
//     );
    
//     oauth2Client.setCredentials({
//         refresh_token: process.env.OAUTH_REFRESH_TOKEN
//     })

//     const accessToken = await new Promise((resolve, reject) => {
//         oauth2Client.getAccessToken((err, token) => {
//             if (err) {
//                 reject("Failed to create access token");
//             }
//             resolve(token)
//         });
//     });

//     console.log('Creating transporter...')
//     let transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             type: 'OAuth2',
//             user: process.env.MAIL_USERNAME,
//             accessToken,
//             // pass: process.env.MAIL_PASSWORD,
//             clientId: process.env.OATH_CLIENTID,
//             clientSecret: process.env.OAUTH_CLIENT_SECRET,
//             refreshToken: process.env.OAUTH_REFRESH_TOKEN,
//             // accessToken: process.env.OAUTH_ACCESS_TOKEN
//         } 
//     });
//     console.log('Done!')

//     return transporter;
// };

// let mailOptions = {
//     from: 'hello.preschoolfinder@gmail.com',
//     to: 'matej.valtr@gmail.com',
//     subject: 'Preschool Finder',
//     text: 'Hi from Preschool Finder'
// }

// const sendEmail = async (mailOptions) => {
//     let emailTransporter = await createTransporter();
//     await emailTransporter.sendMail(mailOptions)
// }


// transporter.sendMail(mailOptions, function(err, data) {
//     if (err) {
//         console.log("Error " + err);
//     } else {
//         console.log("Email sent successfully");
//     }
// });

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.MAIL_USERNAME,
//         pass: process.env.MAIL_PASSWORD
//     }
// })

// async function send() {
//     const result = await transporter.sendMail(mailOptions)
// }

// router.get('/emailtest', async (req, res) => {
//     let mailOptions = {
//         from: 'Prechool Finder <hello.preschoolfinder@gmail.com>',
//         to: 'matej.valtr@gmail.com',
//         subject: 'Preschool Finder',
//         text: 'Hi from Preschool Finder'
//     }

    
//     await transporter.sendMail(mailOptions, function(err, data) {
//         if (err) {
//                     console.log("Error " + err);
//                 } else {
//                     console.log("Email sent successfully");
//                 }
//     })

//     res.send('Check your inbox')
// })

router.get('/register', (req, res) => {
    res.render('users/register')
})


router.post('/register', catchAsync(async(req, res) => {
    try {
        const { email, username, password } = req.body;
        
        const checkIfEmailExists = await User.findOne({ email: email })
        if (checkIfEmailExists) {
            req.flash('error', 'This email address is already registered.')
            res.redirect('/')
        }

        // Create new user
        const user = new User({ email, username });

        await User.register(user, password) 

        if (user.username === 'admin') { 
            user.isAdmin = true,
            user.role = 'admin'; 
        };
        // user.emailToken = crypto.randomBytes(32).toString('hex');
        const img = {
            url: '',
            filename: ''
        };
        user.profileImage = img;

        user.save();
        console.log(user)

        let token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex')
        }).save();

        const message = `${process.env.BASE_URL}/user/verify/${user._id}/${token.token}`;
        await sendEmail(user.email, "Verify Email", message);

        // res.send("An confirmation Email was sent. Please, check your inbox and verify!")
        req.flash('success', "An confirmation Email was sent. Please, check your inbox and verify!");
        res.redirect('/')
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('/user/register'); 
    }
}));

router.get("/verify/:id/:token", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) return res.status(400).send("Invalid link");
        console.log(user)

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token
        });
        if (!token) return res.status(400).send("Invalid token");

        await User.updateOne(
            {_id: user._id},
            { $set: { isVerified: true, email: user.newEmail }}
        );
        // await User.updateOne({ _id: user._id, isVerified: true });
        await Token.findByIdAndRemove(token._id);

        // res.send("Email verified successfully.");
        req.flash('success', 'Email successfully verified!')
        res.redirect(`/user/${user._id}`);
    } catch (error) {
        console.log(error)
        res.status(400).send("An error occured")
    }
})

router.get('/login', (req, res) => {
    res.render('users/login')
})

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/'}), (req, res) => {
    // failureRedirect: '/user/login'
    console.log(res.locals)
    req.flash('success', 'Welcome back!');
    console.log(res.locals)
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});

router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err) }
        req.flash('success', 'You were logged out!');
        res.redirect('/')
    });
})

router.get('/recovery', (req, res) => {
    res.render('users/recovery')
});

router.post('/recovery', async(req, res, next) => {
    console.log(req.body.email)
    // const { email } = req.body;
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error', "No account with that email address exists.");
                    return res.redirect('/user/recovery');
                }
                console.log(user)
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const message = 'You are receiving this email because you (or someone else) have requested the password reset.' + '\n\n' +
            'Please, click the following link the complete the process:' + '\n\n' +
            `${process.env.BASE_URL}/user/reset/${token}` + '\n\n' +
            "Please, ignore this email if you didn't request that.";
            sendEmail(user.email, "Password Reset", message)
            console.log('mail sent')
            req.flash('success', `An email has been sent to ${user.email} with further instructions.`);
            done();
        }
    ], function(err) {
        if (err) return next(err);
        return res.redirect('/');
    });
});

router.get('/reset/:token', async (req, res) => {
    console.log(req.params.token)
    await User.findOne({ 
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() }}, 
        function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/user/recovery');
            }
        res.render('users/reset', { token: req.params.token });
    })
});

router.post('/reset/:token', function(req, res) {
    console.log(req.params)
    async.waterfall([
        function(done) {
            User.findOne({ 
                resetPasswordToken: req.params.token, 
                resetPasswordExpires: { $gt: Date.now() }
            },
            function(err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('/');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordToken = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash('error', 'Passwords do no match.');
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            const message = `Hey there,` + '\n\n' +
            `This is a confirmation that the password for your account ${user.email} has just been changed.`
            sendEmail(user.email, 'Your password has been changed.', message);
            req.flash('success', 'Success! Your password has been changed.');
            done()
        }
    ], function(err) {
        res.redirect('/');
    });
});

router.get('/:id/update', async (req, res) => {
    let user = await User.findById(req.params.id);
    res.render('users/update', { user });
});

router.post('/:id/update', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    console.log(req.body)

    console.log(res.locals)

    const currentUser = res.locals.currentUser;
    console.log(currentUser);

    if ((req.body.newEmail === currentUser.email) && (req.body.username === currentUser.username) && (req.body.location === currentUser.location)) {
        await User.findByIdAndUpdate(id, { newEmail: req.body.newEmail, isVerified: true }, { new: true });
        req.flash('success', 'No changes were made.');
        return res.redirect('/');
    }

    // check if username exists
    if (req.body.username !== currentUser.username) {
        let usernameCheck = await User.find({username: req.body.username});
        console.log(usernameCheck)
        if (usernameCheck.length > 0) {
            req.flash('error', `${req.body.username} is already taken.`);
            // return res.redirect(`/user/${id}/update`);
            return res.redirect(`/user/${id}`);
        }
    }

    // check if email exists
    if (req.body.newEmail !== currentUser.email) {
        let user = await User.find({email: req.body.newEmail});
        if (user.length == 1) {
            req.flash('error', `${req.body.newEmail} is already taken.`);
            // return res.redirect(`/user/${id}/update`);
            return res.redirect(`/user/${id}`);
        } 
    }

    const user = await User.findByIdAndUpdate(id, req.body, { new: true});
    if (user.email != user.newEmail) {
        user.isVerified = false;
        user.save();

        let token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex')
        }).save();

        const message = `${process.env.BASE_URL}/user/verify/${user._id}/${token.token}`;
        await sendEmail(user.newEmail, "Verify Email", message);

        req.flash('success', 'Confirmation email was sent. Please, check your inbox.');
        return res.redirect(`/user/${id}`)
    } else {
        req.flash('success', 'Your profile was updated!');
        res.redirect(`/user/${id}`)
    }
});

router.get('/:id', async (req, res) => {
    // check if the Id param is an actual ObjectId
    if (!ObjectId.isValid(req.params.id)) {
        req.flash('error', 'Invalid request.');
        res.redirect('/')
    }

    let user = await User.findById(req.params.id);
    let schools = await School.find({author: user});
    let owned = await School.find({ 'ownership.owner': user, 'ownership.verified': true });

    console.log(owned)

    res.render('users/profile', { user, schools, owned });
});

router.post('/:id/profilepic', isLoggedIn, upload.single('image'), async (req, res) => {
    console.log(req.file)
    const { id } = req.params;
    const user = await User.findById(id);

    if (req.file != undefined) {
        const img = {
            url: req.file.path,
            filename: req.file.filename
        }
        user.profileImage = img;
        await user.save();
        req.flash('success', 'Profile image updated!');
        res.redirect(`/user/${id}`)
    } 
    
    // else {
    //     user.profileImage.url = '';
    //     await user.save();
    //     res.redirect(`/user/${id}`)
    // }


    if (req.body.deleteImage) {
        await cloudinary.uploader.destroy(req.body.deleteImage);

        user.profileImage.filename = '';
        user.profileImage.url = '';
        await user.save();

        req.flash('success', 'Profile image deleted.');
        res.redirect(`/user/${user._id}`);  
    }


    // if (user.profileImage.filename)

    // await user.save();
    // res.redirect(`/user/${id}`)
})

router.put('/user/:id', async (req, res) => {
    console.log(req.body)
    const { id } = req.params;
    console.log(id)

    const user = await User.findByIdAndUpdate(id, { ...req.body.school }, { new: true });
    console.log(user)

    res.redirect(`/user/${user._id}`)
})




module.exports = router;