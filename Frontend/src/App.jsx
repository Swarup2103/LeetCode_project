import {Routes,Route, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import SignUp from "./pages/SignUp";
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector} from 'react-redux';
import { useEffect } from "react";
import AdminPanel from "./pages/AdminPanel";
import CreateProblem from "./pages/CreateProblem";
import UpdateProblem from "./pages/UpdateProblem";
import ProblemPage from "./pages/ProblemPage";
import ProfilePage from "./pages/ProfilePage"; 


function App() {
  const {isAuthenticated, user, loading} = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch(checkAuth());
  },[dispatch])

  if(loading){
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  }
  
  // A component to protect routes that require authentication
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to='/login' />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated || user?.role !== 'admin') {
      return <Navigate to='/' />;
    }
    return children;
  };


  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <HomePage></HomePage> : <Navigate to='/signup'/>}></Route>
        {/* if user is Auth => shift user to Home page, else shift to Signup page */}

        <Route path="/login" element ={isAuthenticated ? <Navigate to='/' /> : <Login></Login>}></Route>
        <Route path="/signup" element ={isAuthenticated ? <Navigate to='/'/> : <SignUp></SignUp> }></Route>

        {/* ✨ FIX: Changed the Route to be self-closing '/>' ✨ */}
        <Route
          path="/problem/:id"
          element = {<ProtectedRoute><ProblemPage /></ProtectedRoute>}
        />

        {/* Profile Route */}
        <Route 
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* Admin Routes */}
        <Route 
          path="/admin"
          element= {<AdminRoute><AdminPanel /></AdminRoute>}
        />
        <Route
          path="/admin/create-problem"
          element={<AdminRoute><CreateProblem /></AdminRoute>}
        />
        <Route
          path="/admin/edit-problem/:id"
          element={<AdminRoute><UpdateProblem /></AdminRoute>}
        />
      </Routes>
    </>
  )
}

export default App

