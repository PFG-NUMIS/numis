'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller.js'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User');

/**
 * Formatting user details to send
 */
exports.formattingUser = function(req, res, next) {
	var user 	= req.user,
		isAdmin = (user && user.role && user.role === 'admin'),
		isMe    = (user && user._id.equals(res._id) ),
		result  = {};

	if (user && user._id && res && res._id) {
		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self: {
					href: '/api/v1/users/' + res._id
				},
				avatar: {
					href: '/api/v1/users/' + res._id + '/avatar{?size}',
					title: 'Avatar image',
					templated: true
				},

				groupbuys: []
			},
			_id: res._id,
			username: res.username,
			name: res.name
		};

		if (res.provider === 'local') {
			result._links.password = { href: '/api/v1/users/password', title: 'Change password'};
		}

		if (isAdmin || isMe) {
			result.lastName 	= res.lastName;
			result.firstName 	= res.firstName;
			result.homeAddress	= res.homeAddress;
			result.email 		= res.email;
			result.role 		= res.role;
		}
		if (isAdmin) {
			result.provider = res.provider;
		}
	}

	// Send response
	next(result);
};

/**
* Formatting user details to send
*/
exports.formattingUserList = function(req, res, next) {
	var user 	= req.user,
		isAdmin = (user && user.role && user.role === 'admin');

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: {
				href: '/api/v1/users/'
			}
		},
		_embedded: {
			users: []
		}
	};

	for (var i = 0; i < res.length; i++) {
		result._embedded.users.push({
			_links: {
				self: {href: '/api/v1/users/' + res[i]._id},
				avatar: {
					href: '/api/v1/users/' + res[i]._id + '/avatar{?size}',
					title: 'Avatar image',
					templated: true
				}
			},
			_id: res[i]._id,
			username: res[i].username,
			name: res[i].name

		});
	}

	// Send response
	next(result);
};

/**
 * Update user details
 */
exports.update = function(req, res, next) {
	if (req.params.id) {
		// Init Variables
		var validFields = ['username', 'lastName', 'firstName', 'homeAddress', 'email'],
			user;

		user = User.findOne({
			_id: req.params.id
		}, '-password -salt').exec(function(err, user) {
			if (err) return next(err);

			if (!user) return next(new Error('Failed to load User ' + req.params.id));

			// Filter request data and removes invalid ones.
			var reqKeys = Object.keys(req.body);
			for (var i = 0, len = reqKeys.length; i < len; i++) {
				if (validFields.indexOf(reqKeys[i]) === -1) {
					delete req.body[reqKeys[i]];
				}
			}

			// Merge existing user data with new data
			user = _.extend(user, req.body);
			user.updated = Date.now();
			user.displayName = user.firstName + ' ' + user.lastName;

			next(user);
		});

	} else {
		return next(new Error('Failed to load User '));
	}
};
