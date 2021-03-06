'use strict';
// tests for authorize
// Generated by serverless-mocha-plugin

const mod         = require('../handler.js');
const mochaPlugin = require('serverless-mocha-plugin');
const wrapper     = mochaPlugin.lambdaWrapper;
const expect      = mochaPlugin.chai.expect;

const liveFunction = {
  region: process.env.SERVERLESS_REGION,
  lambdaFunction: process.env.SERVERLESS_PROJECT + '-authorize'
}

describe('authorize', () => {
  before(function (done) {
//  wrapper.init(liveFunction); // Run the deployed lambda 
    wrapper.init(mod, {
      handler: 'authorize'
    });

    done()
  })
  
  it('returns location field', (done) => {
    wrapper.run({}, (err, response) => {
      expect(response).to.include.keys('location');
      expect(response.location).to.be.a('string');
      expect(response.location.length).to.be.above(50);
      done();
    });
  });

  it('redirect to slack oauth endpoint', (done) => {
    wrapper.run({}, (err, response) => {
      expect(response.location).to.contain('https://slack.com/oauth/authorize?');
      done();
    });
  });

  it('returns client id', (done) => {
    wrapper.run({}, (err, response) => {
      expect(response.location).to.contain('client_id=36296541748.77041816724');
      done();
    });
  });

  it('returns redrirect uri', (done) => {
    wrapper.run({}, (err, response) => {
      expect(response.location).to.contain('redirect_uri=https://bbuzqv0311.execute-api.us-east-1.amazonaws.com/dev/access');
      done();
    });
  });

  it('returns permission string', (done) => {
    wrapper.run({}, (err, response) => {
      expect(response.location).to.contain('scope=channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write');
      done();
    });
  });

});