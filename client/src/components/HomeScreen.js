import React from 'react'
import { withRouter } from 'react-router-dom'

function HomeScreen() {
  return (
    <div style={{ flexDirection: 'row', display: 'flex', justifyContent: 'space-around' }}>
      <a style={{ fontSize: 20, borderBottom: 2 }} href="./login">
        Login
      </a>
      <a style={{ fontSize: 20 }} href="./signup">
        Signup
      </a>
    </div>
  )
}

export default withRouter(HomeScreen)
