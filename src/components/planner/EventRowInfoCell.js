import React, { Component } from 'react'
import { connect } from 'react-redux'
import { graphql, compose } from 'react-apollo'
import { Editor, EditorState, ContentState, getDefaultKeyBinding, KeyBindingUtil } from 'draft-js'
import { allCurrenciesList } from '../../helpers/countriesToCurrencyList'

import { updateEvent } from '../../actions/planner/eventsActions'
import { updateActiveEvent } from '../../actions/planner/activeEventActions'
import { changeActiveField } from '../../actions/planner/activeFieldActions'
import { setRightBarFocusedTab } from '../../actions/planner/plannerViewActions'

import { updateEventBackend } from '../../apollo/event'
const { hasCommandModifier } = KeyBindingUtil

const eventPropertyNames = {
  Event: 'eventType',
  Price: 'cost',
  Notes: 'notes',
  'Booking Service': 'bookingService',
  'Confirmation Number': 'bookingConfirmation',
  Location: 'location'
}

const getEventProp = (columnInput, eventInput) => {
  const eventProperties = {
    Currency: eventInput.currency,
    Event: eventInput.eventType,
    Price: eventInput.cost,
    Notes: eventInput.notes,
    'Booking Service': eventInput.bookingService,
    'Confirmation Number': eventInput.bookingConfirmation
  }

  return eventProperties[columnInput]
}

const keyBindingFn = (e) => {
  if (e.keyCode === 13 && !hasCommandModifier(e)) {
    return 'enterPressed'
  }
  return getDefaultKeyBinding(e)
}

class EventRowInfoCell extends Component {
  constructor (props) {
    super(props)
    const { column, id } = props
    const { events } = this.props.events
    const value = getEventProp(column, events.filter(event => event.id === id)[0])

    this.state = {
      editorState: EditorState.createWithContent(value),
      initialValue: value,
      cellClickedTwice: false
    }

    this.handleKeyCommand = this.handleKeyCommand.bind(this)

    this.onChange = (editorState) => {
      const { column, id } = this.props
      const oldContentState = this.state.editorState.getCurrentContent()
      const newContentState = editorState.getCurrentContent()

      const oldText = oldContentState.getPlainText()
      const newText = newContentState.getPlainText()
      const property = eventPropertyNames[column]
      this.setState({editorState: editorState}, () => {
        if (newText !== oldText) {
          // id, property, value, fromSidebar
          this.props.updateEvent(id, property, newContentState, false)
        }
      })
    }

    this.focus = (e) => {
      // check whether the click is within the text, or within the cell but outside of the text, if outside of text, move cursor to the end
      if (e.target.className === 'planner-table-cell-container') {
        this.editor.focus()
        this.setState({editorState: EditorState.moveFocusToEnd(this.state.editorState)})
      } else {
        this.editor.focus()
      }
    }
  }

  componentWillReceiveProps (nextProps) {
    const { column, id } = nextProps
    const { events } = nextProps.events
    const property = eventPropertyNames[column]
    if (nextProps.events.updatedFromSidebar || nextProps.column !== this.props.column || nextProps.events.refetch) {
      const value = getEventProp(column, events.filter(event => event.id === id)[0])
      this.setState({editorState: EditorState.createWithContent(value)})
    }

    // if cell is newly active, focus so keydown listener can fire
    // but this constantly fires. clicking in right bar should unfocus so typing can occur?
    // if (nextProps.activeEventId === id && nextProps.activeField === property && !this.state.editorFocus) {
    //   if (this.props.plannerFocus !== 'rightbar') {
    //     console.log('planner focus is not on rightbar')
    //     this.cell.focus()
    //     // fire too often, cant type inside of cell
    //   }
    // }
    if (nextProps.activeEventId !== this.props.activeEventId || nextProps.activeField !== this.props.activeField) {
      if (nextProps.activeEventId === id && nextProps.activeField === property && !this.state.editorFocus) {
        // if active cell changes + this is the newest active cell
        if (this.props.plannerFocus !== 'rightbar') {
          console.log('active cell changed and right bar is not focused')
          this.cell.focus()
        }
      }
    }

    if (nextProps.plannerFocus !== this.props.plannerFocus) {
      if (nextProps.plannerFocus !== 'rightbar') {
        if (nextProps.activeEventId === id && nextProps.activeField === property) {
          console.log('area focus has changed')
          this.cell.focus()
          // THIS IS NOT FOCUSING AFTER CLICKING AWAY FROM RIGHT BAR??
        }
      }
    }
    // if (nextProps.activeEventId !== this.props.activeEventId || nextProps.activeField !== this.props.activeField) {
    //   console.log('activeEventId changed')
    //   this.setState({cellClickedTwice: false})
    // }
  }

