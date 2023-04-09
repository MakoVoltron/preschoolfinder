if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: './config/config.env' })
}

const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');

const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');

const { MongoClient, ObjectID, ServerApiVersion } = require('mongodb');
const Cors = require('cors');

const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const FacebookStrategy = require('passport-facebook');
// const findOrCreate = require('mongoose-findorcreate');
const { pathCheck } = require('./middleware.js')


const User = require('./models/user');
const School = require('./models/school')

const { categories, amenities } = require('./categories');


// Routes
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const schoolRoutes = require('./routes/schools');
const reviewRoutes = require('./routes/reviews');



const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/preschoolfinder'
mongoose.connect(dbUrl)

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(Cors())

const sessionConfig = {
    secret: 'thisshouldbesecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());




// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//     User.findById(id, (err, user) => {
//         done(err, user);
//     });
// });

passport.use(new LocalStrategy(User.authenticate()));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    // passReqToCallback : true,
    profileFields: ['id', 'name', 'emails', 'displayName', 'picture.type(large)', 'short_name', 'verified']
    },
    function(accessToken, refreshToken, profile, done) {
        // find the user in the database based on their facebook id
        User.findOne({ 'provider_id': profile.id }, function(err, user) {
            // , username: profile._json.short_name

            if (err) { 
                // console.log(err);
                // req.flash('error', err)
                // res.redirect('/user/login')
                return done(err);
            };

            if (user) { 
                return done(null, user); // user found, return that user
            } else {
                console.log(profile);
                // console.log(profile.emails[0].value);
                const email = (profile.emails !== undefined ? profile.emails[0].value : 'no-email');
                console.log(email)

                
                console.log(profile)
                // let profilePicture = profile.photos ? profile.photos[0].value : '';
                // console.log(profilePicture)

                let randomString = Math.random().toString(36).substring(2);


                let newUser = new User({
                    username: profile.displayName,
                    email: email || '',
                    // profileImage : { url : profilePicture },
                    profileImage : '',
                    isVerified: true,
                    password: User.encryptPassword(randomString),
                    provider: 'facebook',
                    provider_id: profile.id
                });

                console.log(newUser)

                // check if the user with current user name doesn't already exist
                const fbName = profile.displayName;
                // const user = User.findOne( { username: fbName });
                User.findOne( { username: fbName }, function(err, results) {
                    if (err) { "There was an error to search database"};
                    if (results.length == 1) {
                        // if yes, add number at the end
                        // if (user) {
                            // check if there's already number at the end of the name
                            // remove any possible underscores BEFORE name (eg. '__joe')
                            const nameArr = fbName.split('_').filter(Boolean);;
        
                            if (nameArr.length > 1) {
                                const addOne = (parseInt(nameArr[1]) + 1).toString();
                                const newName = `${nameArr[0]}_${addOne}`
                                
                                newUser.username = newName;
                            } else {
                                newUser.username = `${fbName}_1`
                            }
                        // }
                    }
                });
                

                newUser.save(function(err) {
                    if (err) { 
                        // req.flash('error', err)
                        // res.redirect('/user/login')
                        throw err 
                    }
                    return done(null, newUser);
                });
            }
        });
    }
));

// these methods are added by PassportLocalMongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/auth/facebook', 
    passport.authenticate('facebook', { 
        authType: 'rerequest', 
        scope: ['email', 'public_profile']
    })
);

app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
    failureRedirect: '/login',
    keepSessionInfo: true
    // successReturnToOrRedirect: '/',
    }),
    function (req, res) {
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        // Successful authentication, redirect home.
        req.flash('success', 'You were logged in.')
        res.redirect(redirectUrl)
    }
);


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.host = req.get('host');
    res.locals.categories = categories.concat(amenities);
    next();
});


const favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// ROUTES
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/school', schoolRoutes);
app.use('/school/:id/review', reviewRoutes);
// app.use('/', indexRoutes);


let collection;


// app.get('/autocomplete', async (req, res) => {
//     res.render('schools/autocomplete')
    // var config = {
    //     method: 'get',
    //     url: `https://maps.googleapis.com/maps/api/place/autocomplete/json
    //     ?input=school
    //     &types=establishment
    //     location=37.76999%2C-122.44696
    //     &radius=500
    //     &libraries=places
    //     &key=${process.env.MAPS_API}`,
    //     headers: { }
    //   };

    // try {
    //       await axios(config)
    //       .then(function (response) {
    //         console.log(JSON.stringify(response.data));
    //       })
    //       .catch(function (error) {
    //         console.log(error);
    //       });
    // } catch (err) {
    //     console.log(err.message)
    // }

    // try {
    //     const type = 'school' // as per officialy allowed Google Places types
    //     const {data} = await axios.get(
    //         `https://maps.googleapis.com/maps/api/place/autocomplete/json
    //         ?input=school
    //         &types=${type}
     
    //         &key=${process.env.MAPS_API}
    //         `
    //         )
    //         res.json(data)
    //         console.log(data)
    // } catch (err) {
    //     console.log(err.message)
    // }
