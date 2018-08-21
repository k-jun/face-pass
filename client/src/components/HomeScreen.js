// BlogFormReview shows users their form inputs for review
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  input: {
    display: 'none',
  },
});

class HomeScreen extends Component {
    state = {file: null}

    async componentDidMount () {
      // await webcam.setup();


    }

    render() {
      const { classes } = this.props;
        return (
            <div style={{flexDirection: 'row', display: 'flex', justifyContent: "space-around"}}>
              <Button variant="outlined" size="large" color="secondary" className={classes.button} href={"./login"}>
                Login
              </Button>
              <Button variant="outlined" size="large" color="default" className={classes.button} href={"./signup"}>
                Signup
              </Button>
            </div>
        );
    }
}

export default withRouter(withStyles(styles)(HomeScreen));