  shouldComponentUpdate (nextProps) {
    const { column, id } = nextProps
    const { refetch, updatedId, updatedProperty } = nextProps.events
    const property = eventPropertyNames[column]
    if (column !== nextProps.column) {
      return true
    } else if (refetch) {
      return true
    } else if (updatedId === id && updatedProperty === property) {
      return true
    } else if ((nextProps.activeEventId === id && nextProps.activeField === property) || (this.props.activeEventId === id && this.props.activeField === property)) {
      return true
    } else {
      return false
    }
  }

  handleOnFocus (e) {
    const property = eventPropertyNames[this.props.column]
    this.props.changeActiveField(property)
    if (this.props.activeEventId !== this.props.id) {
      this.props.updateActiveEvent(this.props.id)
    }
  }

  handleCellClick (e) {
    // const property = eventPropertyNames[this.props.column]
    if (!this.state.cellClickedTwice) {
      this.setState({cellClickedTwice: true, editorFocus: true})
    } else {
      this.focus(e)
    }
  }

  // listener is on div
  handleKeyDown (e, isActive) {
    console.log('key pressed', e.key)
    const { column, id } = this.props
    const property = eventPropertyNames[column]
    // if (e.keyCode <= 40 && e.keyCode >= 37 && isActive && !editorFocus) {
    //   this.handleArrowKeyDown(e.keyCode)
    // }

    // listner for active cell requires focus to trigger
    // console.log('listener trigger for cell id', this.props.id)
    if (e.key === 'Enter' && !this.state.editorFocus) {
      e.preventDefault()
      console.log('UNFOCUSED. ENTER TO FOCUS')
      this.setState({editorFocus: true, cellClickedTwice: true, editorState: EditorState.moveFocusToEnd(this.state.editorState)})
    }
    if (e.key === 'Enter' && this.state.editorFocus) {
      e.preventDefault()
      console.log('ENTER TO GO TO NEXT ROW')
      // find next active row EventId
      console.log('ordered all events', this.props.events.events)
      let thisEventIndex = this.props.events.events.findIndex(e => {
        return e.id === this.props.id
      }) + 1
      console.log('this event index', thisEventIndex, 'max index', this.props.events.events.length)
      if (thisEventIndex < this.props.events.events.length) {
        console.log('next id', (thisEventIndex + 1).toString())
        this.props.updateActiveEvent((thisEventIndex + 1).toString())
      }
      this.setState({editorFocus: false, cellClickedTwice: false})
    }

    if (e.key === 'Escape') {
      const editorState = EditorState.createWithContent(this.state.initialValue)
      this.setState({
        editorState
      })
      this.props.updateEvent(id, property, this.state.initialValue, false)
      // CARE: UPDATEEVENT MUST RETURN SORTED EVENTS ARR. ELSE NEWLY EDITED CELL JUMPS TO LAST POSITION, EVENTINDEX + 1 FAILS THE LENGTH CHECK.
    }

    if (e.key === 'ArrowRight') {
      // switch active col
      // console.log('props', this.props)
      let currentColumnName = this.props.column
      let currentColumnIndex = this.props.columnState.findIndex(e => {
        return e.name === currentColumnName
      })
      console.log('currentColumnIndex', currentColumnIndex)
      if (currentColumnIndex < this.props.columnState.length - 1) {
        console.log('can go further right to', eventPropertyNames[this.props.columnState[currentColumnIndex + 1].name])
        this.props.changeActiveField(eventPropertyNames[this.props.columnState[currentColumnIndex + 1].name])
        console.log('after change active field', this.props)
      } else {
        console.log('last col')
      }
    }
    if (e.key === 'ArrowLeft') {
      let currentColumnName = this.props.column
      let currentColumnIndex = this.props.columnState.findIndex(e => {
        return e.name === currentColumnName
      })
      if (currentColumnIndex >= 1) {
        console.log('can go further right to', eventPropertyNames[this.props.columnState[currentColumnIndex - 1].name])
        this.props.changeActiveField(eventPropertyNames[this.props.columnState[currentColumnIndex - 1].name])
        console.log('after change active field', this.props)
      } else {
        console.log('first col')
      }
    }
    if (e.key === 'ArrowDown') {
      console.log('go to next row if possible')
      let thisEventIndex = this.props.events.events.findIndex(e => {
        return e.id === this.props.id
      }) + 1
      if (thisEventIndex < this.props.events.events.length) {
        console.log('next id', (thisEventIndex + 1).toString())
        this.props.updateActiveEvent((thisEventIndex + 1).toString())
      }
      this.setState({editorFocus: false, cellClickedTwice: false})
    }
    if (e.key === 'ArrowUp') {
      console.log('go up if possible')
      let thisEventIndex = this.props.events.events.findIndex(e => {
        return e.id === this.props.id
      }) + 1
      if (thisEventIndex > 1) {
        console.log('next id', (thisEventIndex - 1).toString())
        this.props.updateActiveEvent((thisEventIndex - 1).toString())
      }
      this.setState({editorFocus: false, cellClickedTwice: false})
    }
  }

