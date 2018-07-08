// async pipe
export const pipeAsync = (...functions) => input => functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

//
export const findSite = async ({ db, site }) => await db.sites.findOne({ _id: site._id });
