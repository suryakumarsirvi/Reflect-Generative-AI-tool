import React from 'react'
import { useDispatch } from 'react-redux'
import { loginService, registerService, logoutService, GoogleAuthURL, AppleAuthURL, } from '../services/auth.service';
import { setUser } from '../slice/auth.slice';

const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = async(data)=>{
    try {
      const response = await registerService(data);
      dispatch(setUser(response.user || response));
    } catch (error) {
      console.error("Registration failed", error);
    }
  }

  const handleLogin = async(data)=>{
    try {
      const response = await loginService(data);
      dispatch(setUser(response.user || response));
    } catch (error) {
      console.error("Login failed", error);
    }
  }

  const handleLogout = async()=>{
    try {
      const response = await logoutService();
      dispatch(se)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return {handleRegister, handleLogin, GoogleAuthURL, AppleAuthURL, loginService}
}

export default useAuth