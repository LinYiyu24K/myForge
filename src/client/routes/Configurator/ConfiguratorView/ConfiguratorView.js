import ConfiguratorHomeView from './ConfiguratorHomeView'
import ViewerConfigurator from 'Viewer.Configurator'
import { browserHistory } from 'react-router'
import './ConfiguratorView.scss'
import React from 'react'

class ConfiguratorView extends React.Component {

  /////////////////////////////////////////////////////////
  constructor (props) {
    super (props)

    this.onError = this.onError.bind(this)
  }

  /////////////////////////////////////////////////////////
  componentWillMount () {

    this.props.setNavbarState({
      links: {
        settings: false
      }
    })
  }

  /////////////////////////////////////////////////////////
  onError (error) {

    if (error.status === 404) {

      browserHistory.push('/404')

    } else if (error) {

      console.log('unhandled error:')
      console.log(error)
    }
  }

  /////////////////////////////////////////////////////////
  render () {

    const view = this.props.location.query.id//这是一个?:的3位运算 判断语句，如果id不为空，改变以一系列的状态值，否则打开Configurator的首页
      ? <ViewerConfigurator
          setNavbarState={this.props.setNavbarState}
          setViewerEnv={this.props.setViewerEnv}
          modelId={this.props.location.query.id}
          appState={this.props.appState}
          location={this.props.location}
          database='configurator'
          onError={this.onError}
          notify={this.notify}
          showLoader={true}
        />
      : <ConfiguratorHomeView/>

    return (
      <div className="configurator-view">
        { view }
      </div>
    )
  }
}

export default ConfiguratorView
