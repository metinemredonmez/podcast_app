const path = require('path');
const dotenv = require('dotenv');
const { getDefaultConfig } = require('@expo/metro-config');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const config = getDefaultConfig(__dirname);

module.exports = config;
