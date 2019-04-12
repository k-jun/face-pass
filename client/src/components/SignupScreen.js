import * as tf from '@tensorflow/tfjs'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import axios from 'axios'
import Button from '@material-ui/core/Button'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import CloudUpload from '@material-ui/icons/CloudUpload'

import Webcam from './webcam'

let mobilenet

const webcam = new Webcam(document.getElementById('webcam'))
const BASE_MODEL_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'

const loadMobilenet = async () => {
  const localMobilenet = await tf.loadModel(BASE_MODEL_URL)
  const layer = localMobilenet.getLayer('conv_pw_13_relu')
  return tf.model({ inputs: localMobilenet.inputs, outputs: layer.output })
}

class SignupScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      processing: false,
    }
  }

  async componentDidMount() {
    await webcam.setup()
    const returnValue = await loadMobilenet()
    mobilenet = returnValue
  }

  async handleOnClick() {
    this.setState({ processing: true })
    const { name } = this.state

    const xs = mobilenet.predict(webcam.capture())
    const xData = await xs.data()
    const params = {
      email: name,
      x: xData.toString(),
    }
    const res = await axios.post('/api/add_face_data', params)
    if (res) {
      this.setState({ processing: false })
    }
  }

  handleOnChange(event) {
    this.setState({ name: event.target.value })
  }

  render() {
    const { processing, name } = this.state
    return (
      <div style={{ flexDirection: 'column', display: 'flex' }}>
        <div style={{ flexDirection: 'row', display: 'flex', justifyContent: 'center' }}>
          <FormControl style={{ minWidth: 200 }} aria-describedby="name-helper-text">
            <InputLabel htmlFor="name-helper">Label</InputLabel>
            <Input id="name-helper" value={name} onChange={event => this.handleOnChange(event)} fullWidth disabled={processing} />
          </FormControl>
          <Button variant="fab" aria-label="Add" onClick={() => this.handleOnClick()} disabled={processing}>
            <CloudUpload />
          </Button>
        </div>
      </div>
    )
  }
}

export default withRouter(SignupScreen)
