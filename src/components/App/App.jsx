import { AuthProvider } from "../../AuthContext.jsx";
import './App.css';
import LoginForm from "../LoginForm/LoginForm.jsx";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <h2>Messaging APP</h2>
        <LoginForm />
      </div>
    </AuthProvider>
  )
}

export default App
