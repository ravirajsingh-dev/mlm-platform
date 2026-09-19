import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  treeDownline: [],
  left_leg: [],
  right_leg: [],
  directDownline: [],
  loadingDownline: false,
  error: {},
};

const downlineSlice = createSlice({
  name: "downline",
  initialState: initialState,
  reducers: {
    treeDownlineUpdated(state, action) {
      return {
        ...state,
        treeDownline: action.payload,
        loadingDownline: false,
      };
    },
    leftDownlineUpdated(state, action) {
      return {
        ...state,
        left_leg: action.payload,
        loadingDownline: false,
      };
    },
    rightDownlineUpdated(state, action) {
      return {
        ...state,
        right_leg: action.payload,
        loadingDownline: false,
      };
    },
    directDownlineUpdated(state, action) {
      return {
        ...state,
        directDownline: action.payload,
        loadingDownline: false,
      };
    },
    downlineError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingDownline: false,
      };
    },
    loadingDownline(state) {
      return {
        ...state,
        loadingDownline: true,
      };
    },
  },
});

export const {
  treeDownlineUpdated,
  leftDownlineUpdated,
  rightDownlineUpdated,
  directDownlineUpdated,
  downlineError,
  loadingDownline,
} = downlineSlice.actions;
export default downlineSlice.reducer;
