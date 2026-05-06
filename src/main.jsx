import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import IndexPage from './IndexPage.jsx';
import PerceptronDissected from './PerceptronDissected.jsx';
import WallAndWarp from './WallAndWarp.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/part-1" element={<PerceptronDissected />} />
        <Route path="/part-2" element={<WallAndWarp />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
