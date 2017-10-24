import React, { Component } from 'react'

class Itinerary extends Component {

  render () {
    return (
      <div style={{border: '1px solid black'}}>
        <h3 style={{display: 'inline-block'}}>id: {this.props.itinerary.id}</h3>
        <h3 style={{display: 'inline-block'}}>CountryId: {this.props.itinerary.countryId}</h3>
        <h3 style={{display: 'inline-block'}}>name: {this.props.itinerary.name}</h3>
        <h3 style={{display: 'inline-block'}}>startDate: {this.props.itinerary.startDate}</h3>
        <h3 style={{display: 'inline-block'}}>endDate: {this.props.itinerary.endDate}</h3>
        <h3 style={{display: 'inline-block'}}>pax: {this.props.itinerary.pax}</h3>
        <h3 style={{display: 'inline-block'}}>travelInsurance: {this.props.itinerary.travelInsurance}</h3>
        <h3 style={{display: 'inline-block'}}>budget: {this.props.itinerary.budget}</h3>
      </div>
    )
  }
}

export default Itinerary
