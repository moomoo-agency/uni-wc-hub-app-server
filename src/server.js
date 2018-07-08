'use strict';

// libs
require('babel-polyfill');
const Hapi        = require('hapi');
const routes      = require('./routes');
const mongojs     = require('mongojs');
const mongoist    = require('mongoist');
const HapiSwagger = require('hapi-swagger');
const Hapio       = require('./plugins/uni-hapio');

// tools
const clientsCfg = require('./clients');

// validate
export const clientValidate = async function (decoded) {
    const isClient = clientsCfg.filter((client) => decoded.email === client._id);

    return !isClient.length ? { isValid: false } : { isValid: true };
};

(async () => {
    try {
        // server
        const server = Hapi.server({
            port:   3030,
            host:   'localhost',
            routes: {
                cors: {
                    credentials: true
                }
            }
        });

        const swaggerOptions = {
            info: {
                title:   'WC Orders App API Documentation',
                version: '1.0.0',
            },
        };

        // DB
        const db      = mongojs('mongodb://localhost:27017/ordersapp');
        server.app.db = mongoist(db);

        // JWT secret
        server.app.jwt_secret = 'someSuperSecretPhrase';

        // plugins
        await server.register([
            {
                plugin:  Hapio,
                options: {
                    namespaces: [
                        '/'
                    ],
                    socketio: {
                        origins: '*:*'
                    }
                }
            },
            require('inert'),
            require('vision'),
            {
                plugin:  HapiSwagger,
                options: swaggerOptions
            },
            require('hapi-auth-jwt2'),
            require('./plugins/add-sites')
        ]);

        // jwt auth for client apps
        server.auth.strategy('jwt', 'jwt',
            {
                key:           server.app.jwt_secret,
                validate:      clientValidate,
                verifyOptions: {
                    algorithms: ['HS256']
                }
            });

        server.auth.default('jwt');

        // routes
        server.route(routes);

        await server.start();
        console.log(`Server running at: ${server.info.uri}`);

        server.events.on('log', (event, tags) => {
            if (tags.error) {
                console.log(`Server error: ${event.error ? event.error.message : 'unknown'}`);
            }
        });

    } catch (err) {
        console.error(err);
    }
})();
