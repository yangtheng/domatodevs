import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import { connect } from 'react-redux'
import { toggleTimeline } from '../actions/plannerTimelineActions'
import Scroll from 'react-scroll'
import { updateItineraryDetails, queryItinerary } from '../apollo/itinerary'

import PlannerTimelineDayButton from './PlannerTimelineDayButton'

import { primaryColor, timelineColumnStyle, timelineTitleStyle, timelineTitleWordStyle, dayTimelineStyle, dayTimelineContainerStyle, dayTimelineWordStyle, addDayButtonStyle, addDayWordStyle, timelineStyle } from '../Styles/styles'

const Link = Scroll.Link
const _ = require('lodash')

class PlannerTimelineHeader extends Component {
  shouldComponentUpdate (nextProps) {
    // if (this.props.getItem) return true

    // if (nextProps.timeline.events && this.props.timeline.events && nextProps.timelineDay.timelineAtTop === this.props.timelineDay.timelineAtTop) return false
    // if (!nextProps.timeline.events && !this.props.timeline.events && !this.props.firstDay) return false
    // if (nextProps.timelineDay.timelineAtTop === this.props.timelineDay.timelineAtTop && _.isEqual(nextProps.timelineDay.dateOffsets, this.props.timelineDay.dateOffsets) && nextProps.timeline.events === this.props.timeline.events && nextProps.dates.length === this.props.dates.length) return false
    // else return true

    // switching to daysArr
    if (nextProps.timeline.events && this.props.timeline.events && nextProps.timelineDay.timelineAtTop === this.props.timelineDay.timelineAtTop) return false
    if (!nextProps.timeline.events && !this.props.timeline.events && !this.props.firstDay) return false
    if (nextProps.timelineDay.timelineAtTop === this.props.timelineDay.timelineAtTop && _.isEqual(nextProps.timelineDay.dateOffsets, this.props.timelineDay.dateOffsets) && nextProps.timeline.events === this.props.timeline.events && nextProps.daysArr === this.props.daysArr) return false
    else return true
  }

  render () {
    // console.log('render timeline', this.props)
    // if (!this.props.firstDay && !this.props.timeline.events) return (
    //   <th id='timeline-top' style={timelineColumnStyle()}></th>
    // )
    const timeline = (
      <div style={timelineStyle} />
    )
    const headerSticky = this.props.timelineDay.timelineAtTop
    const sticky = this.props.timelineDay.timelineAtTop && this.props.timeline.days
    return (
      <th id='timeline-top' style={timelineColumnStyle()}>
        {/* {this.props.firstDay && (
          <div style={timelineTitleStyle(headerSticky)}>
            <span style={{fontSize: '24px', color: primaryColor, display: 'inline-block', position: 'relative', top: '8px', marginBottom: '8px', height: '24px'}}>
              <i key='leftArrowTimeline' onClick={() => this.handleClick()} className='material-icons' style={{width: '15px', overflow: 'hidden', cursor: 'pointer', opacity: '0.6', ':hover': {opacity: '1'}}}>keyboard_arrow_left</i>
              <i key='righttArrowTimeline' onClick={() => this.handleClick()} className='material-icons' style={{cursor: 'pointer', opacity: '0.6', ':hover': {opacity: '1'}}}>keyboard_arrow_right</i>
            </span>
            <span style={timelineTitleWordStyle}>{this.props.timeline.events ? 'Duration' : 'Days'}</span>
          </div>
        )} */}
        {this.props.firstDay && this.props.timeline.days && (
          <div style={dayTimelineStyle(sticky)}>

            {/* {this.props.dates.map((date, i) => {
              const isDateOnScreen = this.props.timelineDay.dateOffsets[`day ${i + 1}`]
              return (
                <div key={i}>
                  <Link to={'day-' + (i + 1)} smooth={true} duration={300} offset={-60}>
                    <PlannerTimelineDayButton isDateOnScreen={isDateOnScreen} day={i + 1} itineraryId={this.props.itineraryId} days={this.props.dates.length} />
                  </Link>
                  {i < this.props.dates.length - 1 && <div style={{height: '10px', position: 'relative'}}>
                  </div>}
                </div>
              )
            })} */}

            {this.props.daysArr.map((day, i) => {
              const isDateOnScreen = this.props.timelineDay.dateOffsets[`day ${day}`]
              return (
                <div style={{height: '19px', marginBottom: '24px'}} key={i}>
                  <Link to={'day-' + (day)} smooth duration={300} offset={-60}>
                    <PlannerTimelineDayButton isDateOnScreen={isDateOnScreen} day={day} itineraryId={this.props.itineraryId} days={this.props.days} />
                  </Link>
                  {i < this.props.days &&
                  <div style={{height: '10px', position: 'relative'}} />
                }
                </div>
              )
            })}

            <div onClick={() => this.addDay()} style={addDayButtonStyle}>
              <span className='addDayButton' style={addDayWordStyle}>+</span>
            </div>
          </div>
        )}
        {!this.props.firstDay && this.props.timeline.events && (
          timeline
        )}
      </th>
    )
  }

  handleClick () {
    this.props.toggleTimeline({
      events: !this.props.timeline.events,
      days: !this.props.timeline.days
    })
  }

  addDay () {
    this.props.updateItineraryDetails({
      variables: {
        id: this.props.itineraryId,
        days: this.props.days + 1
      },
      refetchQueries: [{
        query: queryItinerary,
        variables: { id: this.props.itineraryId }
      }]
    })
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleTimeline: (options) => {
      dispatch(toggleTimeline(options))
    }
  }
}

const mapStateToProps = (state) => {
  return {
    timeline: state.plannerTimeline,
    timelineDay: state.plannerTimelineDay
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(compose(
  graphql(updateItineraryDetails, { name: 'updateItineraryDetails' })
)(PlannerTimelineHeader))
