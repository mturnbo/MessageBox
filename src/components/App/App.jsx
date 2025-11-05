import { AuthProvider } from "../../AuthContext.jsx";
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login/Login.jsx';
import Header from "../Header/Header.jsx";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
