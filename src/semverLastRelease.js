'use strict'

const GitHubApi = require('github')
const SemanticReleaseError = require('@semantic-release/error')
const config = require('./config')
const github = new GitHubApi({
  version: '3.0.0'
})

/**
* @method getLastRelease
* @param {Object} pluginConfig
* @param {Object} config
* @param {Function} cb - (null, { version, gitHead })
*/
function getLastRelease (pluginConfig, semverConfig, cb) {
  if (typeof config.repoUrl !== 'string') {
    return cb(new TypeError('GH_REPOSITORY_URL or CIRCLE_REPOSITORY_URL is requried'))
  }

  if (typeof config.token !== 'string') {
    return cb(new TypeError('GH_TOKEN is requried'))
  }

  const repoChunks = config.repoUrl.split('/')
  const owner = repoChunks[repoChunks.length - 2]
  const repo = repoChunks[repoChunks.length - 1]

  github.authenticate({
    type: 'oauth',
    token: config.token
  })

  github.releases.listReleases({
    owner,
    repo,
    page: 1,
    per_page: 1
  }, (err, data) => {
    if (err) {
      return cb(err)
    }

    const release = data[0]

    if (!release) {
      return cb(new SemanticReleaseError('There is no release on GH yet. First make an initial release there.', 'ENODISTTAG'))
    }

    const version = release.tag_name.slice(1)
    const gitHead = release.target_commitish

    cb(null, { version, gitHead })
  })
}

module.exports = getLastRelease
