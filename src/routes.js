'use strict';

const Boom = require('boom');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const moment = require('moment');
const logger = require('./tools/winston');

// tools
const clientsCfg = require('./clients');
import { pullSalesReport } from './api';

module.exports = [
    {
        method:  'GET',
        path:    '/',
        config:  { auth: false },
        handler: function(request, h) {
            return 'Hello. WC Orders App is up and running!';
        }
    },
    {
        method:  'GET',
        path:    '/api',
        config:  { auth: false },
        handler: function(request, h) {
            throw Boom.methodNotAllowed('That method is not allowed');
        }
    },
    {
        method:  'POST',
        path:    '/api/auth',
        options: {
            auth:        false,
            description: 'Authenticate',
            notes:       'Returns JWT token on email/pass successful validation',
            tags:        ['orders'],
            validate:    {
                payload: {
                    email: Joi.string().email().required(),
                    pass:  Joi.string().alphanum().min(3).max(30).required()
                }
            }
        },
        handler: function(request, h) {
            const { email, pass } = request.payload;
            const isClient = clientsCfg.filter((client) => {
                return email === client._id && pass === client.pass;
            });

            if (!isClient.length) {
                throw Boom.unauthorized('Invalid credentials');
            }

            const { name } = isClient[0];
            const iat = new Date().getTime();
            const session = {
                email,
                iat,
                exp: iat + 12 * 60 * 60 * 1000 // 12 hours
            };
            const token = JWT.sign(session, request.server.app.jwt_secret);
            const client = { name, email, token };

            logger.info(`User ${name} logged in (${moment().toISOString()})`);

            return h.response(client).code(200);

        }
    },
    {
        method:  'POST',
        path:    '/api/request-sales',
        config:  {
            auth:        'jwt',
            plugins:     {
                'uni-hapio': {
                    event:   'request-sales',
                    mapping: {
                        headers: ['Authorization'],
                        payload: ['data']
                    }
                }
            },
            description: 'Request for a sales report',
            notes:       'Returns a sales report for a given period',
            tags:        ['sales'],
        },
        handler: function(request, h) {
            const socket = request.plugins['uni-hapio'].socket;

            if (!socket) {
                throw Boom.notAcceptable('Use web sockets to get the resource');
            }

            const { data } = request.payload;

            return pullSalesReport(request.server, data)
                .then((report) => {
                    socket.emit('sales', report);
                    return '';
                })
                .catch((err) => console.log(err));
        }
    }
];
