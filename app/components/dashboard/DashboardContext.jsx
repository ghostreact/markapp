'use client';

import { createContext, useContext } from 'react';

const DashboardContext = createContext({
    user: null,
    loading: true,
    refresh: async () => {},
});

export function DashboardProvider({ value, children }) {
    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    return useContext(DashboardContext);
}
