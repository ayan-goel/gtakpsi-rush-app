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
        <div className="bg-slate-800">
            <Navbar/>
            {loading ? <Loader/> : <div>
            <div className="text-left">
                    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                        <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                            <img class="w-8 h-8 mr-2" src="akpsilogo.png" alt="logo"/>
                                AKPsi Rush Application
                        </a>
                        <div class="w-96 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                            <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                    Sign in to your account
                                </h1>
                                <div class="space-y-4 md:space-y-6">
                                    <div>
                                        <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                                        <input ref={email} type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-amber-600 focus:border-amber-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required=""/>
                                    </div>
                                    <div>
                                        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                        <input ref={password} type="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-amber-600 focus:border-amber-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required=""/>
                                    </div>
                                    <div class="flex items-center justify-between">
                                    <Link to='https://gtakpsi-points-tracker.web.app/user/recover'><p class="text-sm font-medium text-amber-600 hover:underline dark:text-amber-500">Forgot Password?</p></Link>
                                    </div>
                                    <button onClick={async () => {
                                        const x = await login({
                                            email: email.current?.value,
                                            pwd: password.current?.value,
                                        })
                                        .then((response) => {
                                            if (response == true) {
                                                navigate('/dashboard')
                                            }
                                        })
                                    }} class="w-full text-white bg-amber-600 hover:bg-amber-700 focus:ring-4 focus:outline-none focus:ring-amber-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus:ring-amber-800">Sign in</button>
                                
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>}
        </div>
    )
}