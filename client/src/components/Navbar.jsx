import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { logout } from "../js/user";
import { verifyUser } from "../js/verifications";

export default function Navbar(props) {
    const [showMenu, setShowMenu] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const stripped = props.stripped ? props.stripped : false;

    useEffect(() => {
        async function checkAuth() {
            try {
                const authenticated = await verifyUser();
                setIsAuthenticated(authenticated);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        }
        
        checkAuth();
    }, []);

    // Don't render navbar if user is not authenticated
    if (isLoading) {
        return null; // or a loading spinner if you prefer
    }
    
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="fixed z-50 w-full navbar-apple">
            <nav className="backdrop-blur-md">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a href="/" className="flex items-center space-x-3">
                        <img src="/akpsilogo.png" className="h-8" alt="AKPsi Logo" />
                        <span className="self-center text-apple-title2 font-normal whitespace-nowrap text-black">
                            AKPsi Rush Application
                        </span>
                    </a>
                    <button
                        onClick={() => {
                            setShowMenu(!showMenu);
                        }}
                        type="button"
                        className={
                            stripped
                                ? "hidden"
                                : "inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-black rounded-apple md:hidden hover:bg-apple-gray-100 focus:outline-none focus:ring-2 focus:ring-apple-gray-300"
                        }
                        aria-controls="navbar-default"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 17 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1h15M1 7h15M1 13h15"
                            />
                        </svg>
                    </button>
                    <div
                        className={
                            showMenu && !stripped
                                ? "w-full md:block md:w-auto"
                                : "hidden w-full md:block md:w-auto"
                        }
                        id="navbar-default"
                    >
                        <ul
                            className={
                                !stripped
                                    ? "font-normal flex flex-col p-4 md:p-0 mt-4 rounded-apple-lg md:flex-row md:space-x-2 md:mt-0 md:border-0"
                                    : "hidden"
                            }
                        >
                            <li>
                                <a
                                    href="/dashboard"
                                    className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2"
                                    aria-current="page"
                                >
                                    Dashboard
                                </a>
                            </li>



                            <li>
                                <Link
                                    to="/comments"
                                    className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2"
                                >
                                    Comments
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="/attendance"
                                    target="_blank"
                                    className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2"
                                >
                                    Attendance
                                </a>
                            </li>

                            {/* More menu */}
                            <li className="relative">
                                <button
                                    onClick={() => setShowMore(!showMore)}
                                    className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2"
                                >
                                    More ▾
                                </button>
                                {showMore && (
                                    <ul className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 w-48 z-50">
                                        <li>
                                            <a
                                                href="/bid-committee"
                                                className="block px-4 py-2 text-black hover:bg-apple-gray-100"
                                            >
                                                Bid Committee
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="/voting"
                                                className="block px-4 py-2 text-black hover:bg-apple-gray-100"
                                            >
                                                Voting
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="/admin/voting"
                                                className="block px-4 py-2 text-black hover:bg-apple-gray-100"
                                            >
                                                Voting Dashboard
                                            </a>
                                        </li>
                                    </ul>
                                )}
                            </li>

                            <li>
                                <p
                                    onClick={() => {
                                        logout();
                                        window.location.reload();
                                    }}
                                    className="block py-2 px-4 text-black rounded-apple hover:bg-apple-gray-100 transition-colors duration-200 md:p-2 cursor-pointer"
                                >
                                    Logout
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    );
}
