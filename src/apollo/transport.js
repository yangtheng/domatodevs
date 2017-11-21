import { gql } from 'react-apollo'

export const createTransport = gql`
  mutation createTransport(
    $name: String!,
    $departureDay: Int!,
    $arrivalDay: Int!,
    $DepartureGooglePlaceData: ID!,
    $ArrivalGooglePlaceData: ID!,
    $ItineraryId: ID!,
    $departureLoadSequence: Int!,
    $arrivalLoadSequence: Int!
  ) {
    createTransport(
      name: $name,
      departureDay: $departureDay,
      arrivalDay: $arrivalDay,
      DepartureGooglePlaceData: $DepartureGooglePlaceData,
      ArrivalGooglePlaceData: $ArrivalGooglePlaceData,
      ItineraryId: $ItineraryId,
      departureLoadSequence: $departureLoadSequence,
      arrivalLoadSequence: $arrivalLoadSequence
    ) {
      id
    }
  }
`

export const updateTransport = gql`
  mutation updateTransport(
    $id: ID!,
    $name: String,
    $departureDay: Int,
    $arrivalDay: Int,
    $DepartureGooglePlaceData: ID,
    $ArrivalGooglePlaceData: ID,
    $departureLoadSequence: Int,
    $arrivalLoadSequence: Int
  ) {
    updateTransport(
      id: $id,
      name: $name,
      departureDay: $departureDay,
      arrivalDay: $arrivalDay,
      DepartureGooglePlaceData: $DepartureGooglePlaceData,
      ArrivalGooglePlaceData: $ArrivalGooglePlaceData,
      departureLoadSequence: $departureLoadSequence,
      arrivalLoadSequence: $arrivalLoadSequence
    ) {
      id
    }
  }
`

export const deleteTransport = gql`
  mutation deleteTransport($id: ID!) {
    deleteTransport(id: $id) {
      status
    }
  }
`
