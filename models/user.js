const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const bcrypt = require('bcrypt')


const ROLE = {
    ADMIN: 'admin',
    BASIC: 'basic',
    PREMIUM: 'premium'
}

const ImageSchema = new Schema({
    url: String,
    filename: String
}, { _id : false });

const SchoolOwnedSchema = new Schema({
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School'
    },
    businessProof: [ImageSchema]
})

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        // lowercase: true
    },
    fullname: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    emailToken: String,
    newEmail: {
        type: String,
        required: false
    },
    location: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profileImage: ImageSchema,
    isAdmin: { 
        type: Boolean,
        default: false
    },
    provider: {
        type: String,
        default: 'email'
    },
    provider_id: {
        type: String,
        default: null
    },
    facebookId: String,
    role: {
        type: String,
        default: ROLE.BASIC
    },
    ownership: [SchoolOwnedSchema]
});

// UserSchema.statics.findAndValidate = async function (username, password) {
//     const foundUser = await this.findOne({ username });
//     const isValid = await bcrypt.compare(password, foundUser.password);
//     return isValid ? foundUser : false;
// }

// UserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate)

module.exports = mongoose.model('User', UserSchema);

// module.exports.encryptPassword = (password) => {
//     const salt = bcrypt.genSaltSync(10);
//     const hash = bcrypt.hashSync(password, salt, null);
//     return hash;
// }

// module.exports.validPassword = (password, hash) => {
//     return bcrypt.compareSync(password, hash);
// }
