'use strict';

/**
 * Module dependencies.
 */
var mongoose 	  = require('mongoose'),
	slugPlugin	  = require('mongoose-url-slugs'),
	filePluginLib = require('mongoose-file'),
	filePlugin	  = filePluginLib.filePlugin,
	crypto	 	  = require('crypto'),
	path		  = require('path'),
	Schema 	 	  = mongoose.Schema;

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function(property) {
	return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function(password) {
	return (this.provider !== 'local' || (password && password.length >= 8));
};


/**
* Creates a new Person.
* @class Person
*/

/**
 * User Schema
 */
var UserSchema = new Schema({
	firstName: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your first name']
	},
	lastName: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your last name']
	},
	displayName: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your email'],
		match: [/.+\@.+\..+/, 'Please fill a valid email address']
	},
	username: {
		type: String,
		unique: 'Username is not available. Please select another one.',
		required: 'Please fill in a username',
		trim: true
	},
	homeAddress: {
		type: String,
		trim: true
	},
	password: {
		type: String,
		default: '',
		validate: [validateLocalStrategyPassword, 'Password should be longer'],
	},
	salt: {
		type: String,
	},
	provider: {
		type: String,
		required: 'Provider is required'
	},
	providerData: {
		select: false
	},
	additionalProvidersData: {
		select: false
	},
	role: {
		type: String,
		enum: ['pending', 'user', 'admin'],
		default: 'user',
		select: true
	},
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	},
	/* For reset password */
	resetPasswordToken: {
		type: String,
		select: false
	},
	resetPasswordExpires: {
		type: Date,
		select: false
	}
});


/**
 * Add plugins to User schema.
 */
UserSchema.plugin(slugPlugin('username', {field: 'name'}));


var uploads_base = path.join(__dirname, '../../'),
 	uploads 	 = path.join(uploads_base, 'uploads');

UserSchema.plugin(filePlugin, {
	name: 'avatar',
	upload_to: filePluginLib.make_upload_to_model(uploads, 'avatars'),
	relative_to: uploads_base
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
	if (this.password && this.password.length > 6) {
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		this.password = this.hashPassword(this.password);
	}

	next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
	if (this.salt && password) {
		return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if (!err) {
			if (!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

// Compile a 'User' model using the UserSchema as the structure.
// Mongoose also creates a MongoDB collection called 'users' for these documents.
//
// Notice that the 'User' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('User', UserSchema);
