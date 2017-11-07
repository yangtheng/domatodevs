import { gql } from 'react-apollo'

export const queryItinerary = gql`
  query queryItinerary($id: ID!) {
    findItinerary(id: $id){
      name
      countries {
        name
      }
      startDate
      endDate
      activities {
        id
        name
        startTime
        endTime
        location {
          id
          name
        }
        date
        loadSequence
        cost
        bookedThrough
        bookingStatus
        notes
      }
      flights {
        id
        name
        departureLocation {
          id
          name
        }
        arrivalLocation {
          id
          name
        }
        departureDate
        arrivalDate
        departureTime
        arrivalTime
        departureLoadSequence
        arrivalLoadSequence
        cost
        bookedThrough
        bookingStatus
        notes
      }
      lodgings {
        id
        name
        location {
          id
          name
        }
        startDate
        endDate
        startTime
        endTime
        startLoadSequence
        endLoadSequence
        cost
        bookedThrough
        bookingStatus
        notes
      }
      food {
        id
        name
        location {
          id
          name
        }
        date
        startTime
        endTime
        loadSequence
        cost
        bookedThrough
        bookingStatus
        notes
      }
      transports {
        id
        name
        departureLocation {
          id
          name
        }
        arrivalLocation {
          id
          name
        }
        date
        departureTime
        arrivalTime
        startLoadSequence
        endLoadSequence
        cost
        bookedThrough
        bookingStatus
        notes
      }
    }
  }`

export const allItineraries = gql`
  query allItineraries {
    allItineraries {
      id
      name
      startDate
      endDate
      pax
      travelInsurance
      budget
      countries {
        id
        name
        code
      }
      owner {
        id
        name
        email
      }
      users {
        id
        name
        email
      }
    }
  }`

// include country code. coutnryIdArr
export const createItinerary = gql`
  mutation createItinerary($UserId: Int!, $countryCode: String, $name: String!, $startDate: Int, $endDate: Int, $pax: Int, $travelInsurance: String, $budget: Int) {
    createItinerary(UserId:$UserId, countryCode: $countryCode, name: $name, startDate: $startDate, endDate: $endDate, pax: $pax, travelInsurance: $travelInsurance, budget: $budget) {
      id
      name
      startDate
      endDate
      pax
      travelInsurance
      budget
    }
  }`

export const updateItineraryDetails = gql`
  mutation updateItineraryDetails($id: ID!, $name: String, $startDate: Int, $endDate: Int, $pax: Int, $travelInsurance: String, $budget: Int) {
    updateItineraryDetails(id: $id, name: $name, startDate: $startDate, endDate: $endDate, pax: $pax, travelInsurance: $travelInsurance, budget: $budget) {
      id
      name
      startDate
      endDate
      pax
      travelInsurance
      budget
    }
  }
`
export const deleteItinerary = gql`
  mutation deleteItinerary($ItineraryId: ID!) {
    deleteItinerary(id:$ItineraryId)
  }
`
export const createCountriesItineraries = gql`
    mutation createCountriesItineraries($ItineraryId: Int!, $countryCode: String!) {
      createCountriesItineraries(ItineraryId: $ItineraryId, countryCode: $countryCode) {
        ItineraryId
        CountryId
      }
    }
  `

export const deleteCountriesItineraries = gql`
      mutation deleteCountriesItineraries($ItineraryId: Int!, $CountryId: Int!) {
        deleteCountriesItineraries(ItineraryId: $ItineraryId, CountryId: $CountryId)
      }
    `
