'use strict';

var mongoose = require('mongoose'),
	restEndpoints = require('mongoose-rest-endpoints'),
	errorHandler = require('../../app/controllers/errors.server.controller'),
	users = require('../../app/controllers/users.server.controller'),
	groupbuys = require('../../app/controllers/groupbuys.server.controller');

module.exports = function(app) {

	/*
	 *
	 */
	var groupbuyListPreFilter = function(req, query, next) {
		var isAdmin = (req.user && req.user.role && req.user.role === 'admin');

		if (!isAdmin) {
			if (req.user) {
				//data.$or = [{_id: '547e3ab9b1a7a0ad7df3fcac'}, {name: 'Japón-500 yenes - Serie prefecturas (Septiembre 2014)'}];
				query.$or = [{status: { '$in': ['new', 'published', 'payments', 'paid', 'shipments', 'closed']} },
					 		 {managers: {$elemMatch: {managers: req.user._id} } }];
			} else {
				query.status = { '$in': ['new', 'published', 'payments', 'paid', 'shipments', 'closed']};
			}
		}

		next(query);
	};

	/*
	 *
	 */
	var groupbuyPreResponseError = function(req, error, next) {
		errorHandler.prepareErrorResponse(error.message);

		next(error);
	};

	// Register end point for '/groupbuys' and /groupbuys/:id'
	//restEndpoints.log.verbose(true);
	new restEndpoints
				.endpoint('/api/v1/groupbuys', 'Groupbuy', {
					limitFields: ['_id', 'title', 'name', 'description', 'status', 'managers', 'members'],
					populate: ['members', 'managers', 'user'],
					queryParams: ['$in_status', 'title', '$gte_created'],
					pagination: {
						perPage: 20,
						sortField: 'title'

					}
				})
				.addMiddleware('*', users.requiresLogin)
				.tap('pre_filter', 		   'list',   groupbuyListPreFilter)
				.tap('pre_response', 	   'list',   groupbuys.formattingGroupbuyList)
				.tap('pre_response', 	   'fetch',  groupbuys.formattingGroupbuy)
				.tap('pre_response', 	   'post',   groupbuys.formattingGroupbuy)
				.tap('pre_response_error', '*',      groupbuyPreResponseError)
				.register(app);

	// Members end-points
	app.route('/api/v1/groupbuys/:groupbuyId/members')
		.get(groupbuys.getMembersList)
		.put(users.requiresLogin, groupbuys.addMember);

	app.route('/api/v1/groupbuys/:groupbuyId/members/:userId')
		.delete(users.requiresLogin, groupbuys.deleteMember);

	// Managers end-points
	app.route('/api/v1/groupbuys/:groupbuyId/managers')
		.get(groupbuys.getManagersList)
		.put(users.requiresLogin, groupbuys.addManager);

	app.route('/api/v1/groupbuys/:groupbuyId/managers/:userId')
		.delete(users.requiresLogin, groupbuys.deleteManager);

	// Finish by binding the Item middleware
	app.param('userId', users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);

};
