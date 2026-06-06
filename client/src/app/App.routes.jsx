import {createBrowserRouter, Navigate} from 'react-router'
import PublicRoutes from '../guards/PublicRoutes'
import PrivateRoutes from '../guards/PrivateRoutes'
import AuthLayout from '../features/auth/pages/AuthLayout'
import Home from '../features/main/pages/Home'
import Profile from '../features/main/pages/Profile'
import Library from '../features/main/pages/Library'
import Discover from '../features/main/pages/Discover'
import NotFound from '../features/main/pages/NotFound'
import ForgotPassword from '../features/auth/pages/ForgotPassword'
import GoogleCallback from '../features/auth/pages/GoogleCallback'

const Router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to='/login'/>
    },
    {
        path:'/login',
        element: 
        <PublicRoutes>
            <AuthLayout mode='login'/>
        </PublicRoutes>
    },
    {
        path: '/register',
        element: 
        <PublicRoutes>
            <AuthLayout mode='register'/>
        </PublicRoutes>
    },
    {
        path: '/forgot-password',
        element: 
        <PublicRoutes>
            <ForgotPassword />
        </PublicRoutes>
    },
    {
        path: '/google/callback',
        element:
        <PublicRoutes>
            <GoogleCallback />
        </PublicRoutes>
    },
    {
        path: '/home',
        element: 
        <PrivateRoutes>
            <Home/>
        </PrivateRoutes>
    },
    {
        path: '/profile',
        element: 
        <PrivateRoutes>
            <Profile/>
        </PrivateRoutes>
    },
    {
        path: '/library',
        element: 
        <PrivateRoutes>
            <Library/>
        </PrivateRoutes>
    },
    {
        path: '/discover',
        element: 
        <PrivateRoutes>
            <Discover/>
        </PrivateRoutes>
    },
    {
        path: '*',
        element: <NotFound />
    }
]);

export default Router;