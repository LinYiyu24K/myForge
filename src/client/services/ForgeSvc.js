
import ClientAPI from 'ClientAPI'
import BaseSvc from './BaseSvc'

export default class ForgeSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (config) {

    super (config)

    this.api = new ClientAPI(config.apiUrl)

    this.api.ajax('/clientId').then(
      (res) => {

        this._clientId = res.clientId
      })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return 'ForgeSvc'
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  get clientId() {

    return this._clientId
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async login () {

    try {

      const user = await this.getUser()

      return user

    } catch (ex) {

      //注释：打印出错误
      console.log('forgeSvc.login()出错，api.ajax(user)，错误为：'+JSON.stringify(ex))

      //////////////////////////////////////////////////////////////////////////////
      // 注释：源码
      //
      // const url = await this.getLoginURL()
      // console.log(`然后打印ForgeSvc中的getLoginURL():
      // ${url}`);
      //
      // console.log(`接着，得到url后，window.location.assign(url),跳转页面 ${window.location}`)
      // window.location.assign(url)
      //
      // return null
      //
      ////////////////////////////////////////////////////////////////////////////////

      // 注释：自己替代源码的逻辑
      const url = window.location.href;
      
      const myUser ={
        username:'cangshu',
        password:'123'
      }
      const isSuccessLogin = await this.myLogin(myUser);

      console.log(`>>>>>>>>>>>>>>>>>>>>>isSuccessLogin: ${JSON.stringify(isSuccessLogin)}`)

      if(isSuccessLogin.success == true){
        alert("账号密码可还行啊")
        window.location.href = url;
      }else{
        alert('账号密码错误！')
      }

    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  logout () {

    const url = '/logout'

    return this.api.ajax({
      contentType: 'application/json',
      dataType: 'json',
      type: 'POST',
      url
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getUser () {

    return new Promise((resolve, reject) => {

      //验证，是否执行
      console.log(`>>>>>>>>>>>>>>>>>>>>发送了client/services/ForgeSvc中的getUser的/user请求`)
      this.api.ajax('/user').then((user) => {

        resolve(user)

      }, (error) => {

        //get user 失败，调用then中的reject部分。
        reject(error)
      })
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getLoginURL () {

    const url = '/login'

    const payload = {
      origin: window.location.href
    }

    return this.api.ajax({
      contentType: 'application/json',
      data: JSON.stringify(payload),
      dataType: 'json',
      type: 'POST',
      url
    })
  }

  myLogin(myUser){
    const url = "/myLogin"

    return this.api.ajax({
      contentType: 'application/json',
      data: JSON.stringify(myUser),
      dataType: 'json',
      type: 'POST',
      url
    })
  }
}
