import React from 'react'

class BaseComponent extends React.Component {

  constructor(props) {
    super(props)
  }

  assignState (state) {
    return new Promise((resolve) => {
      const newState = Object.assign({}, this.state, state)//设置状态
      this.setState(newState, () => {
        resolve()
      })
    })
  }
}

export default BaseComponent
