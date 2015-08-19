var config = {};

config.mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pics';

module.exports = config;