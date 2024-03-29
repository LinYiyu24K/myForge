import PropTypes from 'prop-types'
import React from 'react'

class ExtensionPane extends React.Component {

  //
  static propTypes = {
    className: PropTypes.string
  }

  //
  static defaultProps = {
    className: ''
  }

  //
  render () {

    const classNames = [
      'extension-pane',
      ...this.props.className.split(' ')
    ]

    return (
      <div className={classNames.join(' ')}>
        {this.props.children}
      </div>
    )
  }
}

export default ExtensionPane
