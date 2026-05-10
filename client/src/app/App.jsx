import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router";
import { store } from "./App.store";
import Router from './App.routes.jsx'
import { getMeService } from "../features/auth/services/auth.service.js";
import { setUser, setLoading } from "../features/auth/slice/auth.slice.js";
import { TooltipProvider } from "@/components/ui/tooltip";

const AppContent = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const googleAuthPayload = localStorage.getItem('googleAuthPayload') || localStorage.getItem('googleAuthSuccess');
      if (googleAuthPayload) {
        const payload = JSON.parse(googleAuthPayload);
        store.dispatch(setUser(payload));
        localStorage.removeItem('googleAuthPayload');
        localStorage.removeItem('googleAuthSuccess');
        store.dispatch(setLoading(false));
        setIsInitializing(false);
        return;
      }

      try {
        const response = await getMeService();
        if (response && (response.data || response.user || Object.keys(response).length > 0)) {
          store.dispatch(setUser(response.data || response.user || response));
        }
      } catch (error) {
        console.log("No valid session found.");
      } finally {
        store.dispatch(setLoading(false));
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  if (isInitializing) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="spinner w-8 h-8 text-white" />
      </div>
    );
  }

  return <RouterProvider router={Router} />;
};

const App = () => {
  return (
    <div className="h-screen w-full bg-[#171615] text-white">
      <Provider store={store}>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </Provider>
    </div>
  );
};

export default App;
