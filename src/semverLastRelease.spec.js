'use strict'

const expect = require('chai').expect
const nock = require('nock')
const sinon = require('sinon')
const getLastRelease = require('./semverLastRelease')
const config = require('./config')

describe('#getLastRelease', () => {
  let sandbox

  before(() => {
    nock.disableNetConnect()
  })

  after(() => {
    nock.enableNetConnect()
  })

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should get latest release', (done) => {
    sandbox.stub(config, 'token', 'my-gh-oauth-token')
    sandbox.stub(config, 'repoUrl', 'https://github.com/foo/bar')

    const ghAPI = nock('https://api.github.com')
      .get('/repos/foo/bar/releases?page=1&per_page=1&access_token=my-gh-oauth-token')
      .reply(200, [
        {
          tag_name: 'v1.1.0',
          target_commitish: 'commit-hash'
        }
      ])

    getLastRelease({}, {}, (err, release) => {
      if (err) {
        return done(err)
      }

      expect(release).to.be.eql({
        version: '1.1.0',
        gitHead: 'commit-hash'
      })

      expect(ghAPI.isDone()).to.be.true

      done()
    })
  })

  it('should handle if initial release is missing', (done) => {
    sandbox.stub(config, 'token', 'my-gh-oauth-token')
    sandbox.stub(config, 'repoUrl', 'https://github.com/foo/bar')

    nock('https://api.github.com')
      .get('/repos/foo/bar/releases?page=1&per_page=1&access_token=my-gh-oauth-token')
      .reply(200, [])

    getLastRelease({}, {}, (err, release) => {
      if (err) {
        expect(err.message).to.be.equal('There is no release on GH yet. First make an initial release there.')
        return done()
      }

      done(new Error('Unhandled exception'))
    })
  })

  it('should handle when GH_REPOSITORY_URL is missing', (done) => {
    sandbox.stub(config, 'token', 'my-gh-oauth-token')
    sandbox.stub(config, 'repoUrl', undefined)

    getLastRelease({}, {}, (err, release) => {
      if (err) {
        expect(err.message).to.be.equal('GH_REPOSITORY_URL or CIRCLE_REPOSITORY_URL is requried')
        return done()
      }

      done(new Error('Unhandled exception'))
    })
  })

  it('should handle when GH_TOKEN is missing', (done) => {
    sandbox.stub(config, 'token', undefined)
    sandbox.stub(config, 'repoUrl', 'https://github.com/foo/bar')

    getLastRelease({}, {}, (err, release) => {
      if (err) {
        expect(err.message).to.be.equal('GH_TOKEN is requried')
        return done()
      }

      done(new Error('Unhandled exception'))
    })
  })
})
