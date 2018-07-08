'use strict';

module.exports = function(io, namespaces) {

    const nsps = {};

    nsps['/'] = io.of('/');

    if (Array.isArray(namespaces)) {
        for (let namespace of namespaces) {
            nsps[namespace] = io.of(namespace);
        }
    }

    return nsps;

};
