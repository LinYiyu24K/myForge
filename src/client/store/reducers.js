import { reducer as notificationsReducer } from 'reapop'
import { combineReducers } from 'redux'

//default reducers
import locationReducer from './location'
import appReducer from './app'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    notifications: notificationsReducer(),//这个应该是用来添加通知的
    location: locationReducer,//这个是保存用户当前的位置的，然后根据这个来设定语言是中文还是英文
    app: appReducer,//这应该是最重要的一个reducer，保存了很多相关的信息，不过 并不是核心功能
    //实际上它只能改变 用户的信息，也就是处理用户的登陆状态而已(可以参考 app.js里面dispatch的位置)
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  //增加reducer 好像只能增加 异步的，同步的是固定的(notifications location app)
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
