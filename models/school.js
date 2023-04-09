const mongoose = require('mongoose');
const review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

// ImageSchema.get(function() {
//     return this.url.replace('/upload', 'upload/100')
// })

const GeoSchema = new Schema({
    type: {
        type: String,
        enum: ['Point']
    },
    coordinates: {
        type: [Number],
        index: '2dsphere'
    },
    _id: false
});

const ClaimantSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    verified: {
        type: Boolean,
        default: false
    },
    businessProof: [ImageSchema],
    _id: false
});

const SchoolSchema = new Schema({
    title: String,
    description: String,
    price: {
        value: Number,
        currency: String,
    },
    city: {
        name: String,
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        bbox: String,
        lowercase: String
    },
    country: {
        name: String,
        code: String,
        lowercase: String
    },
    geometry: GeoSchema,
    context: {
        fullAddress: String,
        streetName: String,
        streetNumber: String,
        zip: String,
        region: String,
        neighborhood: String,
        locality: String,
        district: String,
        continent: {
            name: String,
            lowercase: String
        }
    },
    category: [String],
    amenities: [String],
    images: [ImageSchema],
    contact: {
        email: {
            type: String,
            lowercase: true
        },
        www: String,
        phone: String,
        fb: String,
        ig: String,
        manager: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    ownership: [ClaimantSchema],
    // ownerVerified: {
    //     type: Boolean,
    //     default: false
    // },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    totalRating: {
        type: Number,
        default: 0
    },
    tier: {
        type: String,
        default: 'free'
    },
    active: {
        type: Boolean,
        default: true // later change to false, as Admin has to approve each addition
    }
}, { timestamps: true });

// SchoolSchema.post('findByIdAndDelete', async function (doc) {
//     console.log(doc)
//     console.log('Mongo Middleware triggered')
//     if (doc) {
//         await review.remove({
//             _id: {
//                 $in: doc.reviews
//             }
//         })
//     }
// })
// SchoolSchema.virtual('totalRating').get(function() {
//     // get array of all review ratings
//     const arr = this.reviews.map(review => review.rating);
//     return arr.reduce((sum, a) => sum + a, 0) / this.reviews.length;
// })

// SchoolSchema.pre('updateOne', { document: true, query: false }, function() {
//     console.log('Updating');
//     if (this.reviews.length > 0) {
//         const arr = this.reviews.map(review => review.rating);
//         return this.totalRating = arr.reduce((sum, a) => sum + a, 0) / this.reviews.length;
//     } else {
//         return this.totalRating = 0;
//     }
//   });

SchoolSchema.post('findOneAndUpdate', async function(doc) {
    if (doc.reviews.length > 0) {
        const docs = await review.find({
            '_id': { $in: doc.reviews },
        });
        const arr = docs.map(review => review.rating);
        doc.totalRating = arr.reduce((sum, a) => sum + a, 0) / docs.length;
        doc.save()
    }
});

// SchoolSchema.post('save', function() {
//     if (this.reviews.length > 0) {
//         const arr = this.reviews.map(review => review.rating);
//         return this.totalRating = arr.reduce((sum, a) => sum + a, 0) / this.reviews.length;
//     } else {
//         return this.totalRating = 0;
//     }
// })

SchoolSchema.post('findOneAndDelete', async function (doc) {
    console.log(doc)
    console.log('Mongo Middleware triggered')
    if (doc) {
        await review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('School', SchoolSchema);