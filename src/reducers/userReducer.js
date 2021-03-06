export const userReducer = (state = {}, action) => {
  switch (action.type) {
    case 'SET_USER_PROFILE':
    // fetch from db. set in state
      // console.log('IN USER REDUCER', action.userProfile)
      return action.userProfile
    default:
      return state
  }
}

/* userProfile in redux state (from backend)
{
userId
fullName
username
email
profilePic
CountryId
country {
id, name, code
}
bio
itineraries [ {id, name} ]
}
*/
