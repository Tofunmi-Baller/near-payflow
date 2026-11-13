import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PageSkeleton } from "./components/ui/Skeleton";

const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const InvoiceList = lazy(() => import("./pages/InvoiceList"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const ClientList = lazy(() => import("./pages/ClientList"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const AppSettings = lazy(() => import("./pages/AppSettings"));
const PayInvoice = lazy(() => import("./pages/PayInvoice"));

function Loader() {
  return <PageSkeleton />;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public standalone pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/pay/:id" element={<PayInvoice />} />

        {/* App shell with sidebar */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AppSettings />} />
        </Route>

        {/* Redirects from old routes */}
        <Route path="/create" element={<Navigate to="/app/invoices/new" replace />} />
        <Route path="/invoice/:id" element={<Navigate to="/app/invoices/:id" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
