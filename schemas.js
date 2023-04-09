const Joi = require('joi');

module.exports.schoolSchema = Joi.object({
    school: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().allow(''),
        price: Joi.object({
            value: Joi.number(),
            currency: Joi.string()
        }),
        city: Joi.object({
            name: Joi.string().required(),
            coordinates: Joi.string(),
            bbox: Joi.string(),
            // coordinates: Joi.object({
            //     type: Joi.array().items(Joi.string())
            // })
            lowercase: Joi.string()
        }),
        country: Joi.object({
            name: Joi.string(),
            code: Joi.string(),
            lowercase: Joi.string()
        }),
        context: Joi.object({
            fullAddress: Joi.string().allow(''),
            streetName: Joi.string().allow(''),
            streetNumber: Joi.string().allow(''),
            zip: Joi.string().allow(''),
            region: Joi.string().allow(''),
            neighborhood: Joi.string().allow(''),
            locality: Joi.string().allow(''),
            district: Joi.string().allow(''),
            continent: Joi.object({
                name: Joi.string().allow(''),
                lowercase: Joi.string().allow('')
            })
        }),
        contact: Joi.object({
            email: Joi.string().email(),
            phone: Joi.string().allow(''),
            fb: Joi.string().allow(''),
            ig: Joi.string().allow(''),
            www: Joi.string().allow(''),
            manager: Joi.string().allow('')
        }),
        lat: Joi.string().allow(''),
        long: Joi.string().allow(''),
        geometry: Joi.object({
            coordinates: Joi.string()
            // coordinates: Joi.array().items(Joi.number())
        }),
        ownershio: Joi.object({
            owner: Joi.string().allow(''),
            verified: Joi.boolean()
        }),
        owner: Joi.string().allow(''),
        // category: Joi.any(),
        // category: Joi.string(),
        category: Joi.array().items(Joi.string()).single(),
        amenities: Joi.any(),
        totalRating: Joi.any()
        // amenities: Joi.array().items(Joi.string()).allow(''),
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        title: Joi.string().required(),
        body: Joi.string().required(),
        pros: Joi.array().items(Joi.string().allow('')),
        cons: Joi.array().items(Joi.string().allow(''))
    }).required()
})

