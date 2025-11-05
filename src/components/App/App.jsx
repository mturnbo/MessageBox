import { AuthProvider } from "../../AuthContext.jsx";
import './App.css';
import Header from "../Header/Header.jsx";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
      </div>
    </AuthProvider>
  )
}

export default App
