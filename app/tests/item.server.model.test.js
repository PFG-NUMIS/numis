'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item = mongoose.model('Item');

/**
 * Globals
 */
var user1, groupbuy1, groupbuy2, item1;

/**
 * Unit tests
 */
describe('Item Model Unit Tests:', function(done) {
	beforeEach(function(done) {
		user1 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		groupbuy1 = new Groupbuy({
			title: 'Groupbuy #1',
			description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras semper suscipit velit, hendrerit fringilla purus mollis vitae. Praesent auctor non lectus ac consectetur. Maecenas quis consequat quam. Nullam sed feugiat neque. In hendrerit sagittis lacinia. Proin venenatis leo quis orci ultrices facilisis. Morbi rutrum augue vel est accumsan feugiat. Vestibulum interdum tincidunt metus in lobortis.<br/><br/>Integer blandit dui ut scelerisque iaculis. Aliquam fringilla pulvinar cursus. Sed porttitor laoreet nunc a ultrices. Ut ac gravida turpis. Proin a ipsum sed erat tempor ultrices in vitae sem. Quisque auctor ex ante, at semper magna rutrum at. Nunc non maximus metus, in rutrum ligula. Nullam accumsan at ante sed ornare. Suspendisse est sem, varius eu mi eu, bibendum finibus neque. Sed vehicula malesuada velit. Maecenas ut augue ligula. Cras blandit libero ut lobortis ornare. Cras varius varius vestibulum.<br/><br/>Nulla a hendrerit enim. Nunc consequat dolor nec orci aliquet, a tempor dolor consequat. Donec elementum nisi lacus, ut cursus nibh facilisis vel. Mauris eget sapien porttitor, elementum dui condimentum, luctus lacus. Aenean quis volutpat lectus. Aenean porta iaculis egestas. Aenean sollicitudin tincidunt interdum.<br/><br/>In maximus nunc sit amet felis molestie, ut imperdiet nunc tincidunt. Etiam in magna quis velit commodo euismod a at elit. Mauris tristique elementum lobortis. Phasellus posuere sollicitudin justo, et rutrum urna varius at. Vivamus facilisis nulla sem, pellentesque maximus lorem bibendum sed. Phasellus aliquet leo a nibh tincidunt ultrices. Nulla a venenatis tortor, accumsan egestas dolor.<br/><br/>Fusce vestibulum lacinia neque quis imperdiet. Curabitur ultricies diam eu tellus maximus vestibulum. Curabitur bibendum turpis vitae lorem fermentum aliquet. Morbi vel odio neque. Cras et dignissim massa, nec aliquam leo. In egestas ut dui eu sodales. In vel sagittis urna, ullamcorper imperdiet ligula. Sed nec malesuada augue, quis facilisis sapien.',
			user: user1
		});

		groupbuy2 = new Groupbuy({
			title: 'Groupbuy #2',
			description: 'Buscar información en <a href="https://www.google.es/">Google</a>',
			user: user1
		});

		user1.save(function() {
			groupbuy1.save(function() {
				groupbuy2.save(function() {
					
					item1 = new Item({
						title: 'Item Title',
						description: 'Description',
						price: 100,
						currency: {
							code: 'EUR',
							symbol: '€'
						},
						groupbuy: groupbuy1,
						user: user1
					});

					done();
				});

			});
		});
	});

	describe('Method Save', function() {
		it('NU_P_G311_E001: should be able to save without problems', function(done) {
			return item1.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_P_G311_E002: should be able to show an error when try to save without name', function(done) {
			item1.title = '';

			return item1.save(function(err) {
				should.exist(err);
				done();
			});
		});

        it('NU_P_G311_E003: should be able to show an error when try to save without user creator', function(done) {
            item1.user = undefined;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G311_E004: should be able to show an error when try to save without Groupbuy', function(done) {
            item1.groupbuy = undefined;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G311_E005: should be able to show an error when try to save item with negative price', function(done) {
            item1.price = -1;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G311_E006: should be able to save item with floating price with 2 decimal places', function(done) {
            item1.price = 4.56;

            return item1.save(function(err) {
                should.not.exist(err);

                item1.price.should.equal(4.56);

                done();
            });
        });

        it('NU_P_G311_E007: should be able to save item with floating price with more than 2 decimal places', function(done) {
            item1.price = 4.567890;

            return item1.save(function(err) {
                should.not.exist(err);

                item1.price.should.equal(4.57);

                done();
            });
        });

        it('NU_P_G311_E008: should be able to save item with USD currency with spaces before and after it', function(done) {
            item1.currency = {
                code: '  USD ',
                symbol: '$'
            };

            return item1.save(function(err) {
                should.not.exist(err);

                item1.currency.code.should.equal('USD');
                item1.currency.symbol.should.equal('$');

                done();
            });
        });

        it('NU_P_G311_E009: should be able to show an error when try to save item with less 3-characters currency code', function(done) {
            item1.currency = {
                code: 'US',
                symbol: '$'
            };

            return item1.save(function(err) {
                should.exist(err);

                err.name.should.equal('ValidationError');
                err.errors.should.have.property('currency.code');

                done();
            });
        });

        it('NU_P_G311_E010: should be able to show an error when try to save item with more 3-characters currency code', function(done) {
            item1.currency = {
                code: 'USDollar',
                symbol: '$'
            };

            return item1.save(function(err) {
                should.exist(err);

                err.name.should.equal('ValidationError');
                err.errors.should.have.property('currency.code');

                done();
            });
        });

	});

	afterEach(function(done) {
		Item.remove().exec();
		Groupbuy.remove().exec();
		User.remove().exec();

		done();
	});
});