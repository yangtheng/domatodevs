import React, { Component } from 'react'
import { Router, Route, Redirect } from 'react-router-dom'
import { toggleShowNavBar } from '../actions/navBarActions'

import { connect } from 'react-redux'

import { ClipLoader } from 'react-spinners'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import NavSideBar from './NavSideBar'
import HomePage from './HomePage'
import PlannerPage from './PlannerPage'
import ReadPage from './read/ReadPage'
import BlogEditorPage from './read/editor/BlogEditorPage'
import NavBar from './NavBar'

import UserDashboardPage from './dashboard/UserDashboardPage'
import ConfirmWindow from './misc/ConfirmWindow'

import PasswordChanged from './Auth0/PasswordChanged'
import history from './Auth0/history'
import Lock from './Auth0/lock'

import GoogleCloudStorage from './Google/GoogleCloudStorage'
const GoogleCloudStorageInstance = new GoogleCloudStorage()
const lock = new Lock()

class App extends Component {
  render () {
    // var isAuthenticated = lock.isAuthenticated()
    return (
      <Router history={history}>
        <div style={{backgroundColor: '#FFFFFF'}}>
          <NavBar lock={lock} />

          {this.props.navBar.showNavBar &&
            <NavSideBar outsideClickIgnoreClass={'ignoreNavBarHamburger'} />
          }

          <div style={{width: '100%', marginTop: '52px'}}>
            <Route exact path='/' render={(props) => (
              <HomePage {...props} />
            )} />
            {/* <Route exact path='/' component={HomePage} /> */}
            <Route path='/passwordChanged' component={PasswordChanged} />

            {/* ERROR CASE ROUTE FOR /USER OR /USER/. LOGIC IN COMPONENT WILL DISPLAY ACCOUNT TAB INSTEAD. */}
            <Route exact path='/user' render={props => (
              <UserDashboardPage {...props} />
            )} />
            <Route exact path='/user/:tab' render={props => (
              lock.isAuthenticated()
                ? <UserDashboardPage {...props} />
                : <TriggerLockLoginPrompt {...props} />
            )} />

            {/* PLANNER WILL CONDITIONALLY RENDER COMPONENTS.  */}
            <Route path='/planner/:itineraryId' render={props => (
              lock.isAuthenticated()
                ? <PlannerPage {...props} />
                : <TriggerLockLoginPrompt {...props} />
            )} />

            <Route path='/blog/:blogId' component={ReadPage} />
            <Route path='/blogeditor/:blogId' component={BlogEditorPage} />

          </div>

          {this.props.showSpinner && (
            <div style={{position: 'fixed', top: '0', left: '0', height: '100vh', width: '100vw', backgroundColor: 'rgba(255, 255, 255, 0.5)', zIndex: '9999'}}>
              <div style={{position: 'fixed', top: 'calc(50% - 35px)', left: 'calc(50% - 35px)', height: '70px', width: '70px'}}>
                <ClipLoader
                  color={'#000000'}
                  size={70}
                  loading={this.props.showSpinner}
                />
              </div>
            </div>
          )}

          {this.props.confirmWindow.open && <ConfirmWindow />}
        </div>
      </Router>
    )
  }
}

class TriggerLockLoginPrompt extends Component {
  render () {
    let url = this.props.location.pathname
    lock.setRedirectUrlAfterLoggingIn(url)
    lock.login()
    return null
  }
}

const mapStateToProps = (state) => {
  return {
    showSpinner: state.showSpinner,
    userProfile: state.userProfile,
    confirmWindow: state.confirmWindow,
    navBar: state.navBar
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleShowNavBar: () => {
      dispatch(toggleShowNavBar())
    }
  }
}

export default DragDropContext(HTML5Backend)(connect(mapStateToProps, mapDispatchToProps)(App))
