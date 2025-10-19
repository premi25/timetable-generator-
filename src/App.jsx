import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Coordinator from './components/Coordinator';
import Faculty from './components/Faculty';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/coordinator" element={<Coordinator />} />
          <Route path="/faculty/:id" element={<Faculty />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;