const exec = require('child_process').exec
const slack = require('./slack')

module.exports = function (name, config) {
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
        slack(config.slack.message || `${name} Deployed successfully`)
      }
    })
  }
}