// })

// &location=37.76999%2C-122.44696
// &radius=50000


app.get('/search', async (req, res) => {
    console.log('****FROM SEARCH*****')
    console.log(req.query.searchFilter)

    if (req.query.searchFilter == 'cities') {
        console.log('search city index')
    }

    // console.log(req.params)
    // console.log(req.params.searchFilter)
    try {
        let result = await collection.aggregate([
            {
                "$search": {
                    "index": "CityIndex",
                    "autocomplete": {
                        "query": `${req.query.query}`,
                        "path": "city.name",
                        "fuzzy": {
                            "maxEdits": 2,
                            // "prefixLength": 3
                        }
                    }
                }
            }
        ]).toArray();
        console.log(result)
        res.send(result);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});

app.get('/get/:id', async (req, res) => {
    try {
        let result = await collection.findOne({"_id": ObjectId(req.params.id )});
        res.send(result);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
})

app.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

app.get('/', catchAsync(async (req, res) => {
    const schools = await School.find();
    const recent = await School.find().sort({_id: -1}).limit(4);
    const users = await User.find();
    res.render('schools/index', { schools, recent, users })
}));



app.get('/searchmap', async (req, res) => {
    let { 
        lat, 
        long,
        sw_long, sw_lat, ne_long, ne_lat, 
        search_by_map, 
        zoom,
        maxPrice,
        minPrice, 
        filter 
    } = req.query;

    const pagination = {
        page : parseInt(req.query.page) || 1,
        limit : parseInt(req.query.limit) || 10,
        get skip() { return (this.page - 1) * this.limit }
    }


    let schools;

    let query = {}

    const defaultPipeline = {
        $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lat), parseFloat(long)] },
            key: "geometry.coordinates",
            distanceField: "distance",
            spherical: "true",
            maxDistance: 10000,
            // query: { $category: { $all: ['vegan'] }}
        }
    };

    let bboxPipeline = {
        $match: {
            'geometry': {
                $geoWithin: {
                    $box: [
                        [parseFloat(sw_long), parseFloat(sw_lat)],
                        [parseFloat(ne_long), parseFloat(ne_lat)]
                    ]
                }
            }
        }
       
    }
            
    let activeFilters;
    if (filter) {
        activeFilters = filter.split('-');
        query['category'] = { $all: activeFilters };
        console.log(query)
        // defaultPipeline.$geoNear['query'] = {'category' : { $all: activeFilters }};
        bboxPipeline.$match['category'] = { $all: activeFilters }
    } 

    if (maxPrice && Number(maxPrice > 0)) {
        maxPrice = Number(maxPrice);
        query['price.value'] = { $lte: maxPrice }
        console.log(query)
        bboxPipeline.$match['price.value'] = { $lte: maxPrice }
    }

    // add built up query to defaultPipeline
    defaultPipeline.$geoNear['query'] = query;
    // bboxPipeline.$match = query;

    console.log(bboxPipeline)




    sw_long = parseFloat(sw_long);
    sw_lat = parseFloat(sw_lat);
    ne_long = parseFloat(ne_long);
    ne_lat = parseFloat(ne_lat);


    // use this when you use bounding box
    if (search_by_map === 'true') {
        console.log('using bbox')
        const results = await School.aggregate([
            // bboxPipeline,
            {
                $facet: {
                    // "metadata": [ { $count: "total" }],
                    "metadata": [
                        bboxPipeline,
                        { $group: { _id: null, total: { $sum: 1 } }}
                    ],
                    "data": [
                        bboxPipeline,
                        { "$skip": pagination.skip }, { "$limit": pagination.limit}
                    ]
                    // "data": [ { "$skip": pagination.skip }, { "$limit": pagination.limit}  ]
                }
            },
            { $unwind: "$metadata" },
            { $addFields: { "data.totalCount" : "$metadata" }},
            { $addFields: { "data.currentPage": pagination.page }},
            { $unwind: "$data" },
            { $replaceRoot: { newRoot: "$data" }}
        ])

        res.render(`schools/searchmap`, { schools : results, pagination, categories, activeFilters, zoom, lat, long, sw_long, sw_lat, ne_long, ne_lat, maxPrice })
    } else {
        console.log('using lat and long only')
        const results = await School
        .aggregate([
            defaultPipeline,
            // { $match: { category: "vegan" }},
            {
                $facet: {

                    "metadata": [ { $count: "total" }],
                    "data": [ { "$skip": pagination.skip }, { "$limit": pagination.limit},  ]
                }
            },
            { $unwind: "$metadata" },
            { $addFields: { "data.totalCount" : "$metadata" }},
            { $addFields: { "data.currentPage": pagination.page }},
            { $unwind: "$data" },
            
            { $replaceRoot: { newRoot: "$data" }}
        
        ])

        // const results = await School.populate(results_aggregate, {path: "reviews"})
      
        console.log(results)
        // console.log(r)
        // console.log(r[0].reviews[0].rating)

        res.render(`schools/searchmap`, { pagination, schools : results, lat, long, sw_long, sw_lat, ne_long, ne_lat, categories, activeFilters, amenities, maxPrice, zoom })
    }
})

