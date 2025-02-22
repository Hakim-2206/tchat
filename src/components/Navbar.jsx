import React, {useEffect, useRef, useState} from 'react';
import {auth, logout} from "../firebase.js";
import {onAuthStateChanged} from "firebase/auth";

const Navbar = () => {

    const navRef = useRef()
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setUserName(user.displayName);
            } else {
                setUser(null)
                setUserName(null)
            }
        });
        return () => unsubscribe()
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', () => {
            if (window.scrollY >= 80) {
                navRef.current.classList.add('nav-dark')
            } else {
                navRef.current.classList.remove('nav-dark')
            }
        })
    }, []);


    return (
        <div ref={navRef} className="navbar bg-gray-800 text-white py-4 px-6 flex justify-between items-center">
            <div className="navbar-left flex items-center space-x-8">
                <span className="text-2xl font-semibold">TCHAT</span>
            </div>
            <div className="navbar-right flex items-center space-x-4">
                {user ? (
                    <>
                        <p className="text-lg">Hey, <em className="text-blue-500 cursor-pointer text-sm">{userName}</em>
                        </p>
                        <div className="navbar-profile relative">
                            <div className="dropdown">
                                <p
                                    onClick={() => logout()}
                                    className="text-white cursor-pointer hover:text-red-500"
                                >
                                    Se déconnecter
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-lg">Inscription</p>
                )}
            </div>
        </div>
    );
}

export default Navbar;