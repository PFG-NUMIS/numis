'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	mongoose = require('mongoose'),
	restEndpoints = require('mongoose-rest-endpoints'),
	errorHandler = require('../../app/controllers/errors.server.controller'),
	users = require('../../app/controllers/users.server.controller');

module.exports = function(app) {
	// User Routes
	/*
	*
	*/
/*
	var userListPreFilter = function(req, query, next) {
		//console.log('req: ', req.query);

		next(query);
	};
*/
	/*
	 *
	 */
	var userPreResponseError = function(req, error, next) {
		errorHandler.prepareErrorResponse(error.message);

		next(error);
	};

	// Register end point for '/users' and /users/:id'
	//restEndpoints.log.verbose(true);
	new restEndpoints
				.endpoint('/api/v1/users', 'User', {
					queryParams: ['username', 'name', 'email', '$in_role'],
					pagination: {
						perPage: 50,
						sortField: 'username'
					}
				})
				.addMiddleware('*', users.requiresLogin)
				//.tap('pre_filter', 'list', userListPreFilter)
				//.tap('pre_filter', 'fetch', userListPreFilter)
				//.tap('post_retrieve', 'list', userListPreFilter)
				//.tap('post_retrieve', 'fetch', userListPreFilter)
				.tap('pre_save',     	   'put',    users.update)
				.tap('pre_response', 	   'list',   users.formattingUserList)
				.tap('pre_response', 	   'fetch',  users.formattingUser)
				.tap('pre_response', 	   'post',   users.formattingUser)
				.tap('pre_response_error', '*',      userPreResponseError)
				.register(app);

	// Setting up the users profile api
	//app.route('/users/me').get(users.me);
	app.route('/users/me').get( function(req, res, next) {
		res.url = '/api/v1/users/' + req.user._id;

		next();
	});

	app.route('/users').put( function(req, res, next) {
		res.url = '/api/v1' + res.url;

		next();
	});

//	app.route('/users/accounts').delete(users.removeOAuthProvider);

	// Setting up the users avatar api
	app.route('/api/v1/users/:userId/avatar')
		.get(users.requiresLogin, users.userByID, users.getAvatar)
		.put(users.requiresLogin, users.userByID, users.updateAvatar)
		.delete(users.requiresLogin, users.deleteAvatar);

	// Setting up the users password api
	app.route('/users/password').post(users.requiresLogin, users.changePassword);
	app.route('/auth/forgot').post(users.forgot);
	app.route('/auth/reset/:token').get(users.validateResetToken);
	app.route('/auth/reset/:token').post(users.reset);

	// Setting up the users authentication api
	app.route('/auth/signup').post(users.signup);
	app.route('/auth/signin').post(users.signin, users.formattingUser);
	app.route('/auth/signout').get(users.signout);

/*
	// Setting the facebook oauth routes
	app.route('/auth/facebook').get(passport.authenticate('facebook', {
		scope: ['email']
	}));
	app.route('/auth/facebook/callback').get(users.oauthCallback('facebook'));

	// Setting the twitter oauth routes
	app.route('/auth/twitter').get(passport.authenticate('twitter'));
	app.route('/auth/twitter/callback').get(users.oauthCallback('twitter'));

	// Setting the google oauth routes
	app.route('/auth/google').get(passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}));
	app.route('/auth/google/callback').get(users.oauthCallback('google'));

	// Setting the linkedin oauth routes
	app.route('/auth/linkedin').get(passport.authenticate('linkedin'));
	app.route('/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

	// Setting the github oauth routes
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(users.oauthCallback('github'));
*/

	// Finish by binding the user middleware
	app.param('userId', users.userByID);
};