import React, { Component } from 'react'

const columnValues = {
  'Price': 'cost',
  'Booking Status': 'bookingStatus',
  'Booking Platform': 'bookedThrough',
  'Notes': 'notes'
}

class PlannerColumnValue extends Component {
  render () {
    return (
      <td style={{textAlign: 'center', verticalAlign: 'top', color: '#9FACBC', fontSize: '16px', width: this.props.column === 'Notes' ? '60%' : '20%'}}>
        {this.renderInfo()}
      </td>
    )
  }

  renderInfo () {
    switch (this.props.column) {
      case 'Booking Status':
        if (this.props.activity[columnValues[this.props.column]]) return 'Booked'
        else if (this.props.activity[columnValues[this.props.column]] === false) return 'Not Booked'
        else return ''
      default:
        return this.props.activity[columnValues[this.props.column]]
    }
  }
}

export default PlannerColumnValue
