import React, { createContext, useContext, useReducer } from 'react';

// 1. Create the Data Layer
export const StateContext = createContext();

// 2. Build the Provider to wrap the App
export const StateProvider = ({ reducer, initialState, children }) => (
    <StateContext.Provider value={useReducer(reducer, initialState)}>
        {children}
    </StateContext.Provider>
);

// 3. Create a custom hook to pull information from the Data Layer
export const useStateValue = () => useContext(StateContext);
