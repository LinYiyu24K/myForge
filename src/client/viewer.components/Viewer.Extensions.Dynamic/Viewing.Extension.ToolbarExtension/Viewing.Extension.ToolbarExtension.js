/////////////////////////////////////////////////////////
// Viewing.Extension.ToolbarExtension
// by Joe, June 2017
/////////////////////////////////////////////////////////

import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
//import './Viewing.Extension.ToolbarExtension.scss'
import ReactDOM from 'react-dom'
import React from 'react'

class ToolbarExtension extends MultiModelExtensionBase {

  // Class constructor
  constructor(viewer, options) {
    super (viewer, options)
  }

  // Extension Id
  static get ExtensionId() {
    return 'Viewing.Extension.ToolbarExtension'
  }

  load () {
    if (this.viewer.toolbar) {
      // Toolbar is already available, create the UI
      this.createUI();
    } else {
      // Toolbar hasn't been created yet, wait until we get notification of its creation
      this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
      this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }
      return true;
  };

  onToolbarCreated() {
    this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    //把监听工具栏是否加载成功的监听器关掉
    this.onToolbarCreatedBinded = null;
    this.createUI();
  };

  createUI() {
    // alert('TODO: Create Toolbar!');

    var viewer = this.viewer;

    // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('my-view-front-button');
    button1.onClick = function(e) {
      viewer.setViewCube('front');//设为正面视图
    };
    button1.addClass('my-view-front-button');
    button1.setToolTip('View front');

    // Button 2
    var button2 = new Autodesk.Viewing.UI.Button('my-view-back-button');
    button2.onClick = function(e) {
      viewer.setViewCube('back');//设为后面的视图
    };
    button2.addClass('my-view-back-button');
    button2.setToolTip('View Back');

    // saveViewButton 视点保存
    var saveViewButton = new Autodesk.Viewing.UI.Button('saveViewButton');
    saveViewButton.onClick = function(e) {
      viewer.setViewCube('front');//设为后面的视图
    };
    saveViewButton.addClass('saveViewButton');
    saveViewButton.setToolTip('视点保存');

    // filterButton 过滤器
    var filterButton = new Autodesk.Viewing.UI.Button('filterButton');
    filterButton.onClick = function(e) {
      viewer.setViewCube('back');//设为后面的视图
    };
    filterButton.addClass('filterButton');
    filterButton.setToolTip('过滤器');

    // filterShaderButton 过滤器着色
    var filterShaderButton = new Autodesk.Viewing.UI.Button('filterShaderButton');
    filterShaderButton.onClick = function(e) {
      viewer.setViewCube('front');//设为后面的视图
    };
    filterShaderButton.addClass('filterShaderButton');
    filterShaderButton.setToolTip('过滤器着色管理');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
    this.subToolbar.addControl(button1);
    this.subToolbar.addControl(button2);

    this.subToolbar.addControl(saveViewButton);
    this.subToolbar.addControl(filterButton);
    this.subToolbar.addControl(filterShaderButton);

    viewer.toolbar.addControl(this.subToolbar);
  };

  unload(){
    this.viewer.toolbar.removeControl(this.subToolbar);
    return true;
  }
}


Autodesk.Viewing.theExtensionManager.registerExtension(
  ToolbarExtension.ExtensionId,
  ToolbarExtension)
