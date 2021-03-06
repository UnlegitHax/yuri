const Discord = require('discord.js')
const colors = require('colors')
const fs = require('fs')
const Logger = require('./util/logger')
const { CrashCollector } = require('./util/crashCollector')
const { Settings } = require('./core/settings')
const Websocket = require('./core/websocket')

// Creating discord client instance
var client = new Discord.Client()

var DEBUG_MODE = (() => {
    var ind = process.argv.indexOf("--test")
    return (ind == 2 && process.argv[3])
})()

exports.DEBUG_MODE = DEBUG_MODE

function reloadConfig() {
    if (fs.existsSync('config.json')) {
        var config = require('../config.json')
        Logger.info('Config reloaded')
        return true
    }
    return false
}

// Load or generate config
const DEF_CONF = {
    token: "",
    prefix: ".",
    wstoken: "exampletokenactuallythisneedstobemorecomplexandthisisjustfortravis",
    files: ["mp3", "mp4", "wav", "ogg"],
    fileloc: "./sounds",
    owner: "",
    writestats: true,
    gamerota: ["zekro.de"]
}
if (DEBUG_MODE) {
    var config = DEF_CONF
    Logger.info("Setting default config for testing routine...")
}
else if (fs.existsSync('config.json')) {
    var config = require('../config.json')
    Logger.info('Config loaded')
}
else {
    fs.writeFileSync('config.json', JSON.stringify(DEF_CONF, 0, 2))
    Logger.error('Config file created. Please enter your information into this file and restart the bot after.')
    process.exit()
}

var settings = new Settings()

// Exporting client and config for other modules
Object.assign(module.exports, {
    client,
    config,
    reloadConfig,
    settings
})

// Registering events
require('./core/readyEvent')
require('./core/messageEvent')
require('./core/reactionEvent')
require('./core/voiceEvent')
require('./util/gameRotator')

Logger.debug('Debug mode enabled')

var ws = new Websocket()

// Logging into this shit
client.login(DEBUG_MODE ? process.argv[3] : config.token)
    .catch(err => Logger.error('Failed logging in:\n' + err))


// EXIT HANDLER
function exitHandler(exit, err) {
    Logger.debug('Shutting down...')

    const { soundStats } = require('./core/player')
    settings.save()

    if (config.writestats)
        fs.writeFileSync('SOUNDSTATS.json', JSON.stringify(soundStats, 0, 2))

    if (exit)
        process.exit()
}

new CrashCollector('./crash_logs')

process.on('exit', exitHandler)
process.on('SIGINT', exitHandler.bind(null, true))