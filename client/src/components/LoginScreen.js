// BlogFormReview shows users their form inputs for review
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import {Webcam} from './webcam';
import {ControllerDataset} from './controller_dataset';

const webcam = new Webcam(document.getElementById('webcam'));
const controllerDataset = new ControllerDataset(10);


let mobilenet
let model
class LoginScreen extends Component {
  constructor () {
    super()
    this.state = {
      email: "",
      taking: false,
      processing: false
    }
  }

  async componentDidMount () {
    mobilenet = await this.loadMobilenet();
  }

  async handleOnClick () {
    this.setState({processing: true})
    const params = {email: "keijun"}
    const res = await axios.post('/api/get_all_images', params)
    const image_string = res.data.images.map((item) => item.x_data)

    image_string.forEach((value) => {
      const image_tensor = tf.tensor1d(value.split(','))
      controllerDataset.addExample(image_tensor.reshape([1, 7, 7, 256]), 1)
    })

    this.training()

    this.setState({taking: true, processing: false})
    await webcam.setup();
  }

  async predict () {
    const img = webcam.capture();
    const activation = mobilenet.predict(img);
    const predictions = model.predict(activation);
    const predictedClass = tf.tidy(() => {
      // Capture the frame from the webcam.
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });
    const classId = (await predictedClass.data())[0];
    console.log(classId)
  }

  training () {
    model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({inputShape: [7, 7, 256]}),

        // Layer 1
        tf.layers.dense({
          units: 100,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        // Layer 2. The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: 10,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });

    const optimizer = tf.train.adam(0.0001);
    model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

    const batchSize = Math.floor(controllerDataset.xs.shape[0] * 0.4);
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
    }

    model.fit(controllerDataset.xs, controllerDataset.ys, {
      batchSize,
      epochs: 20,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          // ui.trainStatus('Loss: ' + logs.loss.toFixed(5));
          await tf.nextFrame();
        }
      }
    });
  }

  async loadMobilenet () {
    const mobilenet = await tf.loadModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

    // Return a model that outputs an internal activation.
    const layer = mobilenet.getLayer('conv_pw_13_relu');
    return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
  }


  render() {
    return (
      <div style={{flexDirection: "column", display: "flex"}}>
        this is login screen
        <a href="/">Go back</a>
        {!this.state.taking
          ? <div>
            <label htmlFor="">Email</label>
            <input type="text" disabled={this.state.processing} value={this.email} onChange={(event) => {this.setState({email: event.target.value})}} />
            <button onClick={() => {this.handleOnClick()}}>Submit</button>
          </div>
          : <div>
            <button onClick={() => this.predict()}>撮影して予測</button>
          </div>
        }
      </div>
    );
  }
}

export default withRouter(LoginScreen);
