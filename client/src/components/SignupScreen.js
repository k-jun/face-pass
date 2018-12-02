// BlogFormReview shows users their form inputs for review
import * as tf from '@tensorflow/tfjs';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import {Webcam} from './webcam';
import axios from 'axios';
import Button from "@material-ui/core/Button";
import {withStyles} from "@material-ui/core/styles";
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import CloudUpload from '@material-ui/icons/CloudUpload';

const webcam = new Webcam(document.getElementById('webcam'));

let mobilenet

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  input: {
    display: 'none',
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing.unit,
  },
});

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
      const mobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

      // Return a model that outputs an internal activation.
      const layer = mobilenet.getLayer('conv_pw_13_relu');
      return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
    }

    handleOnChange (value) {
      this.setState({email: value})
    }

    async handleOnClick () {
      this.setState({processing: true})
      const {name} = this.state

      const xs = mobilenet.predict(webcam.capture())
      const x_data = await xs.data()
      let params = {
        email: name,
        x: x_data.toString()
      }
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

    handleOnChange (event) {
      this.setState({name: event.target.value});
    }

    render() {
      const {photoNum, processing, name} = this.state
      const { classes } = this.props;
      return (
        <div style={{flexDirection: 'column', display: "flex"}}>
          <div style={{flexDirection: 'row', display: 'flex', justifyContent: "center"}}>
            <FormControl style={{minWidth: 200}} className={classes.formControl} aria-describedby="name-helper-text">
              <InputLabel htmlFor="name-helper">Label</InputLabel>
              <Input id="name-helper" value={name} onChange={(event) => this.handleOnChange(event)} fullWidth disabled={processing}/>
            </FormControl>
            <Button variant="fab" aria-label="Add" className={classes.button} onClick={() => this.handleOnClick()} disabled={processing}>
              <CloudUpload />
            </Button>
          </div>
        </div>
      );
    }
}

export default  withRouter(withStyles(styles)(SignupScreen));
