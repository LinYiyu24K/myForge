/////////////////////////////////////////////////////////
// Viewing.Extension.StateManager.React
// by Philippe Leefsma, March 2017
//
/////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import ConfigAPI from './Viewing.Extension.Config.API'
import ContentEditable from 'react-contenteditable'
import './Viewing.Extension.NewDataManagement.scss'
import WidgetContainer from 'WidgetContainer'
import 'react-dragula/dist/dragula.min.css'
import ServiceManager from 'SvcManager'
import Toolkit from 'Viewer.Toolkit'
import Dragula from 'react-dragula'
import Image from 'Image'
import sortBy from 'lodash/sortBy'
import DOMPurify from 'dompurify'
import ReactDOM from 'react-dom'
import Switch from 'Switch'
import Label from 'Label'
import React from 'react'
import {
  Modal,
  DropdownButton,
  MenuItem
} from 'react-bootstrap'

class NewDataManagementExtension extends MultiModelExtensionBase {

  // Class constructor
  constructor (viewer, options) {

    super (viewer, options)
    //修改：增加this.state
    this.state = {
      show:false
    }

    this.renderTitle = this.renderTitle.bind(this)
    this.toggleItem = this.toggleItem.bind(this)
    this.addItem = this.addItem.bind(this)
    this.searchItem = this.searchItem.bind(this)

    //修改：新增弹窗 Modal 控制事件
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.dialogSvc =
      ServiceManager.getService(
        'DialogSvc')

    this.restoreFilter = options.restoreFilter || null

    this.playPeriod = this.options.playPeriod || 1800

    this.dialogSvc =
      ServiceManager.getService('DialogSvc')

    this.itemsClass = this.guid()

    this.react = options.react

    this.restoreStates = {}

    this.drake = null

    if (this.options.apiUrl) {

      const modelId = this.options.dbModel._id
    //修改：将config改为newdm
      this.api = new ConfigAPI(
        options.apiUrl +
        `/newdm/${options.database}/${modelId}`)
    }
  }

  //修改：新增弹窗控制事件
  handleClose() {
    console.log(`这里执行了handleClose`)
    this.react.setState({ show: false });
  }

  handleShow() {
    console.log(`这里执行了handleShow`)
    this.react.setState({ show: true });
  }

/////////////////////////////////////////////////////////
  //
  //修改：上传资料时候用户没有在模型中选中焦点
  /////////////////////////////////////////////////////////
  showMissPoint () {

    const onClose = (result) => {

      this.dialogSvc.off('dialog.close', onClose)

      if (result === 'OK') {

        return
      }

    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      onRequestClose: () => {},
      className: 'login-dlg',
      title: '上传失败',
      content:
        <div>
          请在视图模型中选中焦点，再行上传...
        </div>,
      open: true
      // TODO:将open设为true
      // open: false
    })
  }

