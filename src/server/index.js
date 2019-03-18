// async support
import 'babel-polyfill'

//Server stuff
import RateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import gzip from 'express-static-gzip'
import session from 'express-session'
import bodyParser from 'body-parser'
import store from 'connect-mongo'
import express from 'express'
import helmet from 'helmet'
import debug from 'debug'
import util from 'util'
import path from 'path'

//Endpoints 这里应该是每个拓展+其他一些对象的后台接口api，像dm应该是DataManagement拓展的后台接口
import DerivativesAPI3Legged from './api/endpoints/derivatives3Legged'
import DerivativesAPI2Legged from './api/endpoints/derivatives2Legged'
import ARVRToolkitAPI from './api/endpoints/ar-vr-toolkit'
import MaterialAPI from './api/endpoints/materials'
import ExtractAPI from './api/endpoints/extract'
import SocketAPI from './api/endpoints/socket'
import ConfigAPI from './api/endpoints/config'
import NewDMAPI from './api/endpoints/newdm'
import ModelAPI from './api/endpoints/models'
import ForgeAPI from './api/endpoints/forge'
import HooksAPI from './api/endpoints/hooks'
import MetaAPI from './api/endpoints/meta'
import UserAPI from './api/endpoints/user'
import DMAPI from './api/endpoints/dm'

//Services
import ARVRToolkitSvc from './api/services/AR-VR-ToolkitSvc'
import DerivativesSvc from './api/services/DerivativesSvc'
import ServiceManager from './api/services/SvcManager'
import ExtractorSvc from './api/services/ExtractorSvc'
import LMVProxySvc from './api/services/LMVProxySvc'
import MongoDbSvc from './api/services/MongoDbSvc'
import SocketSvc from './api/services/SocketSvc'
import UploadSvc from './api/services/UploadSvc'
import ForgeSvc from './api/services/ForgeSvc'
import ModelSvc from './api/services/ModelSvc'
import UserSvc from './api/services/UserSvc'
import OssSvc from './api/services/OssSvc'
import DMSvc from './api/services/DMSvc'

//Config (NODE_ENV dependant) 其实就是\forge\config\development.config.js
import config from'c0nfig'

/////////////////////////////////////////////////////////////////////
// App initialization
//
/////////////////////////////////////////////////////////////////////
const app = express()

if(process.env.NODE_ENV === 'development') {

  //修改：在development增加bodyParser中间件
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.use(session({
    secret: 'forge-rcdb',
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 // 24h session
    },
    resave: false,
    saveUninitialized: true
  }))

  const allowCrossDomain = (req, res, next) => {

    res.header('Access-Control-Allow-Methods',
      'GET,PUT,POST,DELETE')

    res.header('Access-Control-Allow-Headers',
      'Content-Type')

    res.header('Access-Control-Allow-Origin',
      '*')

    next()
  }


  // // 允许跨域访问
  // app.all('*', function(req, res, next) {  
  //   res.header("Access-Control-Allow-Origin", "*");  
  //   res.header("Access-Control-Allow-Headers", "X-Requested-With");  
  //   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
  //   res.header("X-Powered-By",' 3.2.1')  
  //   res.header("Content-Type", "application/json;charset=utf-8");  
  //   next();  
  // });


  app.use(allowCrossDomain)
  //注释：设置 HTTP 头(提高安全性)
  app.use(helmet({
    frameguard: false
  }))

} else {

  const dbConfig = config.database

  const MongoStore = store(session)

  app.use(session({
    secret: 'forge-rcdb',
    cookie: {
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 // 24h session
    },
    resave: false,
    saveUninitialized: true,

    store: new MongoStore({//设置存储为mongoDB
      url: util.format('mongodb://%s:%s@%s:%d/%s',
        dbConfig.user,
        dbConfig.pass,
        dbConfig.dbhost,
        dbConfig.port,
        dbConfig.dbName),
      autoRemove: 'native',  // Default
      autoRemoveInterval: 10 // In minutes. Default
    })
  }))
  //注释：设置 HTTP 头(提高安全性)
  app.use(helmet())

  const limiter = new RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    delayMs: 0, // disabled
    max: 1000
  })

  app.use('/api/', limiter)
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('trust proxy', 1)
app.use(cookieParser())

///////////////////////////////////////////////////////////
// Services setup
// config.forge.oauth.baseUri = 'https://developer.api.autodesk.com' => 'developer.api.autodesk.com'
///////////////////////////////////////////////////////////
const derivativesSvc = new DerivativesSvc()

const lmvProxySvc = new LMVProxySvc({
  endpoint: config.forge.oauth.baseUri.replace(
    'https://', '')
})

const forgeSvc = new ForgeSvc(
  config.forge)

const uploadSvc = new UploadSvc({
  tempStorage: path.join(__dirname, '/../../TMP')
})

const arvrToolkitSvc = new ARVRToolkitSvc()
const extractorSvc = new ExtractorSvc()

const ossSvc = new OssSvc()
const dmSvc = new DMSvc()

//在ServiceManager这里注册用到的所有服务，即SVC，实际上是将所有的服务实例存放到一个对象内
ServiceManager.registerService(arvrToolkitSvc)
ServiceManager.registerService(derivativesSvc)
ServiceManager.registerService(extractorSvc)
ServiceManager.registerService(uploadSvc)
ServiceManager.registerService(forgeSvc)
ServiceManager.registerService(ossSvc)
ServiceManager.registerService(dmSvc)

