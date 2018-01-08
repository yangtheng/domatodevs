import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import { connect } from 'react-redux'
import moment from 'moment'
import Radium from 'radium'
import LocationSearch from '../location/LocationSearch'

import { constructGooglePlaceDataObj } from '../../helpers/location'
import checkStartAndEndTime from '../../helpers/checkStartAndEndTime'
import countriesToCurrencyList from '../../helpers/countriesToCurrencyList'
import newEventLoadSeqAssignment from '../../helpers/newEventLoadSeqAssignment'
import { activityIconStyle, createEventBoxStyle, intuitiveDropdownStyle } from '../../Styles/styles'

import { createActivity } from '../../apollo/activity'
import { changingLoadSequence } from '../../apollo/changingLoadSequence'
import { queryItinerary, updateItineraryDetails } from '../../apollo/itinerary'

const defaultBackground = `${process.env.REACT_APP_CLOUD_PUBLIC_URI}activityDefaultBackground.jpg`

class IntuitiveActivityInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      location: '',
      search: '',
      searching: false
    }
  }

  handleKeydown (e) {
    if (e.keyCode === 13) {
      this.handleSubmit()
    }
  }

  resetState () {
    this.setState({
      googlePlaceData: '',
      search: ''
    })
  }

  selectLocation (location) {
    this.setState({googlePlaceData: constructGooglePlaceDataObj(location)})
    console.log('selected location', location)
  }

  handleChange (e, field) {
    this.setState({
      [field]: e.target.value
    })
    console.log(e.target.value)
  }

  handleSubmit () {
    const validations = [
      {
        type: 'googlePlaceData',
        notification: 'locRequired'
      },
      {
        type: 'description',
        notification: 'descRequired'
      }
    ]
    let validated = false
    validations.forEach((validation) => {
      if (this.state[validation.type]) {
        this.setState({
          [validation.notification]: false
        })
        validated = true // Because only one of the two is required
      }
      if (!this.state[validation.type]) {
        this.setState({
          [validation.notification]: true
        })
      }
    })
    if (!validated) return

    var startUnix, endUnix
    if (this.state.startTime) {
      var startHours = this.state.startTime.split(':')[0]
      var startMins = this.state.startTime.split(':')[1]
      startUnix = (startHours * 60 * 60) + (startMins * 60)
    }
    if (this.state.endTime) {
      var endHours = this.state.endTime.split(':')[0]
      var endMins = this.state.endTime.split(':')[1]
      endUnix = (endHours * 60 * 60) + (endMins * 60)
    }

    const startDay = this.props.dates.map(date => date.getTime()).findIndex((e) => e === this.props.activityDate) + 1
    console.log(startDay);


    const newActivity = {
      ItineraryId: parseInt(this.props.itineraryId),
      startDay: startDay,
      endDay: endUnix < startUnix ? startDay + 1 : startDay,
      startTime: startUnix,
      endTime: endUnix,
      description: this.state.description,
      currency: this.state.currency,
      bookingStatus: false,
      backgroundImage: defaultBackground
    }

    if (this.state.googlePlaceData.placeId) {
      newActivity.googlePlaceData = this.state.googlePlaceData
    }

    // Assign Start/End Time based on previous/next event within that day.
    // unix 0 is taken to be falsy. check missing time using typeof !== number
    let startEndTimeOutput = newActivity
    if (!this.state.startTime && !this.state.endTime) {
      // add default time as all-day event here
      startEndTimeOutput = checkStartAndEndTime(this.props.events, newActivity, 'allDayEvent')
    } else if (!this.state.startTime) {
      startEndTimeOutput = checkStartAndEndTime(this.props.events, newActivity, 'startTimeMissing')
    } else if (!this.state.endTime) {
      startEndTimeOutput = checkStartAndEndTime(this.props.events, newActivity, 'endTimeMissing')
    }

    // TESTING LOAD SEQUENCE ASSIGNMENT (ASSUMING ALL START/END TIMES ARE PRESENT)
    var helperOutput = newEventLoadSeqAssignment(this.props.events, 'Activity', startEndTimeOutput)
    // console.log('helper output', helperOutput)

    this.props.changingLoadSequence({
      variables: {
        input: helperOutput.loadSequenceInput
      }
    })

    this.props.createActivity({
      variables: helperOutput.newEvent,
      refetchQueries: [{
        query: queryItinerary,
        variables: { id: this.props.itineraryId }
      }]
    })

    this.resetState()
    this.props.toggleIntuitiveInput()
  }

  componentDidMount () {
    const currencyList = countriesToCurrencyList(this.props.countries)
    this.setState({currency: currencyList[0]})
    console.log(this.props.activityDate, this.props.dates.map(date => date.getTime()))
  }

  render () {
    return (
      <div onKeyDown={(e) => this.handleKeydown(e)} tabIndex='0' style={{...createEventBoxStyle, ...{width: '100%', paddingBottom: '10px', top: '-1.5vh'}}}>
        <div style={{display: 'inline-block', width: '35%'}}>
          <i key='departure' className='material-icons' style={{...activityIconStyle, ...{cursor: 'default'}}}>directions_run</i>
          {this.state.descRequired && this.state.locRequired && <span style={{fontWeight: 'bold'}}>(Description or Location Required)</span>}
          <div>
            <input type='text' placeholder='Description' style={{width: '90%'}} onChange={(e) => this.handleChange(e, 'description')} />
          </div>
        </div>
        <div style={{display: 'inline-block', width: '35%'}}>
          <i key='departure' className='material-icons' style={{...activityIconStyle, ...{cursor: 'default'}}}>place</i>
          <LocationSearch intuitiveInput selectLocation={location => this.selectLocation(location)} placeholder={'Location'} currentLocation={this.state.googlePlaceData} />
        </div>
        <div style={{display: 'inline-block', width: '30%'}}>
          <i key='departure' className='material-icons' style={{...activityIconStyle, ...{cursor: 'default'}}}>watch_later</i>
          <div style={{position: 'relative'}}>
            <i key='more' onClick={() => this.props.handleCreateEventClick('Activity')} className='material-icons' style={{position: 'absolute', right: '14%', color: '#ed9fad', cursor: 'pointer'}}>more_horiz</i>
            <input type='time' style={{width: '40%'}} onChange={(e) => this.handleChange(e, 'startTime')} />
            <span>{' '}to{' '}</span>
            <input type='time' style={{width: '40%'}} onChange={(e) => this.handleChange(e, 'endTime')} />
          </div>
        </div>
        <div style={{marginTop: '5px'}}>
          <button onClick={() => this.handleSubmit()} style={{marginRight: '5px', backgroundColor: 'white', border: '1px solid #9FACBC'}}>Submit</button>
          <button onClick={() => this.props.toggleIntuitiveInput()} style={{backgroundColor: 'white', border: '1px solid #9FACBC'}}>Cancel</button>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    events: state.plannerActivities
  }
}

export default connect(mapStateToProps)(compose(
  graphql(createActivity, {name: 'createActivity'}),
  graphql(changingLoadSequence, {name: 'changingLoadSequence'}),
  graphql(updateItineraryDetails, {name: 'updateItineraryDetails'})
)(Radium(IntuitiveActivityInput)))