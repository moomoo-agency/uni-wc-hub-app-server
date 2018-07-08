'use strict';

// libs
const axios = require('axios');
const https = require('https');
const { Map } = require('immutable');
const moment = require('moment');
const logger = require('./tools/winston');

// tools
import { pipeAsync } from './tools/helpers';

const getSite = site => async (server) => {
    try {
        const db = server.app.db;
        return await db.sites.find({ _id: site });
    } catch (err) {
        logger.error(`"getSite":: ${err}`);
    }
};

const updateTokens = server => async (sites) => {
    try {
        let sitesList = [];

        const updatedSites = sites.map(async (site) => {
            return await updateToken({ server, site });
        });

        for (let site of updatedSites) {
            sitesList.push(await site);
        }

        return sitesList;
    } catch (err) {
        logger.error(`"updateTokens":: ${err}`);
    }
};

const updateToken = async ({ server, site }) => {
    try {
        const method = 'POST';
        const db = server.app.db;
        const timeNow = moment();
        const expDate = moment(site.exp);

        if (!site.token || expDate <= timeNow) {
            const { _id, url, username, password } = site;
            const options = Object.assign({}, {
                method,
                url:  `${url}/wp-json/uni-app/v1/token`,
                data: {
                    username,
                    password
                }
            });
            const response = await apiCall(options);

            if (await response.status === 200) {
                const token = response.data;
                const newSite = Object.assign({}, {
                    _id,
                    url,
                    username,
                    password,
                    token,
                    exp: moment().add(3, 'days').toISOString()
                });

                saveSiteToDB({ db, doc: newSite })
                    .catch((err) => {
                        logger.error(`"updateTokens": Error during saving to DB ${_id}`, err);
                    });

                return newSite;
            } else {
                const msg = response.data.message;
                logger.error(`"updateTokens": Error in request, code ${response.status}: ${msg}`);
                return false;
            }
        } else {
            return site;
        }
    } catch (err) {
        logger.error(`"updateTokens":: ${err}`);
    }
};

const saveSiteToDB = async ({ db, doc }) => {
    try {
        return await db.sites.save(doc);
    } catch (err) {
        logger.error(`"saveSiteToDB":: ${err}`);
    }
};

const apiCall = async ({ url, method, headers = {}, params = {}, data = {} }) => {
    try {
        const options = Map({
            method,
            url,
            headers,
            params,
            data,
            timeout:         30000,
            withCredentials: true,
            httpsAgent:      new https.Agent({
                keepAlive:          true,
                rejectUnauthorized: false
            }),
            validateStatus:  function(status) {
                return status < 500;
            }
        });
        return await axios.request(options.toObject());
    } catch (err) {
        logger.error(`"apiCall":: ${err}`);
    }
};

const getSalesReport = (endpoint, params = {}) => async (sites) => {
    try {
        const method = 'GET';
        const { _id, url, token } = sites.shift();

        if (!token) {
            new Error(`"getSalesReport": No token for ${_id}`);
        }

        const options = Map({
            method,
            url:     `${url}${endpoint}`,
            params,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const response = await apiCall(options.toObject());

        if (typeof response.status === 'undefined') {
            new Error('Response status: undefined');
        }

        if (response.status === 200) {
            return response.data;
        } else {
            const msg = response.data.message;
            new Error(`Response error: ${msg}`);
        }

    } catch (err) {
        logger.error(`"getItemsAllSites":: ${err}`);
    }
};

const pullSalesReport = (server, data) => {
    const site = data.id;
    const { startDate, endDate } = data.range;
    const params = {
        date_min: startDate,
        date_max: endDate
    };

    return pipeAsync(
        getSite(site),
        updateTokens(server),
        getSalesReport(
            '/wp-json/uni-app/v1/reports/sales',
            params
        )
    )(server)
        .then(result => result)
        .catch(err => console.log(err));
};

module.exports = {
    pullSalesReport
};