/////////////////////////////////////////////////////////////////////
// API Routes setup
// 这一块都是不同拓展的后台接口路由
/////////////////////////////////////////////////////////////////////
app.use('/api/derivatives/3legged', DerivativesAPI3Legged())
app.use('/api/derivatives/2legged', DerivativesAPI2Legged())
app.use('/api/ar-vr-toolkit', ARVRToolkitAPI())
app.use('/api/materials', MaterialAPI())
app.use('/api/extract',   ExtractAPI())
app.use('/api/socket',    SocketAPI())
app.use('/api/config',    ConfigAPI())
app.use('/api/newdm',     NewDMAPI())
app.use('/api/models',    ModelAPI())
app.use('/api/forge',     ForgeAPI())
app.use('/api/hooks',     HooksAPI())
app.use('/api/meta',      MetaAPI())
app.use('/api/user',      UserAPI())
app.use('/api/dm',        DMAPI())

/////////////////////////////////////////////////////////////////////
// Viewer GET Proxy
// 二腿验证、三腿验证
/////////////////////////////////////////////////////////////////////
const proxy2legged = lmvProxySvc.generateProxy(
  'lmv-proxy-2legged',
  () => forgeSvc.get2LeggedToken())

app.get('/lmv-proxy-2legged/*', proxy2legged)

const proxy3legged = lmvProxySvc.generateProxy(
  'lmv-proxy-3legged',
  (session) => forgeSvc.get3LeggedTokenMaster(session))

app.get('/lmv-proxy-3legged/*', proxy3legged)

/////////////////////////////////////////////////////////////////////
// This rewrites all routes requests to the root /index.html file
// (ignoring file requests). If you want to implement universal
// rendering, you'll want to remove this middleware
//
/////////////////////////////////////////////////////////////////////
app.use(require('connect-history-api-fallback')())

/////////////////////////////////////////////////////////////////////
// Static routes
//
/////////////////////////////////////////////////////////////////////
//process.env.HOT_RELOADING = false
//console.log('value of Hotreloading');
//console.log(process.env.HOT_RELOADING);
if (process.env.HOT_RELOADING) {

  // dynamically require webpack dependencies
  // to keep them in devDependencies (package.json)
  const webpackConfig = require('../../webpack/development.webpack.config')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')
  const webpack = require('webpack')
  const compiler = webpack(webpackConfig)//应该是在这里编译的时候 配置路由。转到/webpack/development.webpack.config  会看到里面会用到client.js的东西

  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: webpackConfig.stats,
    progress: true,
    hot: true
  }))

  app.use(webpackHotMiddleware(compiler))

  app.use('/resources', express.static(__dirname + '/../../resources'))

  app.get('*', express.static(path.resolve(process.cwd(), './dist')))

} else {

  if (process.env.SERVE_STATIC) {

    app.use('/resources', express.static(__dirname + '/../../resources'))
  }

  app.use(gzip(path.resolve(process.cwd(), './dist'), {
    enableBrotli: true
  }))

  app.get('*', gzip(path.resolve(process.cwd(), './dist'), {
    enableBrotli: true
  }))
}

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
const runServer = (app) => {

  try {

    process.on('exit', () => {//退出的时候，什么都不做

    })

    process.on('uncaughtException', (err) => {//出现uncaughtException时，打印错误

      console.log('uncaughtException')
      console.log(err)
      console.error(err.stack)
    })

    process.on('unhandledRejection', (reason, p) => {

      console.log('Unhandled Rejection at: Promise ', p,
        ' reason: ', reason)
    })

    const dbConfig = config.database //设置存储数据库

    const dbSvc = new MongoDbSvc(dbConfig)//mongoDB的数据库

    dbSvc.connect().then(() => {//连接mongoDB的数据库

      console.log(
        'Connected to MongoDB Database: ' +
        dbConfig.dbName)//dnName = forge-rcdb

      ServiceManager.registerService(dbSvc)

      for (const key in dbConfig.models) {

        const modelCfg = Object.assign({},
          dbConfig.models[key], {
            dbName: dbConfig.dbName,
            name: key
          })

        const modelSvc = new ModelSvc (modelCfg)

        ServiceManager.registerService(modelSvc)
      }

      const userCfg = Object.assign({},
        dbConfig.users, {
          uploadLimit: config.gallery.uploadLimit,
          whiteList: config.gallery.whiteList,
          dbName: dbConfig.dbName
        })

      const userSvc = new UserSvc (userCfg)

      ServiceManager.registerService(userSvc)
    })

    const server = app.listen(//服务器开始监听
      process.env.PORT || 3000, () => {

        const socketSvc = new SocketSvc({
          session,
          server
        })

        ServiceManager.registerService(socketSvc)

        const port = server.address().port

        console.log('Server listening on PORT(服务正在监听的端口): ' + port)
        console.log('ENV（现在的环境）: ' + process.env.NODE_ENV)
      })

  } catch (ex) {

    console.log('Failed to run server... ')
    console.log(ex)
  }
}

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
runServer(app)
