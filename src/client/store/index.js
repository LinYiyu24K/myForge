import {client as config} from 'c0nfig'
//实际上c0nfig指向的内容都是从/config/development.config.js或者production.config.js中的
import createStore from './createStore'

//Services
import ServiceManager from 'SvcManager'
import ExtractorSvc from 'ExtractorSvc'
import StorageSvc from 'StorageSvc'
import NotifySvc from 'NotifySvc'
import DialogSvc from 'DialogSvc'
import SocketSvc from 'SocketSvc'
import ModelSvc from 'ModelSvc'
import EventSvc from 'EventSvc'
import ForgeSvc from 'ForgeSvc'
import UserSvc from 'UserSvc'

// ========================================================
// Services Initialization 这个文件更多的是配置service，store的创建只在最后那里
// ========================================================

const storageSvc = new StorageSvc({
  storageKey: 'Autodesk.Forge-RCDB.Storage',
  storageVersion: config.storageVersion
})

const socketSvc = new SocketSvc({
  host: config.host,
  port: config.port
})

const extractorSvc = new ExtractorSvc({
  apiUrl: '/api/extract'
})

const modelSvc = new ModelSvc({
  apiUrl: '/api/models'
})

const notifySvc = new NotifySvc()

const dialogSvc = new DialogSvc()

const eventSvc = new EventSvc()

const forgeSvc = new ForgeSvc({
  apiUrl: '/api/forge'
})

const userSvc = new UserSvc({
  apiUrl: '/api/user'
})

// ========================================================
// Services Registration
// ========================================================
ServiceManager.registerService(extractorSvc)
ServiceManager.registerService(storageSvc)
ServiceManager.registerService(socketSvc)
ServiceManager.registerService(dialogSvc)
ServiceManager.registerService(notifySvc)
ServiceManager.registerService(modelSvc)
ServiceManager.registerService(eventSvc)
ServiceManager.registerService(forgeSvc)
ServiceManager.registerService(userSvc)

// ========================================================
// Store Instantiation
// ========================================================
const initialState = window.___INITIAL_STATE__

const store = createStore(initialState)////////////////

export default store
