import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthGate } from "./AuthGate";
import { LoginPage } from "./pages/LoginPage";
import { RaceListPage } from "./pages/RaceListPage";
import { DriversPage } from "./pages/DriversPage";
import { NewRacePage } from "./pages/NewRacePage";
import { PlanPage } from "./pages/PlanPage";
import { RaceControlPage } from "./pages/RaceControlPage";
import { CompetitorsPage } from "./pages/CompetitorsPage";
import { AppLayout } from "./AppLayout";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <AuthGate>
              <AppLayout />
            </AuthGate>
          }
        >
          <Route path="/" element={<RaceListPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/races/new" element={<NewRacePage />} />
          <Route path="/races/:raceId/plan" element={<PlanPage />} />
          <Route path="/races/:raceId/live" element={<RaceControlPage />} />
          <Route path="/races/:raceId/competitors" element={<CompetitorsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
