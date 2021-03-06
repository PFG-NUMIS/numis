'use strict';

/**
 * Module dependencies.
 */
var _            = require('lodash'),
	errorHandler = require('../errors.server.controller.js'),
	core         = require('../core.server.controller'),
	mongoose     = require('mongoose'),
	passport     = require('passport'),
	User         = mongoose.model('User');

/**
 * Formatting user details to send
 */
var formattingUser = exports.formattingUser = function(user, req, reduce) {
	var isAdmin = (req && req.user && req.user.isAdmin() ),
		isMe    = (req && user && user._id.equals(req.user._id) ),
		result  = {};

	if (user && user._id) {
		var selfURL = '/api/v1' + user.toLink(),
			parentURL = selfURL.replace(/\/[a-f\d]{24}$/i, '');

		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self: { href: selfURL },
				collection: { href: parentURL, title: 'Users list' },
				avatar: {
					href: selfURL + '/avatar',
					title: 'Avatar image'
				},

				groupbuys: {
					href: selfURL + '/groupbuys', title: 'List of groupbuys belongs to'
				},
			},
			_id: 	  user._id,
			username: user.username,
			name: 	  user.name
		};

		if (!reduce) {
			if (user.provider === 'local') {
				result._links.password = { href: parentURL + '/password', title: 'Change my own password'};
			}

			if (isAdmin || isMe) {
				result.lastName 	= user.lastName;
				result.firstName 	= user.firstName;
				result.homeAddress	= user.homeAddress;
				result.email 		= user.email;
				result.provider     = user.provider;
				result.roles     	= user.roles;
			}
		}
	}

	return result;
};

/**
 * Formatting user details to send
 */
var formattingUserList = exports.formattingUserList = function(users, req, options) {
	// Add 'collectionName' key if not exists
	options = _.assign({collectionName: 'users'}, options);

	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: { href: selfURL }
		},
		_embedded: {
			users: []
		}
	};

	// Adding count properties
	if ( options.numElems !== 'undefined' )   { result.numElems = options.numElems; }
	if ( options.totalElems !== 'undefined' ) { result.totalElems = options.totalElems; }

	// Adding paggination links to result collection
	result._links = _.assign(result._links, core.addPaginationLinks(selfURL, options) );

	// Adding embedded users
	if (users || typeof users !== 'undefined') {
		for (var i = 0; i < users.length; i++) {
			result._embedded.users.push( formattingUser(users[i], req, true) );
		}
	}

	// Rename embedded collection
	if (options.collectionName !== 'users') {
		result._embedded[options.collectionName] = result._embedded.users;
		delete result._embedded.users;
	}

	return result;
};


/**
 * Create a User
 */
exports.create = function(req, res) {
	var user = new User(req.body);

	user.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(201).jsonp( formattingUser(user, req) );
		}
	});
};

/**
 * Show the current User
 */
exports.read = function(req, res) {
	res.jsonp( formattingUser(req.profile, req) );
};

/**
 * Update user details
 */
exports.update = function(req, res) {
	// Init Variables
	var user = req.profile,
		data = {};

	if (typeof req.body.username !== 'undefined') {
		data = req.body;
	} else if (typeof req.query.username !== 'undefined') {
		data = req.query;
	}

	// For security measurement we remove the roles from the req.body object
	delete data.roles;

	// Merge existing user
    user = _.extend(user, data);
    //user.updated = Date.now();	// It'll be done in pre-save hook.
    user.displayName = user.firstName + ' ' + user.lastName;

    user.save(function(err, user) {
    	if (err) {
			// Bad Request
    		return res.status(400).send( errorHandler.prepareErrorResponse (err) );
    	} else {
			res.jsonp( formattingUser(user, req) );
    	}
	});
};

/**
 * Delete an User
 */
exports.delete = function(req, res) {
	var user = req.profile;

	user.remove(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Users
 */
exports.list = function(req, res) {
	var query  = null,
		sort   = req.query.sort || 'username',
		limit  = req.query.limit || 25,
		page   = req.query.page || 1,
		fields = req.query.fields || {};

	User.paginate(query, page, limit, function(err, totalPages, users, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingUserList(users, req, {page: page, totalPages: totalPages, numElems: users.length, totalElems: count, selFields: fields}) );
		}
	}, { columns: fields, sortBy : sort });
};


/*
 * Send User
 */
exports.me = function(req, res) {
	res.jsonp( formattingUser(req.user, req) );
};
