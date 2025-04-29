import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import WormCatForm from "./components/WormCatForm";
import WormCatReport from "./components/WormCatReport";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WormCatForm />} />
          <Route path="report" element={<WormCatReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;