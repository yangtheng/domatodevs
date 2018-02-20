import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow } from 'react-google-maps'
import SearchBox from 'react-google-maps/lib/components/places/SearchBox'
import CustomControl from '../location/CustomControl'
import InfoBox from 'react-google-maps/lib/components/addons/InfoBox'

import MapCreateEventPopup from './MapCreateEventPopup'

const _ = require('lodash')

class Map extends Component {
  constructor (props) {
    super(props)
    this.state = {
      zoom: 2,
      bounds: null,
      center: {lat: 0, lng: 0},
      mapOptions: {
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        draggable: true,
        scrollwheel: true
      },
      searchMarkers: [],
      isInfoBoxOpen: false,
      searchPlannerBucket: '', // search, planner or bucket
      eventType: '', // activity, food, lodging, transport
      currentlyClicked: null,
      currentlyClickedIndex: null
    }
  }

  onBoundsChanged () {
    if (!this.map) return
    this.setState({
      bounds: this.map.getBounds(),
      center: {lat: this.map.getCenter().lat(), lng: this.map.getCenter().lng()}
    })
  }

  onPlacesChanged () {
    // called only by search box
    if (!this.searchBox) return
    const places = this.searchBox.getPlaces()
    const bounds = new window.google.maps.LatLngBounds()

    places.forEach(place => {
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
      center: nextCenter,
      searchMarkers: nextMarkers
    })
    this.map.fitBounds(bounds)
  }

  // CLOSING INFOBOX SETS SEARCHPLANNERBUCKET TO ''. MARKER DOESNT GET CLEARED
  clearSearch () {
    this.searchInput.value = ''
    if (this.state.searchMarkers.length) {
      this.setState({
        searchMarkers: [],
        isInfoBoxOpen: false,
        searchPlannerBucket: '',
        currentlyClicked: null,
        currentlyClickedIndex: null
      })
    }
  }

  onSearchMarkerClicked (index) {
    var marker = this.state.searchMarkers[index]
    // console.log('marker', marker)
    this.map.panTo(marker.position)
    this.setState({center: marker.position})

    if (this.state.searchMarkers.length && index !== this.state.currentlyClickedIndex) {
      this.setState({
        isInfoBoxOpen: true,
        searchPlannerBucket: 'search',
        currentlyClicked: marker,
        currentlyClickedIndex: index,
        eventType: 'activity'
      })
    } else {
      this.setState({
        isInfoBoxOpen: false,
        searchPlannerBucket: '',
        currentlyClicked: null,
        currentlyClickedIndex: null,
        eventType: ''
      })
    }
  }

  onInfoBoxDomReady () {
    function stopPropagation (event) {
      return event.stopPropagation()
    }
    var infobox = document.querySelector('#infobox')
    window.google.maps.event.addDomListener(infobox, 'dblclick', e => {
      stopPropagation(e)
    })
    window.google.maps.event.addDomListener(infobox, 'mouseenter', e => {
      this.setState({
        mapOptions: {
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          draggable: false,
          scrollwheel: false
        }
      })
    })
    window.google.maps.event.addDomListener(infobox, 'mouseleave', e => {
      this.setState({
        mapOptions: {
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          draggable: true,
          scrollwheel: true
        }
      })
    })
  }

  // CLOSE BOX BUT SEARCH IS STILL TRUE (MARKERS ARE PRESENT)
  closeInfoBox () {
    this.setState({isInfoBoxOpen: false, currentlyClicked: null, currentlyClickedIndex: null, eventType: ''})
  }

  changeEventType (type) {
    this.setState({eventType: type})
  }

  render () {
    return (
      <GoogleMap ref={node => { this.map = node }}
        center={this.state.center}
        zoom={this.state.zoom} onBoundsChanged={() => this.onBoundsChanged()}
        options={this.state.mapOptions}
      >
        {/* CLOSE MAP */}
        <CustomControl controlPosition={window.google.maps.ControlPosition.RIGHT_TOP}>
          <button onClick={() => this.props.returnToPlanner()} style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', height: '30px', marginTop: '10px', marginRight: '10px'}}>X</button>
        </CustomControl>

        <CustomControl controlPosition={window.google.maps.ControlPosition.LEFT_TOP}>
          <div style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', width: '150px', marginTop: '10px', marginLeft: '10px', padding: `12px`, background: 'white'}} >
            <label style={{display: 'block'}}>
              <input type='checkbox' />
              Day 1
            </label>
            <hr style={{margin: '5px'}} />
            <label style={{display: 'block'}}>
              <input type='checkbox' />
              Bucket
            </label>
          </div>
        </CustomControl>
        <SearchBox ref={node => { this.searchBox = node }} bounds={this.state.bounds} controlPosition={window.google.maps.ControlPosition.TOP_LEFT} onPlacesChanged={() => this.onPlacesChanged()} >
          <div>
            <input ref={node => { this.searchInput = node }} type='text' placeholder='Search for location' style={{boxSizing: `border-box`, border: `1px solid transparent`, width: `300px`, height: `30px`, marginTop: `10px`, marginLeft: '10px', padding: `0 12px`, borderRadius: `3px`, boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: `none`, textOverflow: `ellipses`}} />
            <button onClick={() => this.clearSearch()} style={{boxSizing: 'border-box', border: '1px solid transparent', borderRadius: '3px', boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`, fontSize: `14px`, outline: 'none', height: '30px', marginLeft: '10px'}}>Clear</button>
          </div>
        </SearchBox>

        {this.state.searchMarkers.map((marker, index) => {
          return (
            <Marker key={index} position={marker.position} onClick={() => this.onSearchMarkerClicked(index)} />
          )
        })}

        {/* INFOBOX FOR CREATE */}
        {this.state.isInfoBoxOpen && true &&
          <InfoBox ref={node => { this.infoBox = node }} position={this.state.currentlyClicked.position} options={{closeBoxURL: ``, enableEventPropagation: true}} onDomReady={() => this.onInfoBoxDomReady()} >
            <div style={{position: 'relative', background: 'white', width: '384px', height: '243px', padding: '10px'}} id='infobox'>
              <div style={{position: 'absolute', right: '0', top: '0', padding: '5px'}}>
                <i className='material-icons'>location_on</i>
                <i className='material-icons'>delete</i>
              </div>
              <div>
                <MapCreateEventPopup eventType={this.state.eventType} ItineraryId={this.props.ItineraryId} closeInfoBox={() => this.closeInfoBox()} changeEventType={type => this.changeEventType(type)} />
              </div>
            </div>
          </InfoBox>
        }
      </GoogleMap>
    )
  }
}

const MapPlanner = withScriptjs(withGoogleMap(Map))

class MapPlannerHOC extends Component {
  returnToPlanner () {
    var itineraryId = this.props.match.params.itineraryId
    this.props.history.push(`/planner/${itineraryId}`)
  }

  // componentWillReceiveProps (nextProps) {
  //   if (this.props.events !== nextProps.events) {
  //     console.log('events', nextProps.events)
  //   }
  // }

  render () {
    return (
      <MapPlanner events={this.props.events} returnToPlanner={() => this.returnToPlanner()} googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&v=3.31&libraries=geometry,drawing,places`} loadingElement={<div style={{ height: `100%` }} />} containerElement={<div style={{ height: `100%` }} />} mapElement={<div style={{ height: `100%` }} />} />
    )
  }
}

export default withRouter(MapPlannerHOC)
