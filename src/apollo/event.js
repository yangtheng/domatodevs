import { gql } from 'react-apollo'

export const findEvent = gql`
  query findEvent($id: ID!) {
    findEvent(id: $id) {
      id
      ItineraryId
      eventType
      startDay
      startTime
      endTime
      loadSequence
      notes
      cost
      currency
      bookingService
      bookingConfirmation
      location {
        id
        verified
        placeId
        name
        address
        telephone
        latitude
        longitude
        utcOffset
        openingHours {
          open {
            day
            time
          }
          close {
            day
            time
          }
        }
        openingHoursText
        imageUrl
      }
      attachments {
        id
        fileName
        fileAlias
        fileSize
        fileType
      }
    }
  }
`

export const createEvent = gql`
  mutation createEvent(
    $ItineraryId: ID!,
    $eventType: String,
    $startDay: Int,
    $startTime: Int,
    $endTime: Int,
    $loadSequence: Int!,
    $notes: String,
    $cost: Int,
    $currency: String,
    $bookingService: String,
    $bookingConfirmation: String,
    $locationData: locationDataInput,
    $LocationId: ID
  ) {
    createEvent(
      ItineraryId: $ItineraryId,
      eventType: $eventType,
      startDay: $startDay,
      startTime: $startTime,
      endTime: $endTime,
      loadSequence: $loadSequence,
      notes: $notes,
      cost: $cost,
      currency: $currency,
      bookingService: $bookingService,
      bookingConfirmation: $bookingConfirmation,
      locationData: $locationData,
      LocationId: $LocationId
    )
  }
`

export const updateEvent = gql`
  mutation updateEvent(
    $id: ID!,
    $eventType: String,
    $startDay: Int,
    $startTime: Int,
    $endTime: Int,
    $loadSequence: Int!,
    $notes: String,
    $cost: Int,
    $currency: String,
    $bookingService: String,
    $bookingConfirmation: String,
    $locationData: locationDataInput,
    $LocationId: ID
  ) {
    updateEvent(
      id: $id,
      eventType: $eventType,
      startDay: $startDay,
      startTime: $startTime,
      endTime: $endTime,
      loadSequence: $loadSequence,
      notes: $notes,
      cost: $cost,
      currency: $currency,
      bookingService: $bookingService,
      bookingConfirmation: $bookingConfirmation,
      locationData: $locationData,
      LocationId: $LocationId
    )
  }
`

export const deleteEvent = gql`
  mutation deleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`
