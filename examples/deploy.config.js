
module.exports = {
  port: 8080,

  'myapp.com': {
    path: 'ci/deploy', // webhook path
    command: '~/Desktop/start TEST',
    slack: true
  }
}
