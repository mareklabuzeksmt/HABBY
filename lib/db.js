'use strict';

const config = require('dotenv').config();
const redis  = require("redis");

const service = {
  client: null,
  connect: () => {
    service.client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    });
    
    service.client.on("error", function (err) {
        console.log("RedisError:" + err, null, 2);
    });
  },
  saveAccessToken: (token) => {
    service.client.set('access-token', token);  
  }
};

module.exports = service;