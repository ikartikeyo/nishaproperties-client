import { configureStore, createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    ready: true,
  },
  reducers: {},
});

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Property actions for compatibility
export const listProperties = async (dispatch: AppDispatch) => {
  try {
    const res = await fetch("/api/property");
    const data = await res.json();
    dispatch({ type: "properties/list", payload: data });
    return data;
  } catch (error) {
    console.error(error);
  }
};

// Enquiry actions for compatibility
export const createEnquiry = async (dispatch: AppDispatch, data: any) => {
  try {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    dispatch({ type: "enquiries/create", payload: result });
    return result;
  } catch (error) {
    console.error(error);
  }
};