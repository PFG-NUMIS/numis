'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');

/**
 * Globals
 */
var user, user2, user3;

/**
 * Unit tests
 */
describe('User Model Unit Tests:', function() {
	before(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@example.net',
			username: 'username',
			password: 'password',
			provider: 'local'
		});
		user2 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@example.net',
			username: 'username',
			password: 'password',
			provider: 'local'
		});
		user3 = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'jdoe@example.net',
			username: 'jdoe',
			password: 'password',
			provider: 'local',
			homeAddress: 'Fake Street 123, 22150 Springfiled, Virginia USA'
		});

		// Remove old previous data
		User.remove().exec();

		done();
	});

	describe('Method Save', function() {
		it('NU_T_G001_E001: should begin with no users', function(done) {
			User.find({}, function(err, users) {
				users.should.have.length(0);
				done();
			});
		});

		it('NU_T_G001_E002: should be able to save user without problems', function(done) {
			user.save(done);
		});

		it('NU_T_G001_E003: should be able to save user with home address without problems', function(done) {
			user3.save(done);
		});

		it('NU_T_G001_E004: should fail to save an existing user again', function(done) {
			user.save();
			return user2.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_T_G001_E005: should be able to show an error when try to save without first name', function(done) {
			user.firstName = '';
			return user.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	after(function(done) {
		User.remove().exec();
		done();
	});
});