import React, {useEffect} from 'react';
import {Route, Routes, useNavigate} from "react-router-dom";
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/Login.jsx";
import {ToastContainer} from "react-toastify";
import {onAuthStateChanged} from 'firebase/auth'
import {auth} from "./firebase.js";
import 'react-toastify/dist/ReactToastify.css'

const App = () => {

    const navigate = useNavigate()

    useEffect(() => {
        onAuthStateChanged(auth,async (user) => {
            if (user) {
                console.log("Logged In")
                navigate('/')
            } else {
                console.log("Logged Out")
                navigate('/login')
            }
        })
    }, []);

    return (
        <div>
            <ToastContainer theme="colored"/>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login/>}/>
            </Routes>
        </div>
    );
}

export default App;