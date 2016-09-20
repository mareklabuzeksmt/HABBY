'use strict';

const db  = require("./db");
const slack  = require("slack");

const service = {
  access: (code, cb) => {
    // TODO: read client data from config
    let options = {
      client_id: '',  
      client_secret: '',
      code: code
    }

    slack.oauth.access(options, cb);
  },
  test: () => {
    slack.api.test({hello:'world'}, console.log)
  }
};

module.exports = service;
