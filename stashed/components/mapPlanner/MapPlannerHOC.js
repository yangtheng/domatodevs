import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { toggleDaysFilter, setCurrentlyFocusedEvent, clearCurrentlyFocusedEvent, setSearchMarkerArr, setSearchInputStr, setFocusedSearchMarker, clearFocusedSearchMarker } from '../../actions/mapPlannerActions'

import { withScriptjs, withGoogleMap, GoogleMap } from 'react-google-maps'
import SearchBox from 'react-google-maps/lib/components/places/SearchBox'
import CustomControl from '../location/CustomControl'
import InfoBox from 'react-google-maps/lib/components/addons/InfoBox'
import MarkerWithLabel from 'react-google-maps/lib/components/addons/MarkerWithLabel'

import MapCreateEventPopup from './MapCreateEventPopup'
import MapEditEventPopup from './MapEditEventPopup'

const _ = require('lodash')

const unclickedMarkerSize = {width: '40px', height: '40px'}
const clickedMarkerSize = {width: '60px', height: '60px'}

const clickedSearchMarkerStyle = {borderRadius: '50%', border: '3px solid red', boxShadow: '0 0 0 3px white', backgroundColor: 'red', cursor: 'pointer'}
const unclickedSearchMarkerStyle = {borderRadius: '50%', border: '3px solid red', backgroundColor: 'red', cursor: 'pointer'}
const clickedPlannerMarkerStyle = {borderRadius: '50%', border: '3px solid orange', boxShadow: '0 0 0 3px white', backgroundColor: 'orange'}
const unclickedPlannerMarkerStyle = {borderRadius: '50%', border: '3px solid orange', backgroundColor: 'orange'}

function stopPropagation (event) {
  return event.stopPropagation()
}

class Map extends Component {
  constructor (props) {
    super(props)
    this.state = {
      zoom: 2,
      bounds: null,
      center: {lat: 0, lng: 0},
      mapOptions: {
        minZoom: 2,
        maxZoom: 17,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        clickableIcons: false
      },
      allEvents: [], // entire this.props.events arr
      eventsArr: [], // manipulated arr to extract location
      plannerMarkers: [] // filtered planner markers. eg markers for days 1,2,5
    }
  }

  onBoundsChanged () {
    if (!this.map) return
    // if bounds dont change, zoom and center also wont change. dont rerender extra
    if (this.state.bounds === this.map.getBounds()) return
    // console.log('bounds changed (not same)')
    this.setState({
      bounds: this.map.getBounds(),
      center: {lat: this.map.getCenter().lat(), lng: this.map.getCenter().lng()},
      zoom: this.map.getZoom()
      // sync the zoom in state with map's actual zoom
    })
  }

