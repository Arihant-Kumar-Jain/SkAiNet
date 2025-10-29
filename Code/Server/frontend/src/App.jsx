import { useEffect } from 'react';
import { Routes, Route   } from "react-router-dom";  
 
import Navbar from "./components/Navbar";
import LandingPage from './pages/LandingPage';

function App() { 
   
 
  return (
    <div> 
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} /> 
      </Routes>
    </div>
  )
}

export default App
