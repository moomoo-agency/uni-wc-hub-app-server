const Joi = require('joi');

const apiScheme = Joi.array().min(1).unique('_id');

module.exports = {
    apiScheme
};
