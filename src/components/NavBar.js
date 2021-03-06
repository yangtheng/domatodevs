import { Link } from 'react-router-dom'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Radium from 'radium'
import { toggleShowNavBar } from '../actions/navBarActions'

import { NavBarStyles as styles } from '../Styles/NavBarStyles'

class NavBar extends Component {
  render () {
    var userProfile = this.props.userProfile
    var isLoggedIn = userProfile.id ? true : false
    if (isLoggedIn) {
      var profilePic = userProfile.profilePic
      console.log('isLoggedIn')
    }

    return (
      <div style={styles.navBarContainer}>
        <div style={styles.alignLeftContainer}>
          {isLoggedIn &&
            <i className='material-icons ignoreNavBarHamburger' style={styles.hamburgerIcon} onClick={() => this.props.toggleShowNavBar()}>menu</i>
          }
          <Link to={'/'} >
            <img src={`${process.env.PUBLIC_URL}/img/marcoLogo.png`} style={styles.marcoLogo} />
          </Link>
          <input type='text' placeholder={'Search'} style={styles.searchInputField} />
          <div style={styles.searchIconContainer}>
            <i className='material-icons' style={styles.searchIcon}>search</i>
          </div>
        </div>
        <div style={styles.alignRightContainer}>
          {isLoggedIn &&
            <React.Fragment>
              <span onClick={() => this.props.lock.logout()} style={styles.logInlogOutText}>Log out</span>
              <Link to={'/user/itineraries'}>
                <img src={profilePic} style={styles.profilePic} />
              </Link>
            </React.Fragment>
          }
          {!isLoggedIn &&
            <span onClick={() => this.props.lock.login()} style={styles.logInlogOutText}>Log In / Sign Up</span>
          }
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    userProfile: state.userProfile
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleShowNavBar: () => {
      dispatch(toggleShowNavBar())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Radium(NavBar))
