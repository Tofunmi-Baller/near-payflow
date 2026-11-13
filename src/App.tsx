import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import PayInvoice from "./pages/PayInvoice";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateInvoice />} />
        <Route path="/invoice/:id" element={<InvoiceDetail />} />
      </Route>
      <Route path="/pay/:id" element={<PayInvoice />} />
    </Routes>
  );
}
