
import { AppContainer as HMR } from 'react-hot-loader'
import AppContainer from './containers/AppContainer'
import {client as config} from 'c0nfig'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import 'font-awesome-webpack'
import store from './store'
import 'bootstrap-webpack'
import React from 'react'

//i18 imports
import LanguageProvider from './translations/LanguageProvider'
import { translationMessages } from './i18n'//应该是用来处理中英文的问题的

// ========================================================
// Render Setup
// ========================================================
const MOUNT_NODE = document.getElementById('root')//应该是绑在那个layouts/[].index.ejs的模板里面的

let render = (messages) => {

  const routes = require('./routes').default(store)

  ReactDOM.render(
    <HMR>
      <Provider store={store}>
        <LanguageProvider messages={messages}>
          <AppContainer
            env={config.env}
            routes={routes}
            store={store}
          />
        </LanguageProvider>
      </Provider>
    </HMR>,
    MOUNT_NODE
  )
}


//这下面的代码应该可以暂时不用管
// ========================================================
// This code is excluded from production bundle
// ========================================================
if (config.env === 'development') {

  if (window.devToolsExtension) {//如果有开发拓展工具，就打开它
    window.devToolsExtension.open()
  }

  if (module.hot) {

    // Development render functions
    const renderApp = render
    const renderError = (error) => {
      const RedBox = require('redbox-react').default
      ReactDOM.render(<RedBox error={error} />, MOUNT_NODE)
    }

    // Wrap render in try/catch
    render = () => {
      try {
        renderApp(translationMessages)
      } catch (error) {
        renderError(error)
      }
    }

    // Setup hot module replacement
    module.hot.accept('./routes', () =>
      setImmediate(() => {
        ReactDOM.unmountComponentAtNode(MOUNT_NODE)
        render()//接收给定依赖模块的更新(./routes)
        // 并触发一个 回调函数对这些更新做出回应
      })
    )
  }
}

// ========================================================
// Go!
// ========================================================
render(translationMessages)

