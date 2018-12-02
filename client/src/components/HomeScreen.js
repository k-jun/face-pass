// BlogFormReview shows users their form inputs for review
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  }
});

class HomeScreen extends Component {
    state = {file: null}

    render() {
      const { classes } = this.props;
        return (
          <div style={{flexDirection: 'row', display: 'flex', justifyContent: "space-around"}}>
            <a style={{fontSize: 20, borderBottom: 2}} href={"./login"}>
              Login
            </a>
            <a style={{fontSize: 20}} href={"./signup"}>
              Signup
            </a>
          </div>
        );
    }
}

export default withRouter(withStyles(styles)(HomeScreen));
