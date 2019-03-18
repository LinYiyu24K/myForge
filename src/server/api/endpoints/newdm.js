import ServiceManager from '../services/SvcManager'
import compression from 'compression'
import express from 'express'
import path from 'path'
import Debug from 'debug'

module.exports = function() {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  
  const router = express.Router()

  //修改：引入multer库，用于读取文件
  var fs = require('fs'); 
  var multer = require('multer');
  const uploadSvc = ServiceManager.getService(
    'UploadSvc') 

  // //注释：any接受一切上传的文件。文件数组将保存在 req.files。
  // var upload = multer({dest:'/resources/img/newDM/'}).any()

  const shouldCompress = (req, res) => {
    return true
  }
  //compression是express的中间件，用于压缩数据，提高性能。
  //思想例子：如果浏览器支持gzip压缩，则可以讲响应数据使用gzip压缩后再传输
  router.use(compression({
    filter: shouldCompress
  }))

  /////////////////////////////////////////////////////////
  // return sequences
  //注释：获得所有得视点组 sequences , 是一个数组
  /////////////////////////////////////////////////////////
  router.get('/:db/:modelId/usersData',
    async(req, res) => {

    try {

      const db = req.params.db
      console.log(`>>>>>>>>>>>db的值是！！??！：${db}`)
      const modelSvc = ServiceManager.getService(
        db + '-ModelSvc')

      const response =
        await modelSvc.getUserData(
          req.params.modelId)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // add sequence
  //
  /////////////////////////////////////////////////////////
  router.post('/:db/:modelId/sequences',
    async(req, res) => {

    try {

      const db = req.params.db

      const sequence = req.body.sequence
      const modelSvc = ServiceManager.getService(
        db + '-ModelSvc')

      const response =
        await modelSvc.addConfigSequence (
          req.params.modelId,
          sequence)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // update sequence
  //
  /////////////////////////////////////////////////////////
  router.put('/:db/:modelId/sequences',
    async(req, res) => {

    try {

      const db = req.params.db

      const sequence = req.body.sequence

      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const response =
        await modelSvc.updateConfigSequence (
        req.params.modelId,
        sequence)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // delete sequence
  //
  /////////////////////////////////////////////////////////
  router.delete('/:db/:modelId/sequences/:sequenceId',
    async(req, res) => {

    try {

      const db = req.params.db

      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const response =
        await modelSvc.deleteConfigSequence (
          req.params.modelId,
          req.params.sequenceId)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // get states from specific sequence
  //
  /////////////////////////////////////////////////////////
  router.get('/:db/:modelId/sequences/:sequenceId/states',
    async(req, res) => {

    try {

      const db = req.params.db

      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const response =
        await modelSvc.getConfigSequenceStates (
          req.params.modelId,
          req.params.sequenceId)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // 修改：新增接口，获取指定视点组的视点资料
  //
  /////////////////////////////////////////////////////////
  router.get('/:db/:modelId/usersData/:sequenceId/states',
    async(req, res) => {

    try {

      const db = req.params.db

      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const response =
        await modelSvc.getUserDataStates (
          req.params.modelId,
          req.params.sequenceId)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // add state to specific sequence.
  // body.state can be a single state or an array of states
  //
  /////////////////////////////////////////////////////////
  router.post('/:db/:modelId/sequences/:sequenceId/states',
    async(req, res)=> {

    try {

      const db = req.params.db
      console.log(`>>>>>>>>>>这是包含文件的添加视点的state: ${JSON.stringify(req.body.state)}`)
      //修改：将req.body.state 改为 req.body.state.viewerState
      const state = req.body.state

      console.log(`>>>>>>>>>>这是不包含文件添加视点的state: ${JSON.stringify(state)}`)
      console.log("____________________",state)
      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const response =
        await modelSvc.addDataSequenceFile (
          req.params.modelId,
          req.params.sequenceId,
          state)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })


  /////////////////////////////////////////////////////////
  // add state to specific sequence.
  // body.state can be a single state or an array of states
  //修改：新增。接收前端资料视点的文件上传
  /////////////////////////////////////////////////////////
  router.post('/:db/:modelId/sequences/:sequenceId/file',
    uploadSvc.dataUploader.single('myUpload'),
    async(req, res) => {
      console.log("------------------------------------------上传文件日志start------------------------------------------")
    try {
      
      const db = req.params.db
      
      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      console.log('进到了file接口>>>>>>>>>>这是req.file:',req.file)
      console.log(`进到了file接口>>>>>>>>>>这是req.params.sequenceId: ${JSON.stringify(req.params.sequenceId)}`)
      console.log("________________________________")
      console.log("state的类型是： ",Object.prototype.toString.call(req.body.state))
      console.log("state的类型是isArray： ",Array.isArray(req.body.state))
      

      const file = req.file ? req.file : null ;
      const filename = file.filename ;
      const destination = file.destination ;
      const path = file.path ;

      //注释：合并视点信息 req.body.state 和文件路径 path 到一个 Object 中
      var state = Object.assign(
        {},
        JSON.parse(req.body.state),
        {
          "filePath":path,
        "filename":filename
        }
        )

      console.log("++++++++",state)
      console.log('进到了file接口>>>>>>>>>>这是req.body.state.id:',state.id)
      const response =
        await modelSvc.addDataSequenceFile (
          req.params.modelId,
          req.params.sequenceId,
          state)

      res.json(response)

      console.log("----------------------------------------上传文件日志end-------------------------------------------")
    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
})

  /////////////////////////////////////////////////////////
  // delete sequence state
  //修改：将 /sequences/:sequenceId.../  改为 /usersData/:sequenceId.../
  /////////////////////////////////////////////////////////
  router.delete(
    '/:db/:modelId/usersData/:sequenceId/states/:stateId',
    async(req, res) => {

    try {

      const db = req.params.db

      const modelSvc = ServiceManager.getService(
        db + '-ModelSvc')

      const response =
        await modelSvc.deleteUserDataState(
        req.params.modelId,
        req.params.sequenceId,
        req.params.stateId)

      res.json(response)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  //////////////////////////////////////////////////////////////
  // 修改：获取视点关联的图片
  ///////////////////////////////////////////////////////////////
  router.get(
    '/:db/:modelId/usersData/:sequenceId/states/:stateId',
    async(req, res) => {
      console.log('这里进入到了getData的后台：-----------------------------------------------')

    try {

      const db = req.params.db

      const modelSvc = ServiceManager.getService (
        db + '-ModelSvc')

      const states =
        await modelSvc.getUserDataStates (
          req.params.modelId,
          req.params.sequenceId)

      console.log("states----------------------------"+states);

      const state = states.filter(item => {
        if(item.id==req.params.stateId){
          return true
        }
        return false
      })

      console.log("state----------------------------"+JSON.stringify(state))

      var fileName = state[0].filename;
      console.log(fileName);
      console.log(path.resolve(__dirname+'../../../../../resources/img/newDM/'+fileName))

      res.sendFile(path.resolve(__dirname+'../../../../../resources/img/newDM/'+fileName));


      // res.json(response)

    } catch (error) {

      console.log(error)

      res.status(error.statusCode || 500)
      res.json(error)

    }
  })

  return router
}
