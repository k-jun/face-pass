// BlogFormReview shows users their form inputs for review
import * as tf from '@tensorflow/tfjs';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import {Webcam} from './webcam';
import axios from 'axios';

const webcam = new Webcam(document.getElementById('webcam'));

let mobilenet

class SignupScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            processing: false,
            photoNum: 0
        }

    }

    async componentDidMount () {
      await webcam.setup();
      mobilenet = await this.loadMobilenet();
    }

    async loadMobilenet () {
      const mobilenet = await tf.loadModel(
        'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

      // Return a model that outputs an internal activation.
      const layer = mobilenet.getLayer('conv_pw_13_relu');
      return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
    }

    handleOnChange (value) {
      this.setState({email: value})
    }

    async handleOnClick () {
      this.setState({processing: true})

      const xs = mobilenet.predict(webcam.capture())
      const x_data = await xs.data()
      let params = {email: this.state.email, x: x_data.toString()}
      const res = await axios.post('/api/add_face_data', params)
      if (res) {
        this.setState({processing: false, photoNum: res.data.dataAmount})
        console.log(res.data)
      }
    }

    async handleOnSubmit () {
      this.setState({processing: true})
      const params = {email: this.state.email}
      const res = await axios.post('/api/get_data_amount', params)
      if (res) {
        console.log(res.data)
        this.setState({processing: false, photoNum: res.data.dataAmount})
      }

    }

    render() {
      const {photoNum, processing} = this.state
      return (
        <div style={{flexDirection: 'column', display: "flex"}}>
          this is sign up screen
          <a href="/">Go back</a>
          <div>
            <label htmlFor="">email</label>
            <input type="text" value={this.email} onChange={(event) => {this.handleOnChange(event.target.value)}} />
          </div>
          <div>
            <button onClick={() => this.handleOnClick()} disabled={this.state.processing}>Collect Image (now {this.state.photoNum})</button>
          </div>

          <h5>{(photoNum >= 3) ? 'you are ready to log in' : 'more photos are needed to log in'}</h5>
        </div>
      );
    }
}

export default withRouter(SignupScreen);