  onPlacesChanged () {
    if (!this.searchBox) return

    // very hackish way but i got the query prediction out to set redux state.
    var secretSearchBox = this.searchBox.state.__SECRET_SEARCH_BOX_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    var secretPlaces = secretSearchBox.gm_accessors_.places
    var secretString = secretPlaces.Jc.formattedPrediction
    // sync redux search str with query prediction str
    this.props.setSearchInputStr(secretString)

    const places = this.searchBox.getPlaces()
    const bounds = new window.google.maps.LatLngBounds()
    // console.log('places', places)

    if (places.length === 0) {
      console.log('no results')
      return
    }

    places.forEach(place => {
      if (place.photos) {
        var imageUrl = place.photos[0].getUrl({maxWidth: 200})
        place.imageUrl = imageUrl
      }
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport)
      } else {
        bounds.extend(place.geometry.location)
      }
    })
    const nextMarkers = places.map(place => ({
      position: place.geometry.location,
      place: place
    }))
    const nextCenter = _.get(nextMarkers, '0.position', this.state.center)

    this.setState({
      center: nextCenter
    })

    // set redux state with markers arr, comprising of (place, position)
    this.props.setSearchMarkerArr(nextMarkers)

    this.map.fitBounds(bounds, 150)
  }

  onSearchStrChange (e) {
    this.props.setSearchInputStr(e.target.value)
  }

  clearSearch () {
    this.props.setSearchInputStr('')

    if (this.props.mapPlannerSearch.searchMarkerArr.length) {
      this.props.setSearchMarkerArr([])
      this.props.clearFocusedSearchMarker()
      if (this.state.plannerMarkers.length) {
        this.refitBounds(this.state.plannerMarkers, 'planner')
      }
    }
  }

  onSearchMarkerClicked (index) {
    // clear planner focusEvent if any
    this.props.clearCurrentlyFocusedEvent()

    // compare clicked marker vs focused marker place id. if same, clear focus. if different, set focus
    // marker ={place: {}, position: {}}
    var clickedMarker = this.props.searchMarkerArr[index]
    var clickedPlaceId = clickedMarker.place.place_id

    var reduxMarker = this.props.focusedSearchMarker
    var reduxPlaceId = _.get(reduxMarker, 'place.place_id', '')

    if (clickedPlaceId === reduxPlaceId) {
      this.props.clearFocusedSearchMarker()
    } else {
      this.props.clearFocusedSearchMarker() // force redraw on infobox
      this.props.setFocusedSearchMarker(clickedMarker)
    }
  }

  onInfoBoxDomReady () {
    var infobox = document.querySelector('#infobox')
    window.google.maps.event.addDomListener(infobox, 'dblclick', e => {
      stopPropagation(e)
    })
    // window.google.maps.event.addDomListener(infobox, 'mouseenter', e => {
    //   this.setState({
    //     mapOptions: {
    //       minZoom: 2,
    //       maxZoom: 17,
    //       fullscreenControl: false,
    //       mapTypeControl: false,
    //       streetViewControl: false,
    //       clickableIcons: false,
    //       gestureHandling: 'none'
    //     }
    //   })
    // })
    // window.google.maps.event.addDomListener(infobox, 'mouseleave', e => {
    //   this.setState({
    //     mapOptions: {
    //       minZoom: 2,
    //       maxZoom: 17,
    //       fullscreenControl: false,
    //       mapTypeControl: false,
    //       streetViewControl: false,
    //       clickableIcons: false,
    //       gestureHandling: 'cooperative'
    //     }
    //   })
    // })

    // window.google.maps.event.addDomListener(infobox, 'click', e => {
    //   console.log('clicked')
    // })
  }

  // CLOSE BOX BUT SEARCH MARKERS STILL MOUNTED
  closeSearchPopup () {
    this.props.clearFocusedSearchMarker()
  }

  // constructs obj structure. no marker position offseting
  constructEventsArrFromPropsEvents (propsEventsArr) {
    // extract locations to plot. eventsArrObj
    // modelId: id, eventType: str, flightInstanceId: id, day: int, start:bool, location: obj, row: eventType
    // modelId is FlightBookingId and eventType is Flight
    var eventsArr = propsEventsArr.map(e => {
      var temp = {
        modelId: e.modelId,
        eventType: e.type,
        // flightInstanceId is extra differentiator because modelId=FlightBookingId, eventType=Flight refers to multiple rows/markers.
        flightInstanceId: e.type === 'Flight' ? e.Flight.FlightInstance.id : null,
        day: e.day,
        loadSequence: e.loadSequence,
        start: e.start,
        event: e[`${e.type}`] // Activity/Flight etc
      }
      let location
      if (e.type === 'Activity' || e.type === 'Food' || e.type === 'Lodging') {
        location = e[`${e.type}`].location
      } else if (e.type === 'LandTransport' || e.type === 'SeaTransport' || e.type === 'Train') {
        if (e.start) {
          location = e[`${e.type}`].departureLocation
        } else {
          location = e[`${e.type}`].arrivalLocation
        }
      } else if (e.type === 'Flight') {
        if (e.start) {
          location = e.Flight.FlightInstance.departureLocation
        } else {
          location = e.Flight.FlightInstance.arrivalLocation
        }
      }
      temp.location = location
      temp.imageUrl = location.imageUrl
      return temp
    })
    return eventsArr
  }

  componentDidMount () {
    var eventsArr = this.constructEventsArrFromPropsEvents(this.props.events)
    // console.log('eventsArr before marker offset', eventsArr)

    var comparisonArr = []
    var finalEventsArr = eventsArr.map(event => {
      var position = {latitude: event.location.latitude, longitude: event.location.longitude}

      // use lodash check uniqueness of positions
      var positionMatch = _.find(comparisonArr, function (e) {
        return (e.latitude === position.latitude && e.longitude === position.longitude)
      })

      if (!positionMatch) {
        comparisonArr.push(position)
        event.displayPosition = position
      } else {
        var offsetPosition = {
          latitude: position.latitude + 0.0001 * Math.floor(Math.random() * (5 - (-5)) + (-5)),
          longitude: position.longitude + 0.0001 * Math.floor(Math.random() * (5 - (-5)) + (-5))
        }
        comparisonArr.push(offsetPosition)
        event.displayPosition = offsetPosition
      }
      return event
    })
    // console.log('final events arr', finalEventsArr)

    this.setState({
      allEvents: this.props.events,
      eventsArr: finalEventsArr
    }, () => {
      this.applyDaysFilter(this.props.daysFilterArr)
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.daysFilterArr !== this.props.daysFilterArr) {
      this.applyDaysFilter(nextProps.daysFilterArr)
    } // close daysFilterArr
    if (nextProps.events !== this.props.events) {
      // console.log('events arr changed', nextProps.events)
      var stillDragging = _.find(nextProps.events, function (e) {
        return (e.fromReducer)
      })
      if (!stillDragging) {
        // console.log('nextProps', nextProps.events)
        var eventsArr = this.constructEventsArrFromPropsEvents(nextProps.events)

        var comparisonArr = []
        var finalEventsArr = eventsArr.map(event => {
          var position = {latitude: event.location.latitude, longitude: event.location.longitude}

          // use lodash check uniqueness of positions
          var positionMatch = _.find(comparisonArr, function (e) {
            return (e.latitude === position.latitude && e.longitude === position.longitude)
          })

          if (!positionMatch) {
            comparisonArr.push(position)
            event.displayPosition = position
          } else {
            var offsetPosition = {
              latitude: position.latitude + 0.0001 * Math.floor(Math.random() * (5 - (-5)) + (-5)),
              longitude: position.longitude + 0.0001 * Math.floor(Math.random() * (5 - (-5)) + (-5))
            }
            comparisonArr.push(offsetPosition)
            event.displayPosition = offsetPosition
          }
          return event
        })
        // console.log('AFTER ASSIGNING DISPLAY POSITION', finalEventsArr)

        this.setState({
          allEvents: nextProps.events,
          eventsArr: finalEventsArr
        }, () => {
          this.applyDaysFilter(nextProps.daysFilterArr)
        })
      }
    } //  close events

    // if receiving redux props (searchCreateEventForm success)
  }

  applyDaysFilter (daysFilterArr) {
    var plannerMarkers = this.state.eventsArr.filter(e => {
      return daysFilterArr.includes(e.day)
    })
    this.setState({
      plannerMarkers: plannerMarkers
    }, () => {
      if (!plannerMarkers.length && this.props.searchMarkerArr.length) {
        this.refitBounds(this.props.searchMarkerArr, 'search')
      } else {
        this.refitBounds(this.state.plannerMarkers, 'planner')
      }
    })
  }

  changeDayCheckbox (e) {
    var clickedDay = parseInt(e.target.value)
    // console.log('clicked checkbox day', clickedDay)

    // if unchecking a day, and focusEvent is inside. clear the focusevent.
    if (this.props.currentlyFocusedEvent.day === clickedDay) {
      this.props.clearCurrentlyFocusedEvent()
    }

    this.props.toggleDaysFilter(clickedDay)
  }

  // refitBounds only takes 1 type
  refitBounds (markerArr, type) {
    if (!markerArr.length) return

    if (type === 'planner') {
      var newBounds = new window.google.maps.LatLngBounds()
      markerArr.forEach(marker => {
        newBounds.extend({lat: marker.location.latitude, lng: marker.location.longitude})
      })
    } else if (type === 'search') {
      newBounds = new window.google.maps.LatLngBounds()
      this.props.searchMarkerArr.forEach(marker => {
        newBounds.extend({lat: marker.position.lat(), lng: marker.position.lng()})
      })
    }
    this.map.fitBounds(newBounds, 150)

    if (this.props.currentlyFocusedEvent.modelId) {
      // find clicked marker and construct latlng literal
      var focus = this.props.currentlyFocusedEvent
      var currentlyFocusedMarker = _.find(this.state.plannerMarkers, function (e) {
        return (
          e.modelId === focus.modelId &&
          e.eventType === focus.eventType &&
          e.day === focus.day &&
          e.start === focus.start &&
          e.loadSequence === focus.loadSequence &&
          e.flightInstanceId === focus.flightInstanceId
        )
      })
      var markerLatLngLiteral = {lat: currentlyFocusedMarker.displayPosition.latitude, lng: currentlyFocusedMarker.displayPosition.longitude}

      if (type === 'planner') {
        this.fitBoundsForInfoBox(markerLatLngLiteral, this.state.plannerMarkers)
      }
    }

    if (this.props.mapPlannerSearch.focusedSearchMarker) {
      var searchMarkerPosition = this.props.mapPlannerSearch.focusedSearchMarker.position
      // console.log('search marker posiiton', searchMarkerPosition)
      markerLatLngLiteral = {lat: searchMarkerPosition.lat(), lng: searchMarkerPosition.lng()}
      if (type === 'search') {
        this.fitBoundsForInfoBox(markerLatLngLiteral, this.props.searchMarkerArr)
      }
    }
  }

  focusSearchMarkers () {
    this.refitBounds(this.props.searchMarkerArr, 'search')
  }

  focusPlannerMarkers () {
    this.refitBounds(this.state.plannerMarkers, 'planner')
  }

  fitBothSearchPlannerMarkers () {
    var newBounds = new window.google.maps.LatLngBounds()
    this.props.searchMarkerArr.forEach(marker => {
      newBounds.extend({lat: marker.position.lat(), lng: marker.position.lng()})
    })
    this.state.plannerMarkers.forEach(marker => {
      newBounds.extend({lat: marker.location.latitude, lng: marker.location.longitude})
    })
    this.map.fitBounds(newBounds, 150)

    if (this.props.currentlyFocusedEvent.modelId) {
      // console.log('reset focus planner marker')
      var currentlyFocusedEvent = this.props.currentlyFocusedEvent
      // this.props.clearCurrentlyFocusedEvent()
      this.props.setCurrentlyFocusedEvent(currentlyFocusedEvent)

      var focus = this.props.currentlyFocusedEvent
      var currentlyFocusedMarker = _.find(this.state.plannerMarkers, function (e) {
        return (
          e.modelId === focus.modelId &&
          e.eventType === focus.eventType &&
          e.day === focus.day &&
          e.start === focus.start &&
          e.loadSequence === focus.loadSequence &&
          e.flightInstanceId === focus.flightInstanceId
        )
      })

      var markerLatLngLiteral = {lat: currentlyFocusedMarker.displayPosition.latitude, lng: currentlyFocusedMarker.displayPosition.longitude}

      this.fitBoundsForInfoBox(markerLatLngLiteral, this.state.plannerMarkers.concat(this.props.mapPlannerSearch.ssearchMarkerArr))
    }

    if (this.props.mapPlannerSearch.focusedSearchMarker) {
      // console.log('reset focus search marker')
      var focusedSearchMarker = this.props.mapPlannerSearch.focusedSearchMarker
      // this.props.clearFocusedSearchMarker()
      this.props.setFocusedSearchMarker(focusedSearchMarker)

      var searchMarkerPosition = this.props.mapPlannerSearch.focusedSearchMarker.position
      // console.log('search marker posiiton', searchMarkerPosition)
      markerLatLngLiteral = {lat: searchMarkerPosition.lat(), lng: searchMarkerPosition.lng()}
      this.fitBoundsForInfoBox(markerLatLngLiteral, this.props.searchMarkerArr.concat(this.state.plannerMarkers))
    }
  }

  onPlannerMarkerClicked (index) {
    // clear clicked state in search
    this.props.clearFocusedSearchMarker()

    var marker = this.state.plannerMarkers[index]

    // check if clicked marker is already the currentlyFocusedEvent
    var clickedPlannerMarkerEventObj = {
      modelId: marker.modelId,
      eventType: marker.eventType,
      flightInstanceId: marker.flightInstanceId,
      day: marker.day,
      start: marker.start,
      loadSequence: marker.loadSequence
    }

    var isIdentical = _.isEqual(clickedPlannerMarkerEventObj, this.props.currentlyFocusedEvent)

    if (isIdentical) {
      this.props.clearCurrentlyFocusedEvent()
    } else {
      // clear focus event and reset to trigger infobox redraw
      // this.props.clearCurrentlyFocusedEvent()
      this.props.setCurrentlyFocusedEvent(clickedPlannerMarkerEventObj)

      var latlng = {lat: marker.displayPosition.latitude, lng: marker.displayPosition.longitude}
      this.fitBoundsForInfoBox(latlng, this.state.plannerMarkers)
    }
  }

  // markerLatLngLiteral = {lat: xx, lng: xx}
  fitBoundsForInfoBox (markerLatLngLiteral, markerArrForBounds) {
    var currentBounds = this.map.getBounds()
    var boundsNE = currentBounds.getNorthEast()
    var boundsSW = currentBounds.getSouthWest()
    var projection = this.map.getProjection()
    var mercatorNE = projection.fromLatLngToPoint(boundsNE)
    var mercatorSW = projection.fromLatLngToPoint(boundsSW)
    var mapHeightMercator = mercatorSW.y - mercatorNE.y
    if (mercatorNE.x < mercatorSW.x) {
      // find dist from mercator 256 line
      var mapWidthMercator = (mercatorNE.x) + (256 - mercatorSW.x)
    } else {
      mapWidthMercator = mercatorNE.x - mercatorSW.x
    }
    // console.log('height', mapHeightMercator, 'width', mapWidthMercator)
    var mapWidthPixels = 1920 / 2

    var mapHeightPixels = window.innerHeight - 60

    var pixelToMercatorScaleX = mapWidthMercator / mapWidthPixels
    var pixelToMercatorScaleY = mapHeightMercator / mapHeightPixels

    // find marker lat lng (search marker or planner marker)
    var markerMercator = projection.fromLatLngToPoint(new window.google.maps.LatLng(markerLatLngLiteral))
    var markerMercatorX = markerMercator.x
    var markerMercatorY = markerMercator.y

    var infoboxLeftEdgeX = markerMercatorX - (225 * pixelToMercatorScaleX)
    var infoboxRightEdgeX = markerMercatorX + (225 * pixelToMercatorScaleX)
    var infoboxBottomEdgeY = markerMercatorY + (140 + 60 + 30 + 30) * pixelToMercatorScaleY

    var infoboxBottomLeftCornerMercator = new window.google.maps.Point(infoboxLeftEdgeX, infoboxBottomEdgeY)
    var infoboxBottomRightCornerMercator = new window.google.maps.Point(infoboxRightEdgeX, infoboxBottomEdgeY)

    var bottomLeftLatLng = projection.fromPointToLatLng(infoboxBottomLeftCornerMercator)
    var bottomRightLatLng = projection.fromPointToLatLng(infoboxBottomRightCornerMercator)

    var isLeftEdgeInBounds = ((infoboxLeftEdgeX > mercatorSW.x) && (infoboxLeftEdgeX < mercatorNE.x))
    var isRightEdgeInBounds = ((infoboxRightEdgeX > mercatorSW.x) && (infoboxRightEdgeX < mercatorNE.x))
    var isBottomEdgeInBounds = (infoboxBottomEdgeY < mercatorSW.y)

    console.log('is left, right, bottom edges within bounds?', isLeftEdgeInBounds, isRightEdgeInBounds, isBottomEdgeInBounds)

    if (!isLeftEdgeInBounds || !isRightEdgeInBounds || !isBottomEdgeInBounds) {
      var newBounds = new window.google.maps.LatLngBounds()
      // recalc all bounds (fitted to markerArr provided)
      markerArrForBounds.forEach(marker => {
        if (marker.location) {
          newBounds.extend({lat: marker.location.latitude, lng: marker.location.longitude})
        } else if (marker.position) {
          newBounds.extend({lat: marker.position.lat(), lng: marker.position.lng()})
        }
      })
      newBounds.extend(bottomLeftLatLng)
      newBounds.extend(bottomRightLatLng)
      this.map.fitBounds(newBounds)
    }
  }

  render () {
    if (this.props.currentlyFocusedEvent) {
      var focus = this.props.currentlyFocusedEvent
      var currentlyFocusedMarker = _.find(this.state.plannerMarkers, function (e) {
        return (
          e.modelId === focus.modelId &&
          e.eventType === focus.eventType &&
          e.day === focus.day &&
          e.start === focus.start &&
          e.loadSequence === focus.loadSequence &&
          e.flightInstanceId === focus.flightInstanceId
        )
      })
      // console.log('currentlyFocusedMarker', currentlyFocusedMarker)
    }
    return (
      <GoogleMap ref={node => { this.map = node }} center={this.state.center} zoom={this.state.zoom} onBoundsChanged={() => this.onBoundsChanged()} options={this.state.mapOptions}>
        {/* CLOSE MAP */}
        <CustomControl controlPosition={window.google.maps.ControlPosition.RIGHT_TOP}>
          <button onClick={() => this.props.returnToPlanner()} style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', height: '30px', marginTop: '10px', marginRight: '10px'}}>X</button>
        </CustomControl>

        {/* FILTERS */}
        <CustomControl controlPosition={window.google.maps.ControlPosition.LEFT_TOP}>
          <div style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', width: '150px', marginTop: '10px', marginLeft: '10px', padding: `12px`, background: 'white'}} >
            {this.props.daysArr.map((day, i) => {
              return (
                <label style={{display: 'block', fontSize: '18px'}} key={`day${i}`}>
                  <input type='checkbox' style={{width: '20px', height: '20px'}} checked={this.props.daysFilterArr.includes(day)} onChange={(e) => this.changeDayCheckbox(e)} value={day} />
                  Day {day}
                </label>
              )
            })}
            <hr style={{margin: '5px'}} />
            <label style={{display: 'block', fontSize: '18px'}}>
              <input type='checkbox' style={{width: '20px', height: '20px'}} />
              Bucket
            </label>
          </div>
        </CustomControl>

        {/* REFITBOUNDS TOGGLE BWTN SEARCH/PLANNER/ALL. HOW TO DEAL WITH BUCKET!!! */}
        {this.state.plannerMarkers.length && this.props.searchMarkerArr.length &&
          <CustomControl controlPosition={window.google.maps.ControlPosition.RIGHT_BOTTOM}>
            <div style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', width: '100px', marginTop: '10px', marginRight: '10px', background: 'white'}}>
              <button style={{display: 'block', width: '100%'}} onClick={() => this.focusSearchMarkers()}>Focus search</button>
              <button style={{display: 'block', width: '100%'}} onClick={() => this.focusPlannerMarkers()}>Focus planner</button>
              <button style={{display: 'block', width: '100%'}} onClick={() => this.fitBothSearchPlannerMarkers()}>Fit all</button>
            </div>
          </CustomControl>
        }

        <SearchBox ref={node => { this.searchBox = node }} bounds={this.state.bounds} controlPosition={window.google.maps.ControlPosition.TOP_LEFT} onPlacesChanged={() => this.onPlacesChanged()}>
          <div>
            <input ref={node => { this.searchInput = node }} onChange={(e) => this.onSearchStrChange(e)} value={this.props.mapPlannerSearch.searchInputStr} type='text' placeholder='Search for location' style={{boxSizing: `border-box`, border: `1px solid transparent`, width: `300px`, height: `30px`, marginTop: `10px`, marginLeft: '10px', padding: `0 12px`, borderRadius: `3px`, boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: `none`, textOverflow: `ellipses`}} />
            <button onClick={() => this.clearSearch()} style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', height: '30px', marginLeft: '10px'}}>Clear</button>
          </div>
        </SearchBox>

        {/* markers come from redux state. check if clicked or not */}
        {this.props.searchMarkerArr.map((marker, index) => {
          var markerPlaceId = _.get(marker, 'place.place_id')
          var reduxPlaceId = _.get(this.props.focusedSearchMarker, 'place.place_id', '')
          var isCorrectSearchFocus = (markerPlaceId === reduxPlaceId)
          return <MarkerWithLabel ref={node => { this.searchMarker = node }} key={index} position={marker.position} opacity={0} labelAnchor={isCorrectSearchFocus ? new window.google.maps.Point(30, 30) : new window.google.maps.Point(20, 20)} labelStyle={isCorrectSearchFocus ? clickedSearchMarkerStyle : unclickedSearchMarkerStyle} zIndex={isCorrectSearchFocus ? 2 : 1} onClick={() => this.onSearchMarkerClicked(index)}>
            <div style={isCorrectSearchFocus ? clickedMarkerSize : unclickedMarkerSize}>
              {marker.place.imageUrl &&
                <img width='100%' height='100%' src={marker.place.imageUrl} />
              }
              {!marker.place.imageUrl &&
                <div style={{width: '100%', height: '100%', background: 'white'}} />
              }
            </div>
          </MarkerWithLabel>
        })}

        {this.props.focusedSearchMarker &&
          <InfoBox ref={node => { this.infoBox = node }} position={this.props.focusedSearchMarker.position} options={{ disableAutoPan: true, closeBoxURL: ``, enableEventPropagation: true, boxStyle: {width: '450px', height: '280px', background: 'white', padding: '10px', boxShadow: '0px 2px 5px 2px rgba(0, 0, 0, .2)', overflow: 'visible'}, pixelOffset: new window.google.maps.Size(-225, 60), infoBoxClearance: new window.google.maps.Size(170, 170) }} onDomReady={() => this.onInfoBoxDomReady()}>
            <div id='infobox'>
              <div style={{position: 'absolute', right: '0', top: '0', padding: '5px'}}>
                <i className='material-icons'>location_on</i>
                <i className='material-icons'>delete</i>
              </div>
              <MapCreateEventPopup ItineraryId={this.props.ItineraryId} events={this.props.events} mapEventsArr={this.state.eventsArr} plannerMarkers={this.state.plannerMarkers} daysFilterArr={this.props.daysFilterArr} placeId={this.props.focusedSearchMarker.place.place_id} daysArr={this.props.daysArr} datesArr={this.props.datesArr} closeSearchPopup={() => this.closeSearchPopup()} />
            </div>
          </InfoBox>
        }

        {this.state.plannerMarkers.map((event, index) => {
          var currentlyFocusedEvent = this.props.currentlyFocusedEvent
          var isCurrentlyFocusedEvent = (event.modelId === currentlyFocusedEvent.modelId && event.eventType === currentlyFocusedEvent.eventType && event.day === currentlyFocusedEvent.day && event.start === currentlyFocusedEvent.start && event.loadSequence === currentlyFocusedEvent.loadSequence && event.flightInstanceId === currentlyFocusedEvent.flightInstanceId)
          return (
            <MarkerWithLabel key={index} position={{lat: event.displayPosition.latitude, lng: event.displayPosition.longitude}} opacity={0} labelAnchor={isCurrentlyFocusedEvent ? new window.google.maps.Point(30, 30) : new window.google.maps.Point(20, 20)} labelStyle={isCurrentlyFocusedEvent ? clickedPlannerMarkerStyle : unclickedPlannerMarkerStyle} onClick={() => this.onPlannerMarkerClicked(index)} zIndex={isCurrentlyFocusedEvent ? 2 : 1}>
              <div>
                <div style={isCurrentlyFocusedEvent ? clickedMarkerSize : unclickedMarkerSize}>
                  {event.imageUrl &&
                    <img width='100%' height='100%' src={event.imageUrl} />
                  }
                  {!event.imageUrl &&
                    <div style={{width: '100%', height: '100%', background: 'white'}} />
                  }
                </div>
              </div>
            </MarkerWithLabel>
          )
        })}

        {/* currentlyFocusedEvent only holds modelId etc. currentlyFocusedMarker is the entire plannerMarker obj matching the currentlyFocusedEvent (has displayPosition) */}
        {currentlyFocusedMarker &&
          <InfoBox ref={node => { this.infoBox = node }} position={new window.google.maps.LatLng(currentlyFocusedMarker.displayPosition.latitude, currentlyFocusedMarker.displayPosition.longitude)} options={{ disableAutoPan: true, closeBoxURL: ``, enableEventPropagation: true, boxStyle: {width: '450px', height: '280px', position: 'relative', background: 'white', padding: '10px', overflow: 'visible'}, pixelOffset: new window.google.maps.Size(-225, 60), infoBoxClearance: new window.google.maps.Size(170, 170) }} onDomReady={() => this.onInfoBoxDomReady()}>
            <div id='infobox'>
              <div style={{position: 'absolute', right: '0', top: '0', padding: '5px'}}>
                <i className='material-icons'>location_on</i>
                <i className='material-icons'>delete</i>
              </div>
              <MapEditEventPopup ItineraryId={this.props.ItineraryId} marker={currentlyFocusedMarker} daysArr={this.props.daysArr} datesArr={this.props.datesArr} events={this.props.events} daysFilterArr={this.props.daysFilterArr} plannerMarkers={this.state.plannerMarkers} />
            </div>
          </InfoBox>
        }

        {/* MARKER ONLY FOR SEARCH POPUP TRANSPORT ARRIVAL LOCATION */}
        {/* <MarkerWithLabel /> */}
      </GoogleMap>
    )
  }
}

