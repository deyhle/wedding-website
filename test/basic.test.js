const chai = require('chai');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const htmlValidator = require('html-validator');

const expect = chai.expect;

function validateResponse(html) {
  const allowedErrors = [
    // hahaha no errors allowed in this project :D
  ];
  return htmlValidator({ data: html })
  .then(response => JSON.parse(response))
  .then(response => response.messages)
  .then(errors => errors.filter(error =>
    error.type === 'error' &&
    !allowedErrors
    .map(allowedError => allowedError.test(error.message))
    .some(x => x)
  ))
  .then((errors) => {
    return errors.map(e => `${e.message}: ${e.extract.replace(/\n/g, '')}`).join('\n');
  });
}

describe('Mocha', () => {
  describe('basic check of testing library', () => {
    it('assert that JavaScript is still a little crazy', () => {
      expect([] + []).to.eql('');
    });
  });
});

describe('config', () => {
  it('instance is correct', (done) => {
    const mock = require('../router');
    const { express } = require('visual-cms.website')('hochzeit.dynamic-website', __dirname);
    expect(mock).to.eql(express);
    done();
  });
});

describe('files are minified', () => {
  const files = fs.readdirSync('./static')
  .filter(filename => /\.js$/.test(filename) || /\.css$/.test(filename));

  for (let i in files) {
    const file = files[i];
    it(`${file} is minified`, (done) => {
      const filepath = path.resolve('./static', file);
      fs.readFile(filepath, 'utf8', (error, result) => {
        const lines = result
        .split('\n')
        .map(line => line.length);
        // Test 1: If the file is very small (less than 4 lines), we assume it is minified.
        if (lines.length <= 3) {
          return done();
        }
        const emptyLines = lines.filter(length => length < 1);
        // Test 2: we should not have more than 10 empty lines in the file
        expect(emptyLines.length, `file ${file} is not minified`).to.be.lt(10);
        // Test 3: the average line length should be above 100
        const averageLineLength = lines.reduce((a, b) => a + b, 0) / lines.length;
        expect(averageLineLength, `file ${file} is not minified`).to.be.gt(100);
        done();
      });
    });
  }
});
describe('route tests', () => {
  let mock;
  before(() => {
    mock = require('../router');
  });
  const routes = [
    '/',
  ];
  for (let i in routes) {
    const route = routes[i];
    describe(`get ${route}`, () => {
      let response;
      before(function load() {
        this.timeout(5000);

        return request(mock)
        .get(route)
        .then((res) => {
          response = res;
          return Promise.resolve();
        });
      });
      it(`status 200 ${route}`, () => {
        expect(response.status).to.eql(200);
      });
      it(`html response ${route}`, () => {
        expect(response.ok).to.be.true;
        expect(response.type).to.eql('text/html');
      });
      it(`valid html ${route}`, () => {
        return validateResponse(response.text)
        .then((errors) => {
          expect(errors).to.eql('');
        });
      });
    });
  }
});
