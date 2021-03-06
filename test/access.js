'use strict';
// tests for access
// Generated by serverless-mocha-plugin

const mod         = require('../handler.js');
const mochaPlugin = require('serverless-mocha-plugin');
const wrapper     = mochaPlugin.lambdaWrapper;
const expect      = mochaPlugin.chai.expect;

const redis  = require("redis");
const slack  = require("slack");
const db = require('../lib/db');
const sinon = require('sinon');

const liveFunction = {
  region: process.env.SERVERLESS_REGION,
  lambdaFunction: process.env.SERVERLESS_PROJECT + '-access'
}

describe('access', () => {
  before(function (done) {
//  wrapper.init(liveFunction); // Run the deployed lambda 
    wrapper.init(mod, {
      handler: 'access'
    });

    done()
  })
  
  it('should save token', (done) => {
    let redisSpy = sinon.spy();
    let slackSpy = sinon.stub(slack.oauth, 'access')

    db.client = {set: redisSpy};
    slackSpy.callsArgWith(1, null, 'testToken123');

    wrapper.run({body: {code: 'code1223'}}, (err, response) => {
      expect(response).to.include.keys('ok');
      expect(redisSpy.getCall(0).args[0]).to.equal('access-token');
      expect(redisSpy.getCall(0).args[1]).to.equal('testToken123');
      done();
    });
  });
});