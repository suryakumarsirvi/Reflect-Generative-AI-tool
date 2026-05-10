import React from 'react'
import { useDispatch } from 'react-redux'
import { loginService, registerService, logoutService, GoogleAuthURL } from '../services/auth.service';
import { setUser, clearUser } from '../slice/auth.slice';

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
      await logoutService();
      dispatch(clearUser());
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return {handleRegister, handleLogin, handleLogout, GoogleAuthURL, loginService}
}

export default useAuth