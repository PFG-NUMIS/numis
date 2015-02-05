'use strict';

/**
 * Module dependencies.
 */
var mongoose 	  = require('mongoose'),
	slugPlugin	  = require('mongoose-url-slugs'),
	filePluginLib = require('mongoose-file'),
	filePlugin	  = filePluginLib.filePlugin,
	path		  = require('path'),
	Schema = mongoose.Schema;


var getPrice = function (num) {
    return (num / 100);
};

var setPrice = function (num) {
    return Math.round(num * 100);
};


/**
 * Item Schema
 */
var ItemSchema = new Schema({
	title: {
		type: String,
		default: '',
		required: 'Please fill Item title',
		trim: true
	},
    description: {
        type: String,
        default: '',
        required: 'Please fill Item description',
        trim: true
    },
	maxQuantity: {
		type: Number,
		min: [0, 'The maximum amount can not be negative. Specify 0 for no set maximum amount']
	},
	price: {
		type: Number,
		min: [0, 'The price can not be less than ({MIN}).'],
		required: 'Please fill Item price',
        get: getPrice,
        set: setPrice
	},
	currency: {
        code: {
            type: String,
            default: 'EUR',
            required: 'Please select currency.',
            trim: true
        },
        symbol: {
		    type: String,
		    default: '€',
		    required: 'Please select currency.',
		    trim: true
        }
	},
	updated: {
		type: Date,
		default: Date.now
	},
	created: {
		type: Date,
		default: Date.now
	},
    groupbuy: {
        type: Schema.ObjectId,
        ref: 'Groupbuy',
        required: 'You must specify the groupbuy'
    },
	user: {
		type: Schema.ObjectId,
		ref: 'User',
		required: 'You must specify the user creator'
	}
});


/**
 * Add validators to Item schema.
 */
ItemSchema.path('currency.code').validate( function (value) {
    return value.length === 3;
}, 'Currency code must containt 3 characters.');


/**
* Add plugins to Item schema.
*/
ItemSchema.plugin(slugPlugin('title', {field: 'name'}));


var uploads_base = path.join(__dirname, '../../'),
	uploads 	 = path.join(uploads_base, 'uploads');

ItemSchema.plugin(filePlugin, {
	name: 'image',
	upload_to: filePluginLib.make_upload_to_model(uploads, 'items'),
	relative_to: uploads_base
});

ItemSchema.set('toJSON', { getters: true, virtuals: false });
ItemSchema.set('toObject', { getters: true, virtuals: false });

mongoose.model('Item', ItemSchema);