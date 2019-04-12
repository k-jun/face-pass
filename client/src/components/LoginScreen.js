import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import axios from 'axios'
import * as tf from '@tensorflow/tfjs'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Input from '@material-ui/core/Input'
import Button from '@material-ui/core/Button'
import Send from '@material-ui/icons/Send'

import Webcam from './webcam'
import ControllerDataset from './controller_dataset'

const BASE_MODEL_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'

const webcam = new Webcam(document.getElementById('webcam'))
const controllerDataset = new ControllerDataset(10)
let mobilenet
let model
const resultMessage = document.getElementById('result-message')
const title = document.getElementById('facepass')

const loadMobilenet = async () => {
  const localMobilenet = await tf.loadModel(BASE_MODEL_URL)
  const layer = localMobilenet.getLayer('conv_pw_13_relu')
  return tf.model({ inputs: localMobilenet.inputs, outputs: layer.output })
}

const training = async () => {
  model = tf.sequential({
    layers: [
      tf.layers.flatten({ inputShape: [7, 7, 256] }),
      tf.layers.dense({
        units: 100,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        useBias: true,
      }),
      tf.layers.dense({
        units: 10,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: 'softmax',
      }),
    ],
  })

  const optimizer = tf.train.adam(0.0001)
  model.compile({ optimizer, loss: 'categoricalCrossentropy' })

  const batchSize = Math.floor(controllerDataset.xs.shape[0] * 0.4)
  if (!(batchSize > 0)) throw new Error('Batch size is 0 or NaN. Please choose a non-zero fraction.')

  model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: 20,
    callbacks: { onBatchEnd: async () => tf.nextFrame() },
  })
}

const predict = () => {
  setTimeout(async () => {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture()
      const activation = mobilenet.predict(img)
      const predictions = model.predict(activation)
      return predictions.as1D().argMax()
    })
    const classId = (await predictedClass.data())[0]
    return classId
  }, 1000)
}

const predicting = async () => {
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const classId = await predict()
    if (classId === 1) {
      resultMessage.innerHTML = 'Successed'
      resultMessage.setAttribute('style', 'text-align: center color: green')
      title.setAttribute('style', 'text-align: center color: green')
    } else {
      resultMessage.innerHTML = 'Failed'
      resultMessage.setAttribute('style', 'text-align: center color: red')
      title.setAttribute('style', 'text-align: center color: red')
    }
  }
}

class LoginScreen extends Component {
  constructor() {
    super()
    this.state = {
      email: '',
      disabled: false,
    }
  }

  async componentDidMount() {
    mobilenet = await loadMobilenet()
  }

  async DoFacePass() {
    this.setState({ disabled: true })
    resultMessage.innerHTML = 'Fetching Images Now...'
    await this.fetchImages()
    resultMessage.innerHTML = 'Training Images Now...'
    await training()
    resultMessage.innerHTML = 'Ready!!!'
    await webcam.setup()
    predicting()
  }

  fetchImages() {
    return new Promise(async (solve) => {
      const { email } = this.state
      const params = { email }
      const res = await axios.post('/api/get_all_images', params)
      const imageString = res.data.images.map(item => item.x_data)
      const fakeImageString = res.data.fake_images.map(item => item.x_data)

      imageString.forEach((value) => {
        const imageTensor = tf.tensor1d(value.split(','))
        controllerDataset.addExample(imageTensor.reshape([1, 7, 7, 256]), 1)
      })

      fakeImageString.forEach((value) => {
        const imageTensor = tf.tensor1d(value.split(','))
        controllerDataset.addExample(
          imageTensor.reshape([1, 7, 7, 256]),
          Math.floor(Math.random() * 9) + 2,
        )
      })
      solve()
    })
  }

  render() {
    const { disabled, email } = this.state
    return (
      <div style={{ flexDirection: 'column', display: 'flex' }}>
        <div style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <FormControl aria-describedby="name-helper-text">
            <InputLabel htmlFor="name-helper">Label</InputLabel>
            <Input id="name-helper" style={{ minWidth: 200 }} value={email} onChange={event => this.setState({ email: event.target.value })} fullWidth disabled={disabled} />
          </FormControl>
          <Button variant="fab" aria-label="Add" onClick={() => this.DoFacePass()} disabled={disabled || !email}>
            <Send />
          </Button>
        </div>
      </div>
    )
  }
}

export default withRouter(LoginScreen)