  // handleArrowKeyDown (key) {
  //   const { columnState, index, events, day, eventIndex } = this.props
  //   if (key === 37) {
  //     index > 0 && this.props.changeActiveField(eventPropertyNames[columnState[index - 1].name])
  //     if (index === 0) this.props.changeActiveField('startTime')
  //     this.cell.blur()
  //   } else if (key === 39) {
  //     index < columnState.length - 1 && this.props.changeActiveField(eventPropertyNames[columnState[index + 1].name])
  //     if (index === columnState.length - 1) {
  //       this.props.changeActiveField('startTime')
  //       const newActiveEvent = events.events.filter(event => event.startDay === day)[eventIndex + 1]
  //       newActiveEvent && this.props.updateActiveEvent(newActiveEvent.id)
  //     }
  //     this.cell.blur()
  //   } else if (key === 38) {
  //     const newActiveEvent = events.events.filter(event => event.startDay === day)[eventIndex - 1]
  //     newActiveEvent && this.props.updateActiveEvent(newActiveEvent.id)
  //     this.cell.blur()
  //   } else if (key === 40) {
  //     const newActiveEvent = events.events.filter(event => event.startDay === day)[eventIndex + 1]
  //     newActiveEvent && this.props.updateActiveEvent(newActiveEvent.id)
  //     this.cell.blur()
  //   }
  // }

  handleOnBlur () {
    const { id, column } = this.props
    const property = eventPropertyNames[column]
    this.setState({
      initialValue: this.state.editorState.getCurrentContent(),
      editorFocus: false
    }, () => {
      this.props.updateEventBackend({
        variables: {
          id,
          [property]: this.state.editorState.getCurrentContent().getPlainText()
        }
      })
    })
  }

  handleCurrencySelect (e) {
    const { id } = this.props
    this.props.updateEvent(id, 'currency', e.target.value, false)
    this.props.updateEventBackend({
      variables: {
        id,
        currency: e.target.value
      }
    })
  }

  // this is draft js key listener
  handleKeyCommand (command) {
    if (command === 'enterPressed') {
      this.editor.blur()
      this.cell.focus()
      return 'handled'
    }
    return 'not-handled'
  }

  render () {
    const { column, id } = this.props
    const { events } = this.props.events
    const property = eventPropertyNames[column]
    const isActive = this.props.activeEventId === id && this.props.activeField === property
    const eventCurrency = getEventProp('Currency', events.filter(event => event.id === id)[0])

    if (isActive) {
      console.log('this id', id, 'isActive', isActive)
    }
    // const value = getEventProp(column, events.filter(event => event.id === id)[0])

    return (
      <div tabIndex='1' ref={(element) => { this.cell = element }} className='planner-table-cell-container' onKeyDown={(e) => this.handleKeyDown(e, isActive)} onFocus={(e) => this.handleOnFocus(e)} onClick={(e) => this.handleCellClick(e)} onContextMenu={(e) => this.handleOnFocus(e)} style={{minHeight: '83px', display: 'flex', alignItems: 'center', wordBreak: 'break-word', outline: isActive ? '1px solid #ed685a' : 'none', color: isActive ? '#ed685a' : 'rgba(60, 58, 68, 1)', padding: '8px'}}>
        {column === 'Price' && <select disabled={!isActive} onChange={(e) => this.handleCurrencySelect(e)} value={eventCurrency || ''} style={{backgroundColor: 'transparent', border: 'none'}}>
          {allCurrenciesList().map((currency, i) => {
            return <option key={i} value={currency}>{currency}</option>
          })}
        </select>}
        <Editor readOnly={!isActive || !this.state.cellClickedTwice} editorState={this.state.editorState} onChange={this.onChange} ref={(element) => { this.editor = element }} onBlur={() => this.handleOnBlur()} keyBindingFn={keyBindingFn} handleKeyCommand={this.handleKeyCommand} />
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    events: state.events,
    activeField: state.activeField,
    activeEventId: state.activeEventId,
    plannerFocus: state.plannerFocus
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateEvent: (id, property, value, fromSidebar) => {
      return dispatch(updateEvent(id, property, value, fromSidebar))
    },
    updateActiveEvent: (id) => {
      return dispatch(updateActiveEvent(id))
    },
    changeActiveField: (field) => {
      return dispatch(changeActiveField(field))
    },
    setRightBarFocusedTab: (tabName) => {
      return dispatch(setRightBarFocusedTab(tabName))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(compose(
  graphql(updateEventBackend, {name: 'updateEventBackend'})
)(EventRowInfoCell))
