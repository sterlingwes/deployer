const yargs = require('yargs')
const app = require('express')()

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('start', 'Start the server')
  .argv

console.log('args', argv)

const sslConfigPath = argv.s || 'letsencrypt'
const sslConfig = Object.assign(require(`./${sslConfigPath}`), { app })

app.use('/', function (req, res) {
  res.end('Hello, World!')
})

require('letsencrypt-express')
  .create(sslConfig)
  .listen(80, 443)