const MapPlanner = withScriptjs(withGoogleMap(Map))

class MapPlannerHOC extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  returnToPlanner () {
    var itineraryId = this.props.match.params.itineraryId
    this.props.history.push(`/planner/${itineraryId}`)
  }

  render () {
    return (
      <MapPlanner ItineraryId={this.props.ItineraryId} daysArr={this.props.daysArr} datesArr={this.props.datesArr} events={this.props.events} mapPlannerSearch={this.props.mapPlannerSearch} setSearchInputStr={(str) => this.props.setSearchInputStr(str)} setSearchMarkerArr={(arr) => this.props.setSearchMarkerArr(arr)} setFocusedSearchMarker={(marker) => this.props.setFocusedSearchMarker(marker)} clearFocusedSearchMarker={() => this.props.clearFocusedSearchMarker()} searchMarkerArr={this.props.mapPlannerSearch.searchMarkerArr} focusedSearchMarker={this.props.mapPlannerSearch.focusedSearchMarker} daysFilterArr={this.props.mapPlannerDaysFilterArr} currentlyFocusedEvent={this.props.currentlyFocusedEvent} toggleDaysFilter={dayInt => this.props.toggleDaysFilter(dayInt)} setCurrentlyFocusedEvent={currentEventObj => this.props.setCurrentlyFocusedEvent(currentEventObj)} clearCurrentlyFocusedEvent={() => this.props.clearCurrentlyFocusedEvent()} returnToPlanner={() => this.returnToPlanner()} googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&v=3.31&libraries=geometry,drawing,places`} loadingElement={<div style={{ height: `100%` }} />} containerElement={<div style={{ height: `100%` }} />} mapElement={<div style={{ height: `100%` }} />} />
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleDaysFilter: (dayInt) => {
      dispatch(toggleDaysFilter(dayInt))
    },
    setCurrentlyFocusedEvent: (currentEventObj) => {
      dispatch(setCurrentlyFocusedEvent(currentEventObj))
    },
    clearCurrentlyFocusedEvent: () => {
      dispatch(clearCurrentlyFocusedEvent())
    },
    setSearchInputStr: (str) => {
      dispatch(setSearchInputStr(str))
    },
    setSearchMarkerArr: (arr) => {
      dispatch(setSearchMarkerArr(arr))
    },
    setFocusedSearchMarker: (marker) => {
      dispatch(setFocusedSearchMarker(marker))
    },
    clearFocusedSearchMarker: () => {
      dispatch(clearFocusedSearchMarker())
    }
  }
}

const mapStateToProps = (state) => {
  return {
    mapPlannerDaysFilterArr: state.mapPlannerDaysFilterArr,
    currentlyFocusedEvent: state.currentlyFocusedEvent,
    mapPlannerSearch: state.mapPlannerSearch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(MapPlannerHOC))
