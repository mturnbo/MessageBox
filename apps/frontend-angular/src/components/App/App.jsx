import { AuthProvider } from "../../AuthContext.jsx";
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from '../../pages/Home/Home.jsx';
import Login from '../../pages/Login/Login.jsx';
import Header from "../Header/Header.jsx";
import User from '../../pages/Users/User.jsx';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user/:id" element={<User />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
