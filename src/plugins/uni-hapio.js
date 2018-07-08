'use strict';

const Hoek       = require('hoek');
const socketIo   = require('socket.io');
const routes     = require('./../tools/routes');
const namespaces = require('./../tools/namespaces');

// internals
const internals = {
    defaults: {
        socketio: {
            path: '/socket.io'
        }
    }
};

exports.plugin = {
    register: (server, options) => {
        options = Hoek.applyToDefaults(internals.defaults, options);

        const io   = socketIo(server.listener, options.socketio);
        const s    = server;
        const nsps = namespaces(io, options.namespaces);

        s.expose('io', io);

        s.ext('onRequest', function(request, h) {
            if (! request.plugins['uni-hapio']) {
                request.plugins['uni-hapio'] = {};
            }

            request.plugins['uni-hapio'].io = request.server.plugins['uni-hapio'].io;
            return h.continue;
        });

        for (let namespace of Object.keys(nsps)) {
            nsps[namespace].on('connection', function(socket) {
                routes(s, socket, namespace);
            });
        }
    },
    pkg:      {
        'name':    'uni-hapio',
        'version': '1.0.0',
        'author':  'Vitalii Kiiko <mr.psiho@gmail.com>'
    }
};
