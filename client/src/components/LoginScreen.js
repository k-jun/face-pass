import React, { useState } from 'react'
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
  mobilenet = tf.model({ inputs: localMobilenet.inputs, outputs: layer.output })
}

const predict = async () => {
  const predictedClass = tf.tidy(() => {
    const img = webcam.capture()
    const activation = mobilenet.predict(img)
    const predictions = model.predict(activation)
    return predictions.as1D().argMax()
  })
  const classId = (await predictedClass.data())[0]
  return classId
}

const predicting = async () => {
  setInterval(async () => {
    const classId = await predict()
    if (classId === 1) {
      resultMessage.innerHTML = 'Successed'
      resultMessage.setAttribute('style', 'text-align: center; color: green')
      title.setAttribute('style', 'text-align: center; color: green')
    } else {
      resultMessage.innerHTML = 'Failed'
      resultMessage.setAttribute('style', 'text-align: center; color: red')
      title.setAttribute('style', 'text-align: center; color: red')
    }
  }, 1000)
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

async function fetchImages({ email }) {
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
}

function LoginScreen() {
  loadMobilenet()
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')

  const DoFacePass = async () => {
    setDisabled(true)
    resultMessage.innerHTML = 'Fetching Images Now...'
    await fetchImages({ email })
    resultMessage.innerHTML = 'Training Images Now...'
    await training()
    resultMessage.innerHTML = 'Ready!!!'
    await webcam.setup()
    predicting()
  }

  return (
    <div style={{ flexDirection: 'column', display: 'flex' }}>
      <div style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <FormControl aria-describedby="name-helper-text">
          <InputLabel htmlFor="name-helper">Label</InputLabel>
          <Input id="name-helper" style={{ minWidth: 200 }} value={email} onChange={event => setEmail(event.target.value)} fullWidth disabled={disabled} />
        </FormControl>
        <Button variant="fab" aria-label="Add" onClick={() => DoFacePass()} disabled={disabled || !email}>
          <Send />
        </Button>
      </div>
    </div>
  )
}

export default withRouter(LoginScreen)
