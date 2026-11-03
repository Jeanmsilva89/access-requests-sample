import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { MockProvider } from "./lib/mockContext";
import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { RequestsPage } from "./pages/RequestsPage";

export function App() {
  return (
    <MockProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="requests/new" element={<NewRequestPage />} />
            <Route path="requests/:id" element={<RequestDetailPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MockProvider>
  );
}