/////////////////////////////////////////////////////////
  //
  //修改：上传资料时候用户没有选择资料类型
  /////////////////////////////////////////////////////////
  showMissDataType () {

    const onClose = (result) => {

      this.dialogSvc.off('dialog.close', onClose)

      if (result === 'OK') {

        return
      }

    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      onRequestClose: () => {},
      className: 'login-dlg',
      title: '上传失败',
      content:
        <div>
          请选择要视点资料的类型，再行上传...
        </div>,
      open: true
      // TODO:将open设为true
      // open: false
    })
  }


  //
  get className() {
    return 'config-manager'
  }

  // Extension Id
  static get ExtensionId() {
    return 'Viewing.Extension.NewDataManagement'
  }

  // Load callback
  load () {

    this.viewer.addEventListener(
      Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, (e) => {
        if (this.options.loader) {
          this.options.loader.show(false)
        }
      })

    this.itemToggling = this.options.itemToggling

    this.react.setState({
      emptyStateNameCaption:'新资料的名称 ...',
      disabled: this.options.disabled,
      stateSelection: true,
      stateCreation: true,
      newSequenceName: '',
      newStateName: '',
      sequence: null,   //当前视点组队列
      sequences: [],
      play: false,  //播放
      loop: true,   //循环播放
      items: [],    //一个视点序列里的所有视点

      user: null, // 当前用户，同 sequence
      uploadDataType:{id:0,name:'请选择'},//用户上传时候的视点类型
      selectedDataType:{id:0,name:'请选择'},//用户查询选中的视点类型
      dataName:'',//用户查询输入的字符串
      dataType:[   //搜索用的视点类型
        {
          id:0,
          name:'请选择'
        },
        {
          id:1,
          name:'安全'
        },
        {
          id:2,
          name:'质量'
        },
        {
          id:3,
          name:'进度'
        }
      ],    //资料类型选择
      uploadDataTypes:[   //搜索用的视点类型
        {
          id:0,
          name:'请选择'
        },
        {
          id:1,
          name:'安全'
        },
        {
          id:2,
          name:'质量'
        },
        {
          id:3,
          name:'进度'
        }
      ],//用户上传视点的下拉框
      show:false

    }).then (() => {

      this.react.pushRenderExtension(this).then(
        async() => {

          if (this.api) {

            this.loadSequences()  //175行
          }
      })
    })

    console.log('Viewing.Extension.NewDataManagement loaded')

    return true
  }

  // Unload callback
  unload () {

    this.react.popViewerPanel(this)

    console.log('Viewing.Extension.NewDataManagement unloaded')

    return true
  }

  //github上141行代码
  sleep(ms){
    return new Promise((resolve)=>{
      setTimeout(()=>{
        resolve()
      },ms)
    })
  }

  //注释：该方法在该拓展load加载完时，被调用，142行。-->拓展加载完毕后，加载视点组，即初始化数据。
  //      1、加载视点序列,只加载 sequences 数组的第一个sequence,
  //      2、* 使用 setState 方法初始化 sequences 状态，使得 sequences 保存所有的视点组
  //      3、2秒后执行 setActiveSequence 方法（参数：传入视点组集合的第一个视点组sequence）（*显示视点）
  
  async loadSequences () {

    //注释：this.api 就是 Viewing.Extension.Config.API.js导出的实例
    //      这里返回的 sequences 是一个只有一个用户的数组，["cangshu"]
    const sequences =
      await this.api.getSequences({
        sortByName: true
      })
    //TODO:这里应该返回一个用户的sequence
    //修改：将const sequences = sequences.length 修改为 const user = sequences.length
    const user = sequences.length ?
      sequences[0] : null

    //修改：将 this.react.setState({ 修改为  this.react.setState({
    //       sequences                                            user
    //     })                                   })
    this.react.setState({
      user,
      sequences
    })

    //await this.sleep(2000)

    setTimeout(() => {
      this.setActiveSequence (user)
    }, 2000)
  }

  //
  onModelActivated (event) {

    this.setModel(event.model)

    this.loadSequences()
  }

  //
  setModel (model) {

    const modelId = model.dbModelId ||
      this.options.dbModel._id

    const database = model.database ||
      this.options.database

    const {apiUrl} = this.options
    //修改：将config改为newdm
    this.api = new ConfigAPI(
      `${apiUrl}/newdm/${database}/${modelId}`)
  }

  //
  addSequence () {

    this.react.setState({
      newSequenceName: ''
    })

    const onClose = (result) => {

      if (result === 'OK') {

        const state = this.react.getState()

        const name = !!state.newSequenceName
          ? DOMPurify.sanitize(state.newSequenceName)
          : new Date().toString('d/M/yyyy H:mm:ss')

        const sequence = {
          id: this.guid(),
          stateIds: [],
          name
        }

        //注释：用户点击OK则现在state中存入新的sequences(合并)
        const sequences = sortBy([
          ...state.sequences, sequence
        ], (s) => { return s.name })

        this.react.setState({
          sequences,
          items: []
        })

        this.setActiveSequence (sequence)
        //注释：再向数据库中添加新的视点序列
        if (this.api) {

          this.api.addSequence(sequence)
        }
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Add Sequence ...',
      content:
        <div>
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newSequenceName')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="Sequence name ..."
            className="sequence-name-input"
            html={''}/>
        </div>,
      open: true
    })
  }

  //
  copySequence () {

    this.react.setState({
      newSequenceName: ''
    })

    const onClose = (result) => {

      if (result === 'OK') {

        const state = this.react.getState()

        const items = state.items.map((item) => {

          return Object.assign({},
            item, {
              id: this.guid(),
              active: false
            })
        })

        const stateIds = items.map((item) => {

          return item.id
        })

        const sequence = Object.assign({},
          state.sequence, {
            name: state.newSequenceName,
            readonly: false,
            id: this.guid(),
            stateIds
        })

        const sequences = sortBy([
          ...state.sequences, sequence
        ], (s) => { return s.name })

        this.react.setState({
          sequences,
          sequence,
          items
        })

        if (this.api) {

          this.api.addSequence (Object.assign({},
            sequence, {
              stateIds: []
            })).then(() => {

            this.api.addState (sequence.id, items)
          })
        }
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Copy Sequence ...',
      content:
        <div>
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newSequenceName')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="Sequence name ..."
            className="sequence-name-input"
            html={''}/>
        </div>,
      open: true
    })
  }

  //
  deleteSequence () {

    const state = this.react.getState()

    const onClose = (result) => {

      if (result === 'OK') {

        clearTimeout(this.playTimeout)

        if (this.api) {

          this.api.deleteSequence(state.sequence.id)
        }

        this.emit('sequence.deleted', state.sequence)

        const sequences = state.sequences.filter(
          (sequence) => {
            return sequence.id !== state.sequence.id
          })

        const sequence = sequences.length ?
          sequences[0] : null

        this.react.setState({
          play: false,
          sequences
        })

        this.setActiveSequence(sequence)
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    const msg = DOMPurify.sanitize(
      `Are you sure you want to delete`
      + ` <b>${state.sequence.name}</b> ?`)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Delete Sequence ...',
      content:
        <div dangerouslySetInnerHTML={{__html: msg}}>
        </div>,
      open: true
    })
  }

  //
  getStateIds () {

    const domItems = document.getElementsByClassName(
      this.itemsClass)[0]

    const stateIds =
      Array.from(domItems.childNodes).map(
        (childNode) => {

          return childNode.dataset.id
        })

    return stateIds
  }

  //
  async onUpdateSequence () {

    const { sequence, items } = this.react.getState()

    const stateIds = this.getStateIds()

    const newSequence = Object.assign({},
      sequence, {
        stateIds
      })

    const newItems = stateIds.map((id) => {

      for (const item of items) {

        if (item.id === id) {

          return item
        }
      }
    })

    this.react.setState({
      sequence: newSequence,
      items: newItems
    })

    if (this.api) {

      this.api.updateSequence(newSequence)
    }
  }

  //注释：增加资料视点
  async addItem () {

    const state = this.react.getState()

    //注释：设置视点名称，如果用户没有设置视点名，则默认为保存视点的当前时间。
    const name = !state.newStateName.length
      ? new Date().toString('d/M/yyyy H:mm:ss')
      : DOMPurify.sanitize(state.newStateName)

    //注释：viewer.getState()得到一个视点的所有的信息，根据viewer判断当前视点位置？？？？？？？/
    //      dataType 是用户上传视点的类型
    const viewerState = Object.assign({},
      this.viewer.getState(), {
        id: this.guid(),
        name,
        dataType:state.uploadDataType
      })
    
    //更改：新增。判断用户是否选择焦点，如果没有选择，则弹窗提示
    if(viewerState.objectSet[0].id.length === 0){
      this.showMissPoint()
      return
    }
    //更改：新增。判断用户是否选择资料类型，如果没有选择，则弹窗提示
    if(viewerState.dataType.id == 0){
      this.showMissDataType()
      return
    }


    //修改：新增了 FormData 对象 , 并发起请求
    //TODO：未完待续
    // let formData = new FormData()
    let file = document.getElementById("myUpload").files[0] || null;
    console.log("没有上传文件的情况_____________:)____",file)
    // console.log(file)
    // formData.append("viewerState",JSON.stringify(viewerState)); 修改失败
    // formData.append("name","上传文件名称")
    // formData.append("file",file,file.name);
    // console.log('这里是前端第一个处理文件的file：',formData.get('file'))
    // console.log(`viewerState的值是全部视点还是单一视点？？？${JSON.stringify(viewerState)}`)


    // //plan2
    // let fileInput = document.getElementById('uploadFile');
    // fileInput.onchange = function(){
    //   let files = !!this.files ? this.files : [];
    //   if(!files.length || !window.FileReader){
    //     console.log('浏览器不支持html5');
    //     return false;
    //   }
    //   let fd = new FormData();
    //   fd.append('file',files[0]);
    //   fd.append('name','上传文件名称')
    //   console.log('this.files是什么：'+this.files)
    // }

    // console.log(`这里是前端第一个处理文件的formdata：${formData.get('file')}`)

    if (this.api) {

        //修改：增加了this.api.addStateFile请求，
        //这个请求会调用 upLoadSvc 的upload方法，解析data字段，
        //所以在将视点信息存在data中的 states 中，并且转为字符串
        if(file != null ){
          this.api.addStateFile(
            state.sequence.id,
            file,
            {"data":{"state":JSON.stringify(viewerState)}})
        }else{
          this.api.addState(
            state.sequence.id,
            viewerState
          )
        }
    }

    await this.react.setState({
      items: [...state.items, viewerState],
      newStateName: '',
      play: false
    })

    this.restoreStates[viewerState.id] =
      viewerState

    this.onRestoreState(viewerState, true)

    clearTimeout(this.playTimeout)
  }

  //修改：增加方法 searchItem 用于快速搜索
  //TODO：搜索逻辑的主要方法，可以参考上面的addItem方法
  async searchItem () {

    // await this.react.setState({
    //   play: false,
    //   items: []
    // })
    
    var state = this.react.getState();

    var dataName = state.dataName,
        selectedDataType = state.selectedDataType,
        user = state.user;

    console.log('/////////////////////////////////state'+JSON.stringify(state))

    if(user!=''){
      if (this.api) {

        const allStates =
          await this.api.getStates(
            user.id)
  
        console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!----`+states)
        console.log("_____________::_______",dataName)
  
        var states = allStates.filter(item =>{
          if(dataName.length>0){
            console.log("_____________::_______",item.name)
            console.log("_____________::_______",item.name.indexOf(dataName)>-1)
            if(selectedDataType.id==0){
              return item.name.indexOf(dataName)>-1 ? true : false;
            }else{
              if(selectedDataType.id==item.dataType.id && item.name.indexOf(dataName)>-1){
                return true;
              }else{
                return false;
              }
            }
          }else{
            if(selectedDataType.id!=0){
              return item.dataType.id==selectedDataType.id ? true : false;
            }else{
              return true;
            }
          }
        })
        console.log('筛选后的视点：========================================'+JSON.stringify(states))
    
        await this.react.setState({
          items: states
        })
      }
    }else{
      //注释：默认已经登陆
      alert("请登陆")
    }
    
  }

  //注释：资料视点的点击事件
  onRestoreState (
    viewerState, immediate = this.options.restoreImmediate) {

    //this.viewer.getState (viewerState)

    const filteredState = this.filterState(
      viewerState,
      'objectSet',
      'explodeScale')

    this.viewer.restoreState(
      filteredState,
      this.restoreFilter,
      immediate)
    
  }

  //
  deleteItem (id) {

    const state = this.react.getState()

    this.react.setState({
      items: state.items.filter((item) => {
        return item.id !== id
      }),
      play: false
    })

    this.emit('state.deleted', id)

    delete this.restoreStates[id]

    if (this.api) {

      this.api.deleteState(state.sequence.id, id)
    }

    clearTimeout(this.playTimeout)
  }

  //13 enter=回车键
  onKeyDown (e) {

    if (e.keyCode === 13) {

      e.stopPropagation()
      e.preventDefault()
    }
  }

  //
  onInputChanged (e, key) {

    const state = this.react.getState()

    state[key] = e.target.value

    this.react.setState(state)
  }

  // Filter a state selections
  filterState (srcState, setNames, elementNames) {

    const state = JSON.parse(JSON.stringify(srcState))

    const sets = Array.isArray(setNames)
      ? setNames : [setNames]

    const elements = Array.isArray(elementNames)
      ? elementNames : [elementNames]

    sets.forEach((setName) => {

      if (state[setName]) {

        elements.forEach((elementName) => {

          state[setName].forEach((element) => {

            delete element[elementName]
          })
        })
      }
    })

    return state
  }

  // A fix for viewer.restoreState that also restores pivotPoint
  restoreStateWithPivot(state, filter=null, immediate=false) {

    const viewer = this.viewer

    function onStateRestored() {

      viewer.removeEventListener(
        Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
        onStateRestored);

      const pivot = state.viewport.pivotPoint;

      setTimeout(function () {

        viewer.navigation.setPivotPoint(
          new THREE.Vector3(
            pivot[0], pivot[1], pivot[2]))
      }, 1250)
    }

    viewer.addEventListener(
      Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
      onStateRestored)

    viewer.restoreState(state, filter, immediate)
  }

  //
  activateDrag () {

    const domItems =
      document.getElementsByClassName(
        this.itemsClass)[0]

    if (this.drake) {

      this.drake.destroy()
    }

    this.drake = Dragula([domItems])

    this.drake.on('drop', () => {

      this.onUpdateSequence()
    })
  }

  //注释：1、类型下拉框选择的选中事件，传入选中的sequence
  //      2、* 根据传入的 sequence 中的 stateIds 从mongodb中获得该视点的所有视点，
  //         * 并据此初始化状态items，则此视点组被认为是被激活的视点组
  //修改：改为筛选视点资料
  async setActiveSequence (sequence) {

    clearTimeout(this.playTimeout)

    this.restoreStates = {}

    this.playTimeout = null

    this.sequenceIdx = 0

    this.react.setState({
      play: false,
      items: [],
      sequence
    })

    if (this.drake) {

      this.drake.destroy()
      this.drake = null
    }
    //注释：如果不存在可以选择的 sequence ，则不可下拉
    if (sequence) {

      if (!sequence.readonly) {

        this.activateDrag()
      }

      if (this.api) {

        const states =
          await this.api.getStates(
            sequence.id)

        console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!----`+states)

        states.forEach((state) => {

          this.restoreStates[state.id] = state
        })

        await this.react.setState({
          items: states
        })
      }
    }
  }

  //
  playSequence () {

    // sequence is playing -> stopping it
    if (this.playTimeout) {

      clearTimeout(this.playTimeout)

      this.playTimeout = null

      this.sequenceIdx = 0

      this.react.setState({
        play: false
      })

      return
    }

    const stateIds = this.getStateIds()

    const step = (stateId) => {

      const state = this.react.getState()

      this.onRestoreState(this.restoreStates[stateId])

      this.react.setState({
        play: true,
        items: state.items.map((item) => {
          if (item.active) {
            item.active = false
            this.emit('state.toggled', item)
          }
          if (item.id === stateId) {
            item.active = true
            this.emit('state.toggled', item)
          }
          return item
        })
      })

      if ((++this.sequenceIdx) == stateIds.length) {

        const { loop } = this.react.getState()

        if (!loop) {

          this.react.setState({
            play: false
          })

          this.playTimeout = null

          return
        }

        this.sequenceIdx = 0
      }

      setTimeout(() => {
        const {items} = this.react.getState()
        this.react.setState({
          items: items.map((item) => {
            item.active = false
            return item
          })
        })
      }, this.playPeriod * 0.8)

      return setTimeout(() => {

        this.playTimeout = step(stateIds[this.sequenceIdx])

      }, this.playPeriod)
    }

    if (stateIds.length > 0) {

      this.playTimeout = step (stateIds[this.sequenceIdx])
    }
  }

  //
  async setDocking (docked) {

    const id = NewDataManagementExtension.ExtensionId

    const {sequence} = this.react.getState()

    if (docked) {

      await this.react.popRenderExtension(id)

      const panel = await this.react.pushViewerPanel(this, {
          height: 250,
          width: 300
        })

      panel.on('update', () => {

        if (sequence && !sequence.readonly) {

          this.activateDrag ()
        }

        panel.off()
      })

    } else {

      await this.react.popViewerPanel(id)

      await this.react.pushRenderExtension(this)

      this.setActiveSequence (sequence)
    }
  }

  //注释：拓展的头部header 包括了一个切换模式
  renderTitle (docked) {

    const spanClass = docked
      ? 'fa fa-chain-broken'
      : 'fa fa-chain'

    return (
      <div className="title">

        <button onClick={() => this.closeExt()}
                title="关闭控件" className="closeExtensionButton">
        </button>

        <label>
          资料管理
        </label>
        <div className="config-manager-controls">
          <button onClick={() => this.setDocking(docked)}
            title="Toggle docking mode">
            <span className={spanClass}/>
          </button>
        </div>
      </div>
    )
  }

  returnFalse (){
    return false
  }

  //
  renderControls () {

    // const dataType = ['请选择','安全','质量','进度']

    const state = this.react.getState()

    /////////////////////////////////////////////////////////////
    //修改：注释掉的源码，sequences 为下拉菜单，点击则执行setActiveSequence 方法更新当前视点
    // const sequences = state.sequences.map((sequence) => {

    //   const id = sequence.id

    //   return (
    //     <MenuItem eventKey={id} key={id} onClick={() => {

    //       this.setActiveSequence(sequence)
    //     }}>
    //       { sequence.name }
    //     </MenuItem>
    //   )
    // })
    ///////////////////////////////////////////////////////////
    //TODO：922行 this.setActiveSequence(data) 待修改为setState
    // dataType 为原状态 sequences
    const dataType = state.dataType.map((data) => {

      const id = data.id

      return (
        <MenuItem eventKey={id} key={id} onClick={() => {

          this.react.setState({"selectedDataType":data})
        }}>
          { data.name }
        </MenuItem>
      )
    })

    //更改：新增了 uploadDataType ，用于上传视点时候的视点状态选择
    const uploadDataType = state.uploadDataTypes.map((data) => {

      const id = data.id

      return (
        <MenuItem eventKey={id} key={id} onClick={() => {

          this.react.setState({'uploadDataType':data})
        }}>
          { data.name }
        </MenuItem>
      )
    })

    //修改：将 state.sequence 修改为 state.dataType
    //TODO:修改所有sequence为dataType
    const sequence = state.dataType

    const sequenceName = sequence
      ? sequence.name +
        (!sequence.readonly ? '' : ' (readonly)')
      : ''

    const stateCreationDisabled =
      !sequence ||
      sequence.readonly ||
      !state.stateCreation

    return (
      <div className="controls">


        {//注释：源码样式，视点组的第一行
          /* <div className="row">

          <DropdownButton
            title={"当前视点序列: " +  sequenceName}
            className="sequence-dropdown"
            disabled={!sequence}
            key="sequence-dropdown"
            id="sequence-dropdown">
           { sequences }
          </DropdownButton>

          <button onClick={() => this.addSequence()}
            title="Add sequence">
            <span className="fa fa-plus"/>
          </button>

          <button onClick={() => this.copySequence()}
            disabled={!sequence}
            title="Copy sequence">
            <span className="fa fa-copy"/>
          </button>

          <button onClick={() => this.deleteSequence()}
            disabled={!sequence || sequence.readonly}
            title="Delete sequence">
            <span className="fa fa-times"/>
          </button>

        </div> */}

        {
          //注释：资料管理样式修改
          //899行的onInputChanged为用户搜索的资料名 dataName，在this.state中
          //onKKeyDown中的13是指回车键enter,TODO:应该执行搜索，需要重写onKeyDown
        }
        <div className='row'>
          
        <ContentEditable
              onChange={(e) => this.onInputChanged(e, 'dataName')}
              data-placeholder=""
              onKeyDown={(e) => this.onKeyDown(e)}
              className="state-name-input"
              html={state.dataName}
              // disabled={true}
        />

          <DropdownButton
            title={state.selectedDataType.name}
            className="sequence-dropdown"
            disabled={!sequence}
            key="sequence-dropdown"
            id="sequence-dropdown">
           { dataType }
          </DropdownButton>
          {
            //TODO：这里是搜索按钮，需要写搜索资料逻辑
          }
          <button
            onClick={this.searchItem}
            title="快速搜索视点资料"
            style={{"width":100}}
            >
            快速搜索
          </button>

        </div>
        
        {//注释：资料管理样式修改
        }

        <div className="row">

          {
            stateCreationDisabled &&
            <ContentEditable
              onChange={(e) => this.onInputChanged(e, 'newStateName')}
              data-placeholder={state.emptyStateNameCaption}
              onKeyDown={(e) => this.onKeyDown(e)}
              className="state-name-input"
              html={state.newStateName}
              disabled={true}
            />
          }

          {
            !stateCreationDisabled &&
            <ContentEditable
              onChange={(e) => this.onInputChanged(e, 'newStateName')}
              data-placeholder={state.emptyStateNameCaption}
              onKeyDown={(e) => this.onKeyDown(e)}
              className="state-name-input"
              html={state.newStateName}
            />
          }

          <DropdownButton
            title={state.uploadDataType.name}
            className="sequence-dropdown"
            disabled={!uploadDataType}
            key="sequence-dropdown"
            id="sequence-dropdown">
           { uploadDataType }
          </DropdownButton>

          <form name='uploadForm'
            id='uploadForm'
            onSubmit={this.returnFalse}
            method='POST'
            action='#'
            encType='multipart/form-data'
            style={{"width":170}}>

            <input type="file" name="myUpload" id="myUpload"></input>

          </form>

          
          <button disabled={stateCreationDisabled}
            onClick={this.addItem}
            title="上传视点资料"
            style={{"width":100}}>
            <span className="fa fa-plus-square">
            上传视点
            </span>
          </button>
            {/* <input type='button'
              disabled={stateCreationDisabled}
              onClick={this.addItem}
              value='上传视点资料'>
            </input> */}


          {/* <button
            title={state.play ? "Pause sequence" : "Play sequence"}
            onClick={() => this.playSequence()}
            disabled={!sequence}>
            <span className={"fa fa-" + (state.play ? "pause" : "play")}/>
          </button> */}

          {/* <Switch isChecked={true} className="loop"
            onChange={(loop) => {
              this.react.setState({
                loop
              })
            }}/> */}

        </div>

      </div>
    )
  }

  //注释：资料视点的点击事件，传入选中的视点 selectedItem ，使用 selectedItem.id 与 state.items 中的
  //id 进行匹配，将 state.items 中该视点的 active 设置为true ， 并且向父级组件 emit 了一个事件（未知）
  toggleItem (selectedItem) {

    const state = this.react.getState()

    const items = state.items.map((item) => {

      if (item.id === selectedItem.id) {

        item.active = !item.active

        if (item.active) {

          this.onRestoreState(selectedItem)
        }
      }

      return item
    })

    this.emit('state.toggled', selectedItem)
    
    //TODO:在这里弹窗展示资料
    alert("该视点未上传任何资料!")

    this.react.setState({
      items
    })
  }

  //注释：资料视点在这里渲染
  renderItems () {

    const state = this.react.getState()

    const items = state.items.map((item) => {

      const text = DOMPurify.sanitize(item.name)

      //TODO：用于视点的图片 src
      const thumbnailUrl =
      `/resources/img/newDM/${item.filename}`

      const className = "item" +
        (state.stateSelection ? ' selectable' : '') +
        (this.itemToggling ? ' toggable' : '') +
        (item.active ? ' active' :'')

      return (
        <div key={item.id}>
          
          <div data-id={item.id} data-name={text}
              className={className}
              key={item.id}
              onClick={async() => {
                if(state.stateSelection) {
                  if (this.itemToggling) {
                    console.log(`>>>>>>>>这里执行了this.toggleItem(item)`)
                    this.toggleItem(item)
                  } else {
                    console.log(`>>>>>>>>?>>>>>这里执行了his.onRestoreState (item)`)
                    this.onRestoreState (item)

                    //注释：获取所点击视点的资料图片
                    //TODO： 似乎这句 getData 不需要？！
                    await this.api.getData(state.sequence.id, item.id);
                        
                    var newImg = document.createElement("img"),
                        showDataContainer = document.getElementById("showDataContainer"),
                        oldImg = showDataContainer.lastChild;
                    newImg.id = "itemImg";
                    newImg.style.cssText="height:200px;wight:200px;overflow:hidden"
                    console.log(`_______-newImg: ${newImg}`)
                    console.log(`_______showDataContainer: ${showDataContainer}`)
                    oldImg.id == "itemImg" && showDataContainer.removeChild(showDataContainer.lastChild);
                    newImg.onload = ()=>{
                      console.log('+++++++++++图片加载 src 成功， onload+++++++++++=+++++++')
                    }
                    newImg.src = "http://localhost:3000/resources/img/newDM/"+item.filename;
                    showDataContainer.appendChild(newImg);
                    // window.location.href = window.location.href;
                    //TODO：在这里写弹窗展示视点资料的逻辑
                    this.handleShow()
                  }
                }
              }}>

              <Label text={text}/>

              {
                !state.sequence.readonly &&
                <button onClick={(e) => {
                    this.deleteItem(item.id)
                    e.stopPropagation()
                    e.preventDefault()
                }}
                  title="删除视点资料">
                  <span className="fa fa-times"/>
                </button>
              }

        </div>

          {/* <div className="image-container">
            <Image src={thumbnailUrl}/>
          </div> */}

        </div>
            
        
      )
    })

    return (
        <div className={`items ${this.itemsClass}`}>
        { items }
        {
          //修改：新增了弹窗用来展示资料
          //TODO：样式好看点
        }
        <div style={{"height":200,"backgroundColor":"red"}}>

        </div>
        <div id = "showDataContainer" style={{"width":400,"height":400,"backgroundColor":"#ededed","position":"static"
        ,"display":state.show?"block":"none"}}>
          <button 
            style={{"positon":"absolute","right":0,"top":0,"height":50,"width":50}}
            onClick = {this.handleClose}
          >
              <span className="fa fa-times"/>
          </button>
          <div>该视点尚未上传任何资料</div>
          <img
            id='itemImg'
            style={{"width":"200px","height":"200px","backgroundColor":"red","overflow":"hidden"}} 
            src="http:localhost:3000/resources/img/newDM/3.png" 
            alt="图片"/>
        </div>
      </div>
      
      
    )
  }

  //
  render (opts) {

    const state = this.react.getState()

    this.closeExt = opts.closeExt

    return (
      <WidgetContainer
        renderTitle={() => this.renderTitle(opts.docked)}
        showTitle={opts.showTitle}
        className={this.className}>
        {
            state.disabled &&
            <div className="disabled-overlay"/>
        }
        { this.renderControls() }
        { this.renderItems() }

      </WidgetContainer>
    )
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  NewDataManagementExtension.ExtensionId,
  NewDataManagementExtension)
