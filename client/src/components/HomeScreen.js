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
    render() {
      const { classes } = this.props;
        return (
            <div style={{flexDirection: 'row', display: 'flex'}}>
              <Button variant="outlined" size="large" color="primary" className={classes.button}>
                Login
              </Button>
              <Button variant="outlined" size="large" color="primary" className={classes.button}>
                Signup
              </Button>



            </div>
        );
    }
}

export default withRouter(withStyles(styles)(HomeScreen));
