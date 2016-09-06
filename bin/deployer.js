#!/usr/bin/env node

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
