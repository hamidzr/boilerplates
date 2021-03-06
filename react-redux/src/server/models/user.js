"use strict";

let crypto              = require('crypto'),
    mongoose            = require('mongoose'),
    Schema              = mongoose.Schema;

/***************** User Model *******************/

const makeSalt = () => (
    Math.round((new Date().valueOf() * Math.random())) + ''
);

const encryptPassword = (salt, password) => (
    crypto.createHmac('sha512', salt).update(password).digest('hex')
);

const reservedNames = ['password'];

let User = new Schema({
    'primary_email':{ type: String, required: true, index: { unique: true } },
    _id:            { type: String, required: true, index: { unique: true } },
    'first_name':   { type: String, default: '' },
    'last_name':    { type: String, default: '' },
    'city':         { type: String, default: '' },
    'hash':         { type: String, required: true },
    'salt':         { type: String, required: true },
    'games': [
        { type: Schema.Types.ObjectId, ref: 'Game' }
    ]
});

User.path('_id').validate(function(value) {
    if (!value) return false;
    if (reservedNames.indexOf(value) !== -1) return false;
    return (value.length > 5 && value.length <= 16 && /^[a-zA-Z0-9]+$/i.test(value));
}, 'invalid username');

User.path('primary_email').validate(function(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}, 'malformed address');

User.virtual('password').set(function(password) {
    this.salt = makeSalt();
    this.hash = encryptPassword(this.salt, password);
});

User.method('authenticate', function(plainText) {
    return encryptPassword(this.salt, plainText) === this.hash;
});

User.pre('save', function(next) {
    // Sanitize strings
    this._id            = this._id.toLowerCase();
    this.primary_email  = this.primary_email.toLowerCase();
    this.first_name     = this.first_name.replace(/<(?:.|\n)*?>/gm, '');
    this.last_name      = this.last_name.replace(/<(?:.|\n)*?>/gm, '');
    this.city           = this.city.replace(/<(?:.|\n)*?>/gm, '');
    next();
});

/***************** Registration *******************/

module.exports = mongoose.model('User', User);
