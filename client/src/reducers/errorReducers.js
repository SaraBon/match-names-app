import {
  DELETE_ERRORS,
  VALIDATION_ERROR,
  CLEAR_ERRORS
} from "../actions/types";
const initialState = {
  deleteError: false,
  errors: {},
  loading: false
};
export default function(state = initialState, action) {
  switch (action.type) {
    case DELETE_ERRORS:
      return {
        deleteError: action.payload
      };
    case VALIDATION_ERROR:
      return {
        ...state,
        loading: false,
        errors: action.payload
      };
    case CLEAR_ERRORS:
      return {
        ...state,
        errors: action.payload
      };
    default:
      return state;
  }
}
