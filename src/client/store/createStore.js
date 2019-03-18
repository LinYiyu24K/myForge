import { applyMiddleware, compose, createStore } from 'redux'
import { browserHistory } from 'react-router'
import { updateLocation } from './location'
import makeRootReducer from './reducers'
import {client as config} from 'c0nfig'
import thunk from 'redux-thunk'//thunk是用来处理异步的

export default (initialState = {}) => {

  // ======================================================
  // Middleware Configuration
  // ======================================================
  const middleware = [thunk]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = []

  if (config.env === 'development') {

    const devToolsExtension = window.devToolsExtension
    //用一波扩展，例如在chrome里面的redux调试工具
    //window是一个全局的对象，window.devToolsExtension可以检查chrome里面有没有那个插件

    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension())
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),//它是用很多个reducer来组成一个rootReducer，然后再创建的
    initialState,
    compose(
      applyMiddleware(...middleware),
      ...enhancers
    )//create的时候，把要用的插件也用compose带上
  )

  store.asyncReducers = {}

  // To unsubscribe, invoke `store.unsubscribeHistory()` anytime
  store.unsubscribeHistory = browserHistory.listen(
    updateLocation(store))

  if (module.hot) {
    module.hot.accept('./reducers', () => {//accept: 接收给定模块的更新，并出发一个回调函数 来对这些更新做出反应
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  return store
}
