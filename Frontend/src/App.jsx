import {Routes,Route, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import SignUp from "./pages/SignUp";
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector} from 'react-redux';
import { useEffect } from "react";

function App() {
  const {isAuthenticated} = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch(checkAuth());
  },[dispatch])

  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <HomePage></HomePage> : <Navigate to='/signup'/>}></Route>
        {/* if user is Auth => shift user to Home page, else shift to Signup page */}

        <Route path="/login" element ={isAuthenticated ? <Navigate to='/' /> : <Login></Login>}></Route>
        <Route path="/signup" element ={isAuthenticated ? <Navigate to='/'/> : <SignUp></SignUp> }></Route>
      </Routes>
    </>
  )
}

export default App
