// ------------------------------------
// Constants
// ------------------------------------
export const LOCATION_CHANGE = 'LOCATION_CHANGE'

// ------------------------------------
// Actions
// ------------------------------------
export function locationChange (location = '/') {
  return {
    type    : LOCATION_CHANGE,
    payload : location
  }
}

// ------------------------------------
// Specialized Action Creator  指定dispatch
// ------------------------------------
export const updateLocation = ({ dispatch }) => {
  return (nextLocation) => dispatch(locationChange(nextLocation))
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = null

export default function reducer (state = initialState, action) {
  //reducer接收一个state和一个action
  return action.type === LOCATION_CHANGE
    ? action.payload//payload放的是location, 相当于把当前的 state改成 新的 location
    : state
}
