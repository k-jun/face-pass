import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from './components/HomeScreen'
import Login from './components/LoginScreen'
import Signup from './components/SignupScreen'

class App extends Component {
  render() {
    return (
      <div className="App">
          <BrowserRouter>
              <div>
                  <Switch>
                      <Route path="/login" component={Login} />
                      <Route path="/signup" component={Signup} />
                      <Route path="/" component={Home} />
                  </Switch>
              </div>
          </BrowserRouter>

      </div>
    );
  }
}

export default App;