app.get('/searcharea', async (req, res) => {
    console.log(req.query)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;

    let { minPrice, maxPrice, filter } = req.query;

    const bboxQuery = req.query.bbox;
    const bbox = bboxQuery.split(',').map(Number);

    let category;
    if (req.query.filter === 'undefined' || req.query.filter === '' ) {
        category = []
    } else {
        category = req.query.filter.split(',');
    }
        
    // console.log(category)

    let schools;


    // CATEGORY & PRICING is active
    if ((category.length > 0) && (maxPrice != '')) {
        console.log('price and category is present')
        schools = await School.find({ 
            geometry: { $geoWithin: { $box: [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ]}},
            category: { $all: category},
            'price.value': { $lte: maxPrice}
        });
    }

    // PRICING is active
    else if ((category.length === 0) && (maxPrice != '')) {
        console.log('price only is present')
        schools = await School.find({ 
            geometry: { $geoWithin: { $box: [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ]}},
            'price.value': { $lte: maxPrice}
            // 'price.value': { $gte: minPrice, $lte: maxPrice}
        });
    }

    // If CATEGORY filter is active
    else if (category.length > 0) {
        console.log('only category')
        schools = await School.find({ 
            geometry: { $geoWithin: { $box: [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ]}},
            category: { $all: category}
        });
    } else {
        console.log('the rest')
        schools = await School.find({ 
            geometry: { $geoWithin: { $box: [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ]}}
            
        })
        .skip((page - 1) * limit)
        .limit(limit);
        
        res.testing = "test"
    }



    // console.log(schools)
    // console.log(res)
    // console.log(paginate(schools))
    // res.send(paginate(schools))

    // res.send({
    //     schools: schools,
    //     paginationData: 2
    // }
    // )
    res.send(schools)
})

app.get('/:continent', catchAsync(async (req, res) => {
    // console.log(req.path)
    console.log('continent params')
    const { continent } = req.params;
    console.log(continent)
    

    const schools = await School.find({ 'context.continent.lowercase' : continent });

    if (!schools.length) {
        req.flash('error', 'No listings found on this continent.')
        res.redirect('/');
    }

    const counts = {}
    schools.forEach(el => {
        counts[el.country.name] = (counts[el.country.name] || 0) +1
        }
    )    
    res.render('indexes/continentIndex', { schools, counts })
}));

app.get('/:continent/:country', async (req, res) => {
    console.log('country params')
    const { country, continent } = req.params;

    console.log(country)
    const schools = await School.find({'context.continent.lowercase' : continent, 'country.lowercase' : country});

    if (!schools.length) {
        req.flash('error', 'No listings found.')
        res.redirect('/');
    }

    const counts = {};
    let cities = [];

    schools.forEach(el => {
        counts[el.city.name] = (counts[el.city.name] || 0) +1;
    })
    
    res.render('indexes/countryIndex', { schools, counts })
})

app.get('/:continent/:country/:city', async (req, res) => {
    console.log('country & city params')
    console.log(req.params)
    const { continent, country, city } = req.params;
    const schools = await School.find({'context.continent.lowercase' : continent, 'country.lowercase': country, 'city.lowercase' : city});

    if (!schools.length) {
        req.flash('error', 'No listings found.')
        res.redirect('/');
    }

    const counts = {};
    let cities = [];

    schools.forEach(el => {
        counts[el.city.name] = (counts[el.city.name] || 0) +1;
    })

    if (!schools.length) {
        req.flash('error', 'Invalid URL')
        res.redirect('/')
    } else {
        res.render('indexes/cityIndex', { schools, counts })
    }
})

// app.get('preschools/in/:country/:city', async (req, res) => {
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

app.all('*', (req, res, next) => {
    // next(new ExpressError('Page not found', 404))
    // res.send('404!!') 
    res.render('404')
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})


app.listen(3000, async () => {
    console.log('Serving on port 3000')
    try {
        await client.connect();
        collection = client.db("preschoolFinder").collection("schools");
    } catch (e) {
        console.error(e);
    }
});



// http://localhost:3000/school/6358e55d4897e0faa2c8e201/edit