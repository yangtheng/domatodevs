import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import { connect } from 'react-redux'
import Radium, { Style } from 'radium'
import { retrieveCloudStorageToken } from '../../actions/cloudStorageActions'

import { createEventFormContainerStyle, createEventFormBoxShadow, createEventFormLeftPanelStyle, greyTintStyle, eventDescriptionStyle, eventDescContainerStyle, createEventFormRightPanelStyle, attachmentsStyle, bookingNotesContainerStyle } from '../../Styles/styles'

import TransportLocationSelection from '../location/TransportLocationSelection'

import DateTimePicker from '../eventFormComponents/DateTimePicker'
import BookingDetails from '../eventFormComponents/BookingDetails'
import LocationAlias from '../eventFormComponents/LocationAlias'
import Notes from '../eventFormComponents/Notes'
import Attachments from '../eventFormComponents/Attachments'
import SubmitCancelForm from '../eventFormComponents/SubmitCancelForm'

import { createLandTransport } from '../../apollo/landtransport'
import { changingLoadSequence } from '../../apollo/changingLoadSequence'
import { queryItinerary } from '../../apollo/itinerary'

import { removeAllAttachments } from '../../helpers/cloudStorage'
import countriesToCurrencyList from '../../helpers/countriesToCurrencyList'
import newEventLoadSeqAssignment from '../../helpers/newEventLoadSeqAssignment'
import latestTime from '../../helpers/latestTime'
import moment from 'moment'
import constructGooglePlaceDataObj from '../../helpers/location'

const defaultBackground = `${process.env.REACT_APP_CLOUD_PUBLIC_URI}landTransportDefaultBackground.jpg`

class CreateLandTransportForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ItineraryId: this.props.ItineraryId,
      startDay: this.props.day,
      endDay: this.props.day,
      departureGooglePlaceData: {},
      arrivalGooglePlaceData: {},
      departureLocationAlias: '',
      arrivalLocationAlias: '',
      notes: '',
      defaultTime: null, // 24 hr str 'HH:mm'
      // start and end time need to be unix
      startTime: null, // if setstate, will change to unix
      endTime: null, // if setstate, will change to unix
      cost: 0,
      currency: '',
      currencyList: [],
      bookedThrough: '',
      bookingConfirmation: '',
      attachments: [],
      backgroundImage: defaultBackground,
      // googlePlaceDetails is the unmodified google api response
      departureGooglePlaceDetails: null,
      arrivalGooglePlaceDetails: null,
      departureLocationDetails: {
        address: null,
        telephone: null,
        openingHours: null
      },
      arrivalLocationDetails: {
        address: null,
        telephone: null,
        openingHours: null
      }
    }
  }

  updateDayTime (field, value) {
    this.setState({
      [field]: value
    })
  }

  handleChange (e, field) {
    this.setState({
      [field]: e.target.value
    })
  }

  handleSubmit () {
    var bookingStatus = this.state.bookingConfirmation ? true : false

    var newLandTransport = {
      ItineraryId: parseInt(this.state.ItineraryId),
      departureLocationAlias: this.state.departureLocationAlias,
      arrivalLocationAlias: this.state.arrivalLocationAlias,
      startDay: typeof (this.state.startDay) === 'number' ? this.state.startDay : parseInt(this.state.startDay),
      endDay: typeof (this.state.endDay) === 'number' ? this.state.endDay : parseInt(this.state.endDay),
      startTime: this.state.startTime,
      endTime: this.state.endTime,
      currency: this.state.currency,
      cost: parseInt(this.state.cost),
      bookingStatus: bookingStatus,
      bookedThrough: this.state.bookedThrough,
      bookingConfirmation: this.state.bookingConfirmation,
      notes: this.state.notes,
      attachments: this.state.attachments,
      backgroundImage: this.state.backgroundImage
    }

    if (this.state.departureGooglePlaceData.placeId) {
      newLandTransport.departureGooglePlaceData = this.state.departureGooglePlaceData
    }
    if (this.state.arrivalGooglePlaceData.placeId) {
      newLandTransport.arrivalGooglePlaceData = this.state.arrivalGooglePlaceData
    }

    // console.log('newLandTransport', newLandTransport)
    var helperOutput = newEventLoadSeqAssignment(this.props.events, 'LandTransport', newLandTransport)
    console.log('helper output', helperOutput)

    this.props.changingLoadSequence({
      variables: {
        input: helperOutput.loadSequenceInput
      }
    })

    this.props.createLandTransport({
      variables: helperOutput.newEvent,
      refetchQueries: [{
        query: queryItinerary,
        variables: { id: this.props.ItineraryId }
      }]
    })

    this.resetState()
    this.props.toggleCreateEventType()
  }

  closeCreateLandTransport () {
    removeAllAttachments(this.state.attachments, this.apiToken)
    this.resetState()
    this.props.toggleCreateEventType()
  }

  resetState () {
    this.setState({
      startDay: this.props.startDay,
      endDay: this.props.endDay,
      departureGooglePlaceData: {},
      arrivalGooglePlaceData: {},
      departureLocationAlias: '',
      arrivalLocationAlias: '',
      notes: '',
      startTime: null, // should be Int
      endTime: null, // should be Int
      cost: 0,
      currency: this.state.currencyList[0],
      bookedThrough: '',
      bookingConfirmation: '',
      attachments: [],
      backgroundImage: defaultBackground,
      departureGooglePlaceDetails: null,
      arrivalGooglePlaceDetails: null
    })
    this.apiToken = null
  }

  // need to select either departure or arrival
  selectLocation (place, type) {
    var googlePlaceData = constructGooglePlaceDataObj(place)
    this.setState({[`${type}GooglePlaceData`]: googlePlaceData})
    this.setState({[`${type}GooglePlaceDetails`]: place})
  }

  handleFileUpload (attachmentInfo) {
    this.setState({attachments: this.state.attachments.concat([attachmentInfo])})
  }

  removeUpload (index) {
    var files = this.state.attachments
    var newFilesArr = (files.slice(0, index)).concat(files.slice(index + 1))

    this.setState({attachments: newFilesArr})
    this.setState({backgroundImage: defaultBackground})
  }

  setBackground (previewUrl) {
    previewUrl = previewUrl.replace(/ /gi, '%20')
    this.setState({backgroundImage: `${previewUrl}`})
  }

  componentDidMount () {
    this.props.retrieveCloudStorageToken()

    this.props.cloudStorageToken.then(obj => {
      this.apiToken = obj.token
    })

    var currencyList = countriesToCurrencyList(this.props.countries)
    this.setState({currencyList: currencyList})
    this.setState({currency: currencyList[0]})

    // find latest time for that day and assign to start/endTime
    var defaultUnix = latestTime(this.props.events, this.props.day)

    // time is at utc 0
    var defaultTime = moment.utc(defaultUnix * 1000).format('HH:mm')
    // datepicker take 'hh:mm' 24 hr format

    // set default time string that datepicker uses
    this.setState({defaultTime: defaultTime})

    // set default start and end unix for saving
    this.setState({startTime: defaultUnix, endTime: defaultUnix})
  }

  // componentDidUpdate (prevProps, prevState) {
  //   if (this.state.googlePlaceDetails) {
  //     if (prevState.googlePlaceDetails !== this.state.googlePlaceDetails || prevState.startDay !== this.state.startDay) {
  //       var locationDetails = {
  //         address: this.state.googlePlaceDetails.formatted_address,
  //         telephone: this.state.googlePlaceDetails.international_phone_number || this.state.googlePlaceDetails.formatted_phone_number
  //       }
  //       var dateUnix = this.props.dates[this.state.startDay - 1]
  //       var momentTime = moment.utc(dateUnix)
  //       var momentDayStr = momentTime.format('dddd')
  //       if (this.state.googlePlaceDetails.opening_hours && this.state.googlePlaceDetails.opening_hours.weekday_text) {
  //         var str = this.state.googlePlaceDetails.opening_hours.weekday_text.filter(e => {
  //           return e.indexOf(momentDayStr) > -1
  //         })
  //         locationDetails.openingHours = str
  //       }
  //       this.setState({locationDetails: locationDetails})
  //     }
  //   }
  //   // if location/day/time changed, validate opening hours
  // }

  render () {
    return (
      <div style={createEventFormContainerStyle}>

        {/* BOX SHADOW WRAPS LEFT AND RIGHT PANEL ONLY */}
        <div style={createEventFormBoxShadow}>

          {/* LEFT PANEL --- BACKGROUND, LOCATION, DATETIME */}
          <div style={createEventFormLeftPanelStyle(this.state.backgroundImage)}>
            <div style={greyTintStyle} />

            <div style={eventDescContainerStyle}>
              <TransportLocationSelection selectLocation={(place, type) => this.selectLocation(place, type)} departureLocation={this.state.departureGooglePlaceData} arrivalLocation={this.state.arrivalGooglePlaceData} dates={this.props.dates} startDay={this.state.startDay} endDay={this.state.endDay} departureGooglePlaceDetails={this.state.departureGooglePlaceDetails} arrivalGooglePlaceDetails={this.state.arrivalGooglePlaceDetails} />
            </div>

            {/* CONTINUE PASSING DATE AND DATESARR DOWN */}
            <DateTimePicker updateDayTime={(field, value) => this.updateDayTime(field, value)} dates={this.props.dates} date={this.props.date} startDay={this.state.startDay} endDay={this.state.endDay} defaultTime={this.state.defaultTime} />
          </div>

          {/* RIGHT PANEL --- SUBMIT/CANCEL, BOOKINGNOTES */}
          <div style={createEventFormRightPanelStyle()}>
            <div style={bookingNotesContainerStyle}>
              <SubmitCancelForm handleSubmit={() => this.handleSubmit()} closeCreateForm={() => this.closeCreateLandTransport()} />
              <h4 style={{fontSize: '24px'}}>Booking Details</h4>
              <BookingDetails handleChange={(e, field) => this.handleChange(e, field)} currency={this.state.currency} currencyList={this.state.currencyList} cost={this.state.cost} />
              <h4 style={{fontSize: '24px', marginTop: '50px'}}>
                  Additional Notes
              </h4>

              <LocationAlias handleChange={(e) => this.handleChange(e, 'departureLocationAlias')} placeholder={'Detailed Location (Departure)'} />

              <LocationAlias handleChange={(e) => this.handleChange(e, 'arrivalLocationAlias')} placeholder={'Detailed Location (Arrival)'} />

              <Notes handleChange={(e, field) => this.handleChange(e, field)} />
            </div>
          </div>
        </div>

        {/* BOTTOM PANEL --- ATTACHMENTS */}
        <div style={attachmentsStyle}>
          <Attachments handleFileUpload={(e) => this.handleFileUpload(e)} attachments={this.state.attachments} ItineraryId={this.state.ItineraryId} removeUpload={i => this.removeUpload(i)} setBackground={url => this.setBackground(url)} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    events: state.plannerActivities,
    cloudStorageToken: state.cloudStorageToken
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    retrieveCloudStorageToken: () => {
      dispatch(retrieveCloudStorageToken())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(compose(
  graphql(createLandTransport, {name: 'createLandTransport'}),
  graphql(changingLoadSequence, {name: 'changingLoadSequence'})
)(Radium(CreateLandTransportForm)))
