// BlogFormReview shows users their form inputs for review
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import {Webcam} from './webcam';
import {ControllerDataset} from './controller_dataset';
import {withStyles} from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import Send from "@material-ui/icons/Send";


const webcam = new Webcam(document.getElementById('webcam'));
const controllerDataset = new ControllerDataset(10);
let mobilenet
let model
let resultMessage = document.getElementById('result-message')
let title = document.getElementById('facepass')

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  formControl: {
    margin: theme.spacing.unit,
  }
})

class LoginScreen extends Component {
  constructor () {
    super()
    this.state = {
      email: "",
      disabled: false
    }
  }

  async componentDidMount () {
    mobilenet = await this.loadMobilenet();
  }

  loadMobilenet () {
    return new Promise(async (solve, reject) => {
      const localMobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')
      const layer = localMobilenet.getLayer('conv_pw_13_relu');
      solve(tf.model({inputs: localMobilenet.inputs, outputs: layer.output}))
    })
  }

  async DoFacePass () {
    this.setState({disabled: true})
    resultMessage.innerHTML = "Fetching Images Now..."
    await this.fetchImages()
    resultMessage.innerHTML = "Training Images Now..."
    await this.training()
    resultMessage.innerHTML = "Ready!!!"
    await webcam.setup()
    this.predicting()
  }

  fetchImages () {
    return new Promise(async (solve, reject) => {
      const { email } = this.state
      const params = { email }
      const res = await axios.post('/api/get_all_images', params)
      const image_string = res.data.images.map((item) => item.x_data)
      const fake_image_string = res.data.fake_images.map((item) => item.x_data)

      image_string.forEach((value) => {
        const image_tensor = tf.tensor1d(value.split(','))
        controllerDataset.addExample(image_tensor.reshape([1, 7, 7, 256]), 1)
      })

      fake_image_string.forEach((value) => {
        const image_tensor = tf.tensor1d(value.split(','))
        controllerDataset.addExample(image_tensor.reshape([1, 7, 7, 256]), Math.floor(Math.random() * 9 ) + 2)
      })
      solve()
    })    
  }

  training () {
    return new Promise(async (solve, reject) => {
      model = tf.sequential({
        layers: [
          tf.layers.flatten({inputShape: [7, 7, 256]}),
          tf.layers.dense({
            units: 100,
            activation: 'relu',
            kernelInitializer: 'varianceScaling',
            useBias: true
          }),
          tf.layers.dense({
            units: 10,
            kernelInitializer: 'varianceScaling',
            useBias: false,
            activation: 'softmax'
          })
        ]
      })
  
      const optimizer = tf.train.adam(0.0001);
      model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
  
      const batchSize = Math.floor(controllerDataset.xs.shape[0] * 0.4)
      if (!(batchSize > 0)) throw new Error(`Batch size is 0 or NaN. Please choose a non-zero fraction.`)
  
      model.fit(controllerDataset.xs, controllerDataset.ys, {
        batchSize,
        epochs: 20,
        callbacks: { onBatchEnd: async (batch, logs) => await tf.nextFrame() }
      })
      solve()
    })
  }

  async predicting () {
    while (true) {
      const classId = await this.predict()
      if (classId === 1) {
        resultMessage.innerHTML = "Successed"
        resultMessage.setAttribute("style", "text-align: center; color: green")
        title.setAttribute("style", "text-align: center; color: green")
      } else {
        resultMessage.innerHTML = "Failed"
        resultMessage.setAttribute("style", "text-align: center; color: red")
        title.setAttribute("style", "text-align: center; color: red")
        
      }
    }
  }

  predict () {
    return new Promise((solve, reject) => {
      setTimeout(async () => {
        const predictedClass = tf.tidy(() => {
          const img = webcam.capture();
          const activation = mobilenet.predict(img);
          const predictions = model.predict(activation);
          return predictions.as1D().argMax();
        });
        const classId = (await predictedClass.data())[0];
        solve(classId)
      }, 1000);
    })
  }

  render() {
    const { classes } = this.props;
    const {disabled, email} = this.state
    return (
      <div style={{flexDirection: "column", display: "flex"}}>
        <div style={{flexDirection: 'row', justifyContent: "center"}}>
          <FormControl className={classes.formControl} aria-describedby="name-helper-text">
            <InputLabel htmlFor="name-helper">Label</InputLabel>
            <Input id="name-helper" style={{minWidth: 200}} value={email} onChange={(event) => {this.setState({email: event.target.value})}} fullWidth disabled={disabled}/>
          </FormControl>
          <Button variant="fab" aria-label="Add" className={classes.button} onClick={() => this.DoFacePass()} disabled={disabled || !email }>
            <Send />
          </Button>
        </div>
      </div>
    );
  }
}

export default  withRouter(withStyles(styles)(LoginScreen));
