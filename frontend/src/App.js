import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; 
import HomePage from './page/Home';
import ImagePage from './page/Image';

function App() {
  return (
    <Router>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-6 gap-10">Image Dashboard</h1>

        <Routes>  
          <Route exact path="/" element={<HomePage />} />  
          <Route path="/image/:id" element={<ImagePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
