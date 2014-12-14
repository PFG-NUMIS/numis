/*jshint expr: true*/

'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, groupbuy;

/**
 * Groupbuy routes tests
 */
describe('Groupbuy CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Groupbuy
		user.save(function() {
			groupbuy = {
				name: 'Groupbuy Name',
				description: 'Groupbuy Description'
			};

			done();
		});
	});

	it('NU_T_G002_E101: should be able to save Groupbuy instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Get a list of Groupbuys
						agent.get('/api/v1/groupbuys')
							.end(function(groupbuysGetErr, groupbuysGetRes) {
								// Handle Groupbuy save error
								if (groupbuysGetErr) done(groupbuysGetErr);

								// Get Groupbuys list
								var groupbuys = groupbuysGetRes.body;

								// Set assertions
								//groupbuys.should.be.an.Array.with.lengthOf(1);
								// (groupbuys[0].user._id).should.equal(userId); // El listado de compras no devuelve al creador de cada una
								(groupbuys[0].name).should.match('Groupbuy Name');
								(groupbuys[0].description).should.match('Groupbuy Description');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E102: should not be able to save Groupbuy instance if not logged in', function(done) {
		agent.post('/api/v1/groupbuys')
			.send(groupbuy)
			.expect(401)
			.end(function(groupbuySaveErr, groupbuySaveRes) {
				// Call the assertion callback
				done(groupbuySaveErr);
			});
	});

	it('NU_T_G002_E103: should not be able to save Groupbuy instance if no name is provided', function(done) {
		// Invalidate name field
		groupbuy.name = '';
		groupbuy.slug = '_';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(400)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Set message assertion
						(groupbuySaveRes.body.name).should.match('ValidationError');
						(groupbuySaveRes.body.errors.name.path).should.match('name');
						(groupbuySaveRes.body.errors.name.type).should.match('required');
						//(groupbuySaveRes.body.message).should.match('Please fill Groupbuy name');

						// Handle Groupbuy save error
						done(groupbuySaveErr);
					});
			});
	});

	it('NU_T_G002_E104: should not be able to save Groupbuy instance if no description is provided', function(done) {
		// Invalidate name field
		groupbuy.description = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(400)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Set message assertion
						(groupbuySaveRes.body.name).should.match('ValidationError');
						(groupbuySaveRes.body.errors.description.path).should.match('description');
						(groupbuySaveRes.body.errors.description.type).should.match('required');
						//(groupbuySaveRes.body.message).should.match('Please fill Groupbuy description');

						// Handle Groupbuy save error
						done(groupbuySaveErr);
					});
			});
	});

	it('NU_T_G002_E105: should be able to update Groupbuy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Update Groupbuy name
						groupbuy.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Groupbuy
						agent.put('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(200)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body._id).should.equal(groupbuySaveRes.body._id);
								(groupbuyUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E106: should be able to get a list of Groupbuys if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			// Request Groupbuys
			request(app).get('/api/v1/groupbuys')
				.expect(401)
				.end(function(req, res) {
					// Set assertion
					(res.body.name).should.match('NotLogged');
					(res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});

		});
	});


	it('NU_T_G002_E107: should not be able to get a single Groupbuy if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			request(app).get('/api/v1/groupbuys/' + groupbuyObj._id)
				.expect(401)
				.end(function(req, res) {
					// Set assertion
					(res.body.name).should.match('NotLogged');
					(res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});
		});
	});

	it('NU_T_G002_E108: should not be able to delete Groupbuy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Delete existing Groupbuy
						agent.delete('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(200)
							.end(function(groupbuyDeleteErr, groupbuyDeleteRes) {
								// Handle Groupbuy error error
								if (groupbuyDeleteErr) done(groupbuyDeleteErr);

								// Set assertions
								//(groupbuyDeleteRes.body._id).should.equal(groupbuySaveRes.body._id);
								(groupbuyDeleteRes.body).should.be.empty;	// mongoose-rest-endpoints no devuelve contenido al borrar

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E109: should not be able to delete Groupbuy instance if not signed in', function(done) {
		// Set Groupbuy user
		groupbuy.user = user;

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			// Try deleting Groupbuy
			request(app).delete('/api/v1/groupbuys/' + groupbuyObj._id)
			.expect(401)
			.end(function(groupbuyDeleteErr, groupbuyDeleteRes) {
				// Set message assertion
				(groupbuyDeleteRes.body.message).should.match('User is not logged in');

				// Handle Groupbuy error error
				done(groupbuyDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Groupbuy.remove().exec();

		done();
	});
});