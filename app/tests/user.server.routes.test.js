/*jshint expr: true*/

'use strict';

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	_ = require('lodash'),
	app = require('../../server'),
	User = mongoose.model('User'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, user2;

/**
 * User routes tests
 */
describe('User CRUD tests', function() {
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
			email: 'test@example.net',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Remove old previous data
		User.remove().exec();

		// Save a user to the test db and create new User
		user.save(done);

		// Define another users
		user2 = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'jdoe@example.net',
			username: 'jdoe',
			password: credentials.password,
			provider: 'local'
		};
	});

	it('NU_T_G111_E101: should be able to save User instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						// Handle User save error
						if (userSaveErr) done(userSaveErr);

						// Get a list of Users
						agent.get('/api/v1/users?sortField=username')
							.expect(200)
							.end(function(usersGetErr, usersGetRes) {
								// Handle User save error
								if (usersGetErr) done(usersGetErr);

								// Get users list
								var users = usersGetRes.body;

								// Set assertions
								users.should.be.an.Object.not.be.empty;
								users.should.have.propertyByPath('_links', 'self');

								users._embedded.users.should.be.an.Array.with.lengthOf(2);
								// The second user is the authenticated user.
								(users._embedded.users[1].name).should.be.equal(user.name);
								(users._embedded.users[1].username).should.be.equal(user.username);

								// First user is the new user
								(users._embedded.users[0]).should.have.properties('_id', 'name', 'username');
								(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
								(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');
								(users._embedded.users[0].username).should.be.equal(user2.username);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G111_E102: should not be able to save User instance if not logged in', function(done) {
		agent.post('/api/v1/users')
			.send(user2)
			.expect(401)
			.end(function(userSaveErr, userSaveRes) {
				//console.log('userSaveRes: ', userUpdateRes.body);

				// Set assertions
				(userSaveRes.body.name).should.match('NotLogged');
				(userSaveRes.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done(userSaveErr);
			});
	});

	it('NU_T_G111_E103: should not be able to save User instance if no firstName, lastNmae, email, username are provided', function(done) {
		user2.firstName = '';
		user2.lastName = '';
		user2.email = '';
		user2.username = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.end(function(userSaveErr, userSaveRes) {
						// Set message assertions
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('ValidationError');

						(userSaveRes.body).should.have.propertyByPath('errors', 'firstName', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'lastName', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'email', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'username', 'message');

						(userSaveRes.body.errors.firstName.message).should.match('Please fill in your first name');
						(userSaveRes.body.errors.lastName.message).should.match('Please fill in your last name');
						(userSaveRes.body.errors.email.message).should.match('Please fill in your email');
						(userSaveRes.body.errors.username.message).should.match('Please fill in a username');

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_T_G111_E104: should not be able to save User instance if email is not valid', function(done) {
		// Invalidate email field
		user2.email = 'fake email@';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.end(function(userSaveErr, userSaveRes) {
						//console.log('userSaveRes: ', userSaveRes.body);

						// Set message assertion
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('ValidationError');

						(userSaveRes.body).should.have.propertyByPath('errors', 'email', 'message');
						(userSaveRes.body.errors.email.message).should.match('Please fill a valid email address');

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_T_G111_E105: should not be able to save User instance if username already exists', function(done) {
		// Duplicate username field
		user2.username = user.username;

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.end(function(userSaveErr, userSaveRes) {
						//console.log('userSaveRes: ', userSaveRes.body);

						// Set message assertion
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('DuplicateError');
						//(userSaveRes.body).should.have.property('message');

						(userSaveRes.body).should.have.propertyByPath('errors', 'username', 'message');
						(userSaveRes.body.errors.username.path).should.match('username');
						(userSaveRes.body.errors.username.type).should.match('unique');
						(userSaveRes.body.errors.username.code).should.match(11000);

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_T_G111_E106: should not be able to save User instance if password has less than 8 characters', function(done) {
		// Duplicate username field
		user2.password = '1234567';

		agent.post('/auth/signin')
		.send(credentials)
		.expect(200)
		.end(function(signinErr, signinRes) {
			// Handle signin error
			if (signinErr) done(signinErr);

			// Save a new User
			agent.post('/api/v1/users')
			.send(user2)
			.expect(400)
			.end(function(userSaveErr, userSaveRes) {
				//console.log('userSaveRes: ', userSaveRes.body);

				// Set message assertion
				(userSaveRes.body).should.be.an.Object.not.be.empty;
				(userSaveRes.body.name).should.match('ValidationError');

				(userSaveRes.body).should.have.propertyByPath('errors', 'password', 'message');
				(userSaveRes.body.errors.password.message).should.match('Password should be longer');

				// Handle User save error
				done(userSaveErr);
			});
		});
	});

	it('NU_T_G111_E107: should be able to save User instance but not save role specification', function(done) {
		// Duplicate username field
		user2.role = 'admin';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.end(function(userSaveErr, userSaveRes) {
						// Returns new user info

						// Set assertions
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body).should.have.propertyByPath('_links', 'self');

						(userSaveRes.body).should.have.property('name');
						(userSaveRes.body.username).should.match(user2.username);

						//(userSaveRes.body.role).should.not.match(user2.role);

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_T_G111_E108: should be able to update User instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId 		 = signinRes.body._id;
				var userPassword = user.password;

				// Update User name and home address
				user.firstName = 'Fred';
				user.lastName = 'Flintstones';
				user.homeAddress = '301 Cobblestone Way, Bedrock 70777';
				user.username = 'Flintstones';

				// Update existing User
				agent.put('/api/v1/users/' + userId)
					.send(user)
					.expect(204)
					.end(function(userUpdateErr, userUpdateRes) {
						// Handle User update error
						if (userUpdateErr) done(userUpdateErr);

						// Set assertions
						(userUpdateRes.body).should.be.empty;

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_T_G111_E109: should not be able to update User instance if not signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				agent.get('/auth/signout')
					.expect(302)	// Redirect to '/'
					.end(function(signoutErr, signoutRes) {
						// Handle signin error
						if (signoutErr) done(signoutErr);

						// Update User name and home address
						user.firstName = 'Fred';
						user.lastName = 'Flintstones';
						user.displayName = 'The Flintstones';
						user.homeAddress = '301 Cobblestone Way, Bedrock 70777';

						// Update existing User
						agent.put('/api/v1/users/' + userId)
							.send(user)
							.expect(401)
							.end(function(userUpdateErr, userUpdateRes) {
								// Handle User update error
								if (userUpdateErr) done(userUpdateErr);

								//console.log('userSaveRes: ', userUpdateRes.body);

								// Set assertions
								(userUpdateRes.body.name).should.match('NotLogged');
								(userUpdateRes.body.message).should.match('User is not logged in');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G111_E110: should be able to update User roles if have admin role', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				// Update User name and home address
				user.firstName = 'Fred';
				user.lastName = 'Flintstones';
				user.displayName = 'The Flintstones';

				// Update existing User
				agent.put('/api/v1/users/' + userId)
					.send(user)
					.expect(204)
					.end(function(userUpdateErr, userUpdateRes) {
						// Handle User update error
						if (userUpdateErr) done(userUpdateErr);

						// Set assertions
						(userUpdateRes.body).should.be.empty;

						// Call the assertion callback
						done();
					});

			});
	});

	it('NU_T_G111_E111: should be able to get a list of Users if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Users
				agent.get('/api/v1/users')
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');

						(users._embedded.users).should.be.an.Array.with.lengthOf(1);

						// The user is the new user
						(users._embedded.users[0]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');
						(users._embedded.users[0].username).should.be.equal(user.username);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_T_G111_E112: should not be able to get a list of Users if not signed in', function(done) {
		// Request Users
		agent.get('/api/v1/users')
			.expect(401)
			.end(function(req, res) {
				// Set assertion
				(res.body.name).should.match('NotLogged');
				(res.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done();
			});
	});

	it('NU_T_G111_E113: should be able to get a single User if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				// Request Users
				agent.get('/api/v1/users/' + userId)
					.expect(200)
					.end(function(userFetchErr, userFetchRes) {
						// Set assertion
						(userFetchRes.body).should.be.an.Object.not.be.empty;
						(userFetchRes.body).should.have.propertyByPath('_links', 'self', 'href');

						// First user is the new user
						(userFetchRes.body).should.have.properties('email', 'firstName', 'lastName', 'name', 'username');
						(userFetchRes.body.username).should.be.equal(user.username);
						(userFetchRes.body.firstName).should.be.equal(user.firstName);
						(userFetchRes.body.lastName).should.be.equal(user.lastName);
						(userFetchRes.body.email).should.be.equal(user.email);

						// Call the assertion callback
						done();
					});

			});
	});

	it('NU_T_G111_E114: should not be able to get a single User if not signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				agent.get('/auth/signout')
					.expect(302)	// Redirect to '/'
					.end(function(signoutErr, signoutRes) {
						// Handle signin error
						if (signoutErr) done(signoutErr);

						// Request User
						agent.get('/api/v1/users/' + userId)
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
	});

	it('NU_T_G111_E115: should not be able to delete User instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.end(function(userSaveErr, userSaveRes) {
						// Handle User save error
						if (userSaveErr) done(userSaveErr);

						// Delete existing User
						agent.delete('/api/v1/users/' + userSaveRes.body._id)
							.send(user)
							.expect(204)
							.end(function(userDeleteErr, userDeleteRes) {
								// Handle User error error
								if (userDeleteErr) done(userDeleteErr);

								// Set assertions
								(userDeleteRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G111_E116: should not be able to delete User instance if not signed in', function(done) {
		// Set User user
		user.user = user;

		// Create new User model instance
		var userObj = new User(user);

		// Save the User
		userObj.save(function() {
			// Try deleting User
			agent.delete('/api/v1/users/' + userObj._id)
				.expect(401)
				.end(function(userDeleteErr, userDeleteRes) {
					// Set message assertion
					(userDeleteRes.body.message).should.match('User is not logged in');

					// Handle User error error
					done(userDeleteErr);
				});

		});
	});

	afterEach(function(done) {
		agent.get('/auth/signout')
			.expect(302)
			.end(function(signoutErr, signoutRes) {
				User.remove().exec();

				done();
			});
	});

});