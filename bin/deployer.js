#!/usr/bin/env node

require('dotenv').config({silent: true})

const path = require('path')
const yargs = require('yargs')
const app = require('express')()
const parser = require('body-parser')

app.use(parser.json())

const cmd = yargs
  .usage('Usage: $0 <command> [options]')
  .command('start', 'Start the server')
  .command('setup-ubuntu', 'Provides the ubuntu startup script')
  .help()

const argv = cmd.argv

if (!argv._.length) cmd.showHelp() && exit()
if (argv._.indexOf('setup-ubuntu') !== -1) ubuntuScript() && exit()

// determine config location
//
const configPath = argv.f || 'deploy.config.js'
const cwd = argv.d && argv.d[0] === '/' ? argv.d : path.resolve(__dirname, argv.d || './')
const conf = require(`${cwd}/${configPath}`)

console.log('path', configPath)
console.log('cwd', cwd)

// for each app config, setup the routes
//
Object.keys(conf).forEach(name => {
  const config = conf[name]
  if (typeof config !== 'object') return

  let handler = config.handler
  if (!handler) {
    handler = defaultHandler(name, config)
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

//
// DEFAULT HANDLER
//

const exec = require('child_process').exec

function defaultHandler (name, config) {
  return (req, res, next) => {
    console.log('using default route handler for', config.path, 'none provided')
    if (!config.command) return console.warn('No command defined for', config.path)

    res.status(200).json({}) // don't make them wait, for now.

    console.log(config.path, 'exec', config.command)
    exec(config.command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      console.log(`stdout: ${stdout}`)
      console.log(`stderr: ${stderr}`)

      if (!stderr && config.slack) {
        slackNotify(config.slack.message || `${name} Deployed successfully`)
      }
    })
  }
}

//
// SLACK NOTIFICATIONS
//

const request = require('request')

function slackNotify (message) {
  request({
    uri: process.env.SLACK_URL,
    method: 'POST',
    json: true,
    body: {
      attachments: [
        {
          text: message,
          mrkdwn_in: ['text']
        }
      ]
    }
  }, function (err, response, body) {
    if (err) return console.error('Slack send error', err)
    console.log('Sent event to slack, response:', body)
  })
}

//
// UBUNTU UPSTART SCRIPT
//

function ubuntuScript () {
  const upstart =
`
#
# deployer upstart script
#
# to install, sudo this output to a file for your service name
#
# ie: sudo deployer setup-ubuntu > /etc/init/deployer.conf
#
# WARNING: this will run the deployer as a root user unless
# you define a user with the -u flag (TODO)
#

start on filesystem and started networking
respawn
exec deploy start
`
  return upstart
}

//
// ABORT CONVENIENCE
//

function exit (code) {
  process.exit(code || 0)
}
