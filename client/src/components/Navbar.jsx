import React, { useState } from "react";
import { Link } from "react-router-dom";

import { logout } from "../js/user";
import { verifyUser } from "../js/verifications";

export default function Navbar(props) {

    const [showMenu, setShowMenu]= useState(false)
    const stripped = props.stripped ? props.stripped : false

    return (
        <div className="fixed z-50 text-white w-full bg-gradient-to-r from-sky-700 to-amber-600">
            <nav class="backdrop-blur-sm">
                <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
                        <img src="/akpsilogo.png" class="h-8" alt="AKPsi Logo" />
                        <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">AKPsi Rush Application</span>
                    </a>
                    <button onClick={() => {
                        setShowMenu(!showMenu)
                    }} data-collapse-toggle="navbar-default" type="button" className={stripped ? "hidden": "inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600"} aria-controls="navbar-default" aria-expanded="false">
                        <span class="sr-only">Open main menu</span>
                        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div class={showMenu && !stripped ? "w-full md:block md:w-auto" : "hidden w-full md:block md:w-auto"} id="navbar-default">
                        <ul class={!stripped ? "font-medium flex flex-col p-4 md:p-0 mt-4 border rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0" : "hidden"}>
                            <li>
                                <a href="/dashboard" class="block py-2 px-3 text-whit rounded md:bg-transparent md:p-0 dark:text-white" aria-current="page">Dashboard</a>
                            </li>
                            <li>
                                <a href="/bid-committee" class="block py-2 px-3 text-white rounded md:border-0 md:p-0 dark:text-white">Bid Committee</a>
                            </li>
                            <li>
                                <Link to="/comments" className="block py-2 px-3 text-white rounded md:border-0 md:p-0 dark:text-white">Comments</Link>
                            </li>
                            {/* <li>
                                <a href="/brother/dashboard" class="block py-2 px-3 text-whit rounded md:bg-transparent md:p-0 dark:text-white" aria-current="page">PIS</a>
                            </li>
                            <li>
                                <a href="/brother/pis" class="block py-2 px-3 text-whit rounded md:bg-transparent md:p-0 dark:text-white" aria-current="page">PIS Signup</a>
                            </li> */}
                            <li>
                                <a href="/attendance" target="_blank" class="block py-2 px-3 text-white rounded md:border-0 md:p-0 dark:text-whit">Attendance</a>
                            </li>
                            {verifyUser() ? <li>
                                <p onClick={() => {
                                logout()
                                window.location.reload()
                            }} class="block py-2 px-3 text-white rounded md:border-0 md:p-0 dark:text-whit">Logout</p>
                            </li> : <></>}
                        </ul>
                    </div>
                </div>
            </nav>

        </div>
    )
}