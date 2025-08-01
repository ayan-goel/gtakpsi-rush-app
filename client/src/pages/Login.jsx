import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom'

import { verifyUser } from "../js/verifications";
import Loader from "../components/Loader";
import { login } from "../js/user";
import Navbar from "../components/Navbar";

export default function Login() {

    const [loading, setLoading] = useState(true)
    
    const navigate = useNavigate()

    useEffect(() => {

        async function fetch() {
            setLoading(true)
            const well = await verifyUser()
            .then((response) => {
                console.log(response)
                if (response == true) {
                    navigate('/dashboard')
                } else {
                    setLoading(false)
                }
            })
            .catch((error) => {
                console.log(error)
                setLoading(false)
            })
        }

        if (loading == true) {
            fetch()
        }

    })

    const email = useRef()
    const password = useRef()

    return (
        <div className="bg-white min-h-screen">
            <Navbar/>
            {loading ? <Loader/> : <div className="animate-fade-in">
            <div className="text-left">
                    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                        <a href="#" className="flex items-center mb-8 animate-slide-up">
                            <img className="w-20 h-20 mr-3" src="akpsilogo.png" alt="logo"/>
                        </a>
                        <div className="w-96 card-apple animate-slide-up" style={{animationDelay: '0.1s'}}>
                            <div className="p-8 space-y-6">
                                <div className="text-center">
                                    <h1 className="text-apple-title1 font-light text-black mb-2">
                                        Welcome Back
                                    </h1>
                                    <p className="text-apple-subheadline text-apple-gray-600">
                                        Sign in to your account
                                    </p>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block mb-2 text-apple-footnote font-normal text-apple-gray-700">Email Address</label>
                                        <input 
                                            ref={email} 
                                            type="email" 
                                            name="email" 
                                            id="email" 
                                            className="input-apple" 
                                            placeholder="name@gatech.edu" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block mb-2 text-apple-footnote font-normal text-apple-gray-700">Password</label>
                                        <input 
                                            ref={password} 
                                            type="password" 
                                            name="password" 
                                            id="password" 
                                            placeholder="Enter your password" 
                                            className="input-apple" 
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <Link to='https://gtakpsi-points-tracker.web.app/user/recover'>
                                            <p className="text-apple-footnote font-normal text-black hover:text-apple-gray-600 transition-colors duration-200">Forgot Password?</p>
                                        </Link>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            const x = await login({
                                                email: email.current?.value,
                                                pwd: password.current?.value,
                                            })
                                            .then((response) => {
                                                if (response == true) {
                                                    navigate('/dashboard')
                                                }
                                            })
                                        }} 
                                        className="btn-apple w-full"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>}
        </div>
    )
}