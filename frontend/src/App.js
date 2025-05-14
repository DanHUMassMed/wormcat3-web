import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import WormCatEnrichmentForm from "./components/WormCatEnrichmentForm";
import WormCatBatchForm from "./components/WormCatBatchForm";
import WormCatGSEAForm from "./components/WormCatGSEAForm";
import WormCatEnrichmentReport from "./components/WormCatEnrichmentReport";
import WormCatGSEAReport from "./components/WormCatGSEAReport";

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<WormCatEnrichmentForm />} />
            <Route path="batch" element={<WormCatBatchForm />} />
            <Route path="gsea" element={<WormCatGSEAForm />} />
            <Route path="report" element={<Navigate to="/" />} />
            <Route path="report/:run_id" element={<WormCatEnrichmentReport />} />
            <Route path="gsea_report/:run_id" element={<WormCatGSEAReport />} />
          </Route>
        </Routes>
    </Router>
  );
}

export default App;