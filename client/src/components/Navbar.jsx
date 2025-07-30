import React, { useState } from "react";
import { Link } from "react-router-dom";

import { logout } from "../js/user";
import { verifyUser } from "../js/verifications";

export default function Navbar(props) {

    const [showMenu, setShowMenu]= useState(false)
    const stripped = props.stripped ? props.stripped : false

    return (
        <div className="fixed z-50 w-full navbar-apple">
            <nav className="backdrop-blur-md">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a href="/" className="flex items-center space-x-3">
                        <img src="/akpsilogo.png" className="h-8" alt="AKPsi Logo" />
                        <span className="self-center text-apple-title2 font-normal whitespace-nowrap text-black">AKPsi Rush Application</span>
                    </a>
                    <button onClick={() => {
                        setShowMenu(!showMenu)
                    }} type="button" className={stripped ? "hidden": "inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-black rounded-apple md:hidden hover:bg-apple-gray-100 focus:outline-none focus:ring-2 focus:ring-apple-gray-300"} aria-controls="navbar-default" aria-expanded="false">
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div className={showMenu && !stripped ? "w-full md:block md:w-auto" : "hidden w-full md:block md:w-auto"} id="navbar-default">
                        <ul className={!stripped ? "font-normal flex flex-col p-4 md:p-0 mt-4 rounded-apple-lg md:flex-row md:space-x-2 md:mt-0 md:border-0" : "hidden"}>
                            <li>
                                <a href="/dashboard" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2" aria-current="page">Dashboard</a>
                            </li>
                            <li>
                                <a href="/bid-committee" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2">Bid Committee</a>
                            </li>
                            <li>
                                <Link to="/comments" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2">Comments</Link>
                            </li>
                            {/* <li>
                                <a href="/brother/dashboard" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2" aria-current="page">PIS</a>
                            </li>
                            <li>
                                <a href="/brother/pis" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2" aria-current="page">PIS Signup</a>
                            </li> */}
                            <li>
                                <a href="/attendance" target="_blank" className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2">Attendance</a>
                            </li>
                            {verifyUser() ? <li>
                                <p onClick={() => {
                                logout()
                                window.location.reload()
                            }} className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2 cursor-pointer">Logout</p>
                            </li> : <></>}
                        </ul>
                    </div>
                </div>
            </nav>

        </div>
    )
}