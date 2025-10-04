import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Pages/Home";
import Navbar from "./Components/Navbar";
import Dashboard from "./Pages/Dashboard";
import Prototype from "./Pages/Prototype";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prototype" element={<Prototype />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
