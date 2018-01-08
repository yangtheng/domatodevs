import moment from 'moment'

// CONSTRUCT GOOGLEPLACEDATA OBJ FOR DB FROM GOOGLE PLACES/MAPS JSON OBJECT
export function constructGooglePlaceDataObj (place) {
  var googlePlaceData = {
    placeId: place.place_id,
    countryCode: null,
    name: place.name,
    address: place.formatted_address,
    latitude: null,
    longitude: null,
    openingHours: null,
    openingHoursText: null
  }
  if (place.opening_hours && place.opening_hours.periods) {
    // maps place details also provides hours, minutes, nextDate. db cant take the non 32 bit signed int for nextDate. REMOVE THESE 3 PROPERTIES FROM OPENING HOURS PERIODS, NOT IN GRAPHQL SCHEMA
    var tempArr = []
    place.opening_hours.periods.forEach(period => {
      var tempObj = {}
      if (period.open) {
        tempObj.open = {day: period.open.day, time: period.open.time}
      }
      if (period.close) {
        tempObj.close = {day: period.close.day, time: period.close.time}
      }
      tempArr.push(tempObj)
    })
    googlePlaceData.openingHours = tempArr
  }
  if (place.opening_hours && place.opening_hours.weekday_text) {
    googlePlaceData.openingHoursText = place.opening_hours.weekday_text
  }
  place.address_components.forEach(e => {
    if (e.types.includes('country')) {
      googlePlaceData.countryCode = e.short_name
    }
  })

  // depending on whether lat/lng comes from search or map
  if (typeof (place.geometry.location.lat) === 'number') {
    googlePlaceData.latitude = place.geometry.location.lat
    googlePlaceData.longitude = place.geometry.location.lng
  } else {
    googlePlaceData.latitude = place.geometry.location.lat()
    googlePlaceData.longitude = place.geometry.location.lng()
  }

  console.log('constructor for googlePlaceData', googlePlaceData)
  return googlePlaceData
}

// CONSTRUCT LOCATIONDETAILS OBJ TO PASS DOWN AS PROPS FOR RENDERING
export function constructLocationDetails (googlePlaceDetails, datesArr, dayInt) {
  var locationDetails = {
    address: googlePlaceDetails.formatted_address,
    telephone: googlePlaceDetails.international_phone_number || googlePlaceDetails.formatted_phone_number
  }
  var dateUnix = datesArr[dayInt - 1]
  var momentTime = moment.utc(dateUnix)
  var momentDayStr = momentTime.format('dddd')
  if (googlePlaceDetails.opening_hours && googlePlaceDetails.opening_hours.weekday_text) {
    var textArr = googlePlaceDetails.opening_hours.weekday_text.filter(e => {
      return e.indexOf(momentDayStr) > -1
    })
    locationDetails.openingHours = textArr[0]
  }

  return locationDetails
}