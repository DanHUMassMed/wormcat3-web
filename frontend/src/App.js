import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import WormCatForm from "./components/WormCatForm";
import WormCatReport from "./components/WormCatReport";
import ExcelUploadForm from "./components/ExcelUploadForm";


// Keep a log array in memory
window.persistentLogs = JSON.parse(localStorage.getItem('persistentLogs') || '[]');

// Save original console methods
window.originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

function formatTimestamp(date) {
  const pad = (n, z = 2) => String(n).padStart(z, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 4)}`
  );
}

function handleLog(type, args) {
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const formatted = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  const logEntry = `${timestamp} [${type.toUpperCase()}] ${formatted}`;
  window.persistentLogs.push(logEntry);

  // Persist to localStorage
  localStorage.setItem('persistentLogs', JSON.stringify(window.persistentLogs));

  // Also call the original method
  window.originalConsole[type](...args);
}

// Override console methods
console.log = (...args) => handleLog('log', args);
console.warn = (...args) => handleLog('warn', args);
console.error = (...args) => handleLog('error', args);

// Optional: expose download + clear
window.downloadPersistentLogs = function () {
  const blob = new Blob([window.persistentLogs.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'persistent-log.txt';
  a.click();
  URL.revokeObjectURL(url);
};

window.clearPersistentLogs = function () {
  localStorage.removeItem('persistentLogs');
  window.persistentLogs = [];
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WormCatForm />} />
          <Route path="upload" element={<ExcelUploadForm />} />
          <Route path="report" element={<Navigate to="/" />} />
          <Route path="report/:run_id" element={<WormCatReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;