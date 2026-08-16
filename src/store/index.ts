import store, { store as namedStore, RootState, AppDispatch, listProperties, createEnquiry } from "./store";

export { namedStore as store, listProperties, createEnquiry };
export type { RootState, AppDispatch };
export default store;