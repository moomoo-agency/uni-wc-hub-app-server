'use strict';

const Joi = require('joi');
const sitesCfg = require('../sites');
const { apiScheme } = require('../tools/joi-schemes');
const logger = require('../tools/winston');
const { findSite } = require('../tools/helpers');

exports.plugin = {
    register: (server) => {
        try {
            const db = server.app.db;
            const validate = Joi.validate(sitesCfg, apiScheme);

            logger.info(`addSites plugin`);

            if (validate.error !== null) {
                throw new Error(`Invalid input data for Api class:${validate.error}`);
            }

            for (let site of sitesCfg) {
                findSite({ db, site })
                    .then((doc) => {
                        if (!doc) {
                            db.sites.save(site);
                        }
                    })
                    .catch((err) => {
                        logger.error(`"findSite": Error`, err);
                    });
            }

        } catch (err) {
            logger.error(`"plugin: add-sites": Error ${err}`);
        }
    },
    pkg:      {
        'name':    'uni-app-add-sites',
        'version': '1.0.0',
        'author':  'Vitalii Kiiko <mr.psiho@gmail.com>'
    }
};
