import { injectReducer } from '../../store/reducers'

export default (store) => ({

  //path : '/', //index route has no path

  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
     and embed an async module loader (jsonp) when bundling   */


    //require.ensure(dependencies, callback, chunkName)
    //这里用到的一个叫按需加载的技术，他会把大的js文件拆成小的js文件(chunkFile)，哪里需要取哪里
    //chunkFile的名字格式在production.webpack.config.js里面有说
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
       dependencies for bundling   */
      const container = require('./containers/HomeContainer').default

      const reducer = require('./modules/home').default

      /*  Add the reducer to the store on key 'home' */
      injectReducer(store, { key: 'home', reducer })

      /*  Return getComponent   */
      cb(null, container)

      /* Webpack named bundle   */
    }, 'home')
  }
})


