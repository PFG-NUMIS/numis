'use strict';


var errorTypes = ['ValidationError', 'DuplicateError', 'UnexpectedError'];

/**
 * Get unique error field name
 */
var getUniqueErrorData = function(err) {
	var output, fieldName = '';

	try {
		fieldName = err.err.substring(err.err.lastIndexOf('.$') + 2, err.err.lastIndexOf('_1'));
		output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

	} catch (ex) {
		output = 'Unique field already exists';
	}

	return {field: fieldName, message: output};
};

/**
 * Get the error message from error object
 */
exports.getErrorMessage = function(err) {
	var message = '';

	if (typeof err === 'object' && typeof err.message !== 'undefined') {
		message = err.message;
	} else {
		if (err.code) {
			switch (err.code) {
				case 11000:
				case 11001:
					message = getUniqueErrorData(err).message;

					break;
				default:
					message = 'Something went wrong';
			}
		} else {
			for (var errName in err.errors) {
				if (err.errors[errName].message) message = err.errors[errName].message;
			}
		}
	}

	return message;
};


/**
* Get the error message from error object
*/
exports.prepareErrorResponse = function(err) {
	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				var det = getUniqueErrorData(err);

				err.name = 'DuplicateError';
				err.message = det.message;
				err.errors = {};
				err.errors[det.field] = {
					message: err.err,
					name: 'DuplicateError',
					path: det.field,
					type: 'unique',
					code: err.code
				};

				delete err.err;
				delete err.code;
				break;

			default:
				err.name = 'UnexpectedError';
		}

	} else if (err.name && errorTypes.indexOf(err.name) === -1) {
		err.name = 'UnexpectedError';
	}
};