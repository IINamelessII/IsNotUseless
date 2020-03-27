import React, {Component} from 'react';
import {connect} from 'react-redux';
// import {Redirect} from 'react-router-dom';

import * as actions from '../../store/actions/index';
import classes from './Auth.css';

class Auth extends Component {
  // state = {
  //   redirect: false,
  // }

  componentDidMount() {
    this.props.loadUserData();
  }

  onSignInClickHandler = () => {
    const wnd = window.open('/accounts/google/login/', 'Sign In', 'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=400,height=350');

    //TODO: move window close and client page reloading to the wnd handler instead of using interval
    const interval = setInterval(() => {
      try {
        if (wnd.location.pathname === '/') {
          console.log('SSS');
          wnd.close();
          clearInterval(interval);
        }
      } catch (error) {
      }
    }, 100)
  }

  render() {
    let auth = (
      <div className={classes.SignIn} onClick={this.onSignInClickHandler}>SIGN IN</div>
    );
    if (this.props.userData) {
      auth = (
        <div className={classes.Container}>
          <div className={classes.Name}>{this.props.userData.name}</div>
          <div className={classes.Photo}>
            <img src={this.props.userData.photo} alt="" />
          </div>
          <div className={classes.SignOut} onClick={this.props.logout}>SIGN OUT</div>
        </div>
      );
    }

    // let redirect = null;
    // if (this.state.redirect) {
    //   redirect = <Redirect to="/accounts/google/login/" />;
    // }
    // console.log(this.state.redirect);

    return (
      <div className={classes.Auth}>
        {auth}
        <a id="redirect" href="/accounts/google/login/" style={{display: 'none'}} />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    userData: state.auth.userData,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    login: () => dispatch(actions.login()),
    logout: () => dispatch(actions.logout()),
    loadUserData: () => dispatch(actions.loadUserData()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Auth);