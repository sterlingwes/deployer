require('dotenv').config({silent: true})

const path = require('path')
const yargs = require('yargs')
const app = require('express')()
const parser = require('body-parser')

app.use(parser.json())

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('start', 'Start the server')
  .argv

console.log('args', argv)

const configPath = argv.f || 'deploy.config.js'
const cwd = argv.d && argv.d[0] === '/' ? argv.d : path.resolve(__dirname, argv.d || './')
const conf = require(`${cwd}/${configPath}`)

console.log('path', configPath)
console.log('cwd', cwd)

Object.keys(conf).forEach(name => {
  const config = conf[name]
  if (typeof config !== 'object') return

  let handler = config.handler
  if (!handler) {
    handler = require('./lib/handler')(name, config)
  }

  if (config.path[0] !== '/') config.path = `/${config.path}`

  console.log('+ setup', config.path)
  app.use(config.path, handler)
})

app.use((req, res, next) => {
  console.log('unhandled request', req.path)
  next()
})

const port = conf.port || 8888
app.listen(port)
console.log('listening on port', port)
