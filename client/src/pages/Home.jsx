import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate()

    return (
        <div className="relative w-full h-screen overflow-hidden bg-white">
           

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
                {/* Logo section */}
                <div className="mb-12 opacity-0 animate-slide-up" style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}>
                    <img src="/akpsilogo.png" className="h-40 w-40 mx-auto mb-6 opacity-90" alt="AKPsi Logo" />
                </div>
                
                {/* Main heading */}
                <div className="mb-8 opacity-0 animate-slide-up" style={{animationDelay: '0.7s', animationFillMode: 'forwards'}}>
                    <h1 className="text-apple-large md:text-6xl text-black font-light mb-4 tracking-tight leading-tight">
                        Welcome to AKPsi Rush.
                    </h1>
                </div>
                
                {/* Subtitle */}
                <div className="mb-12 opacity-0 animate-slide-up" style={{animationDelay: '1.1s', animationFillMode: 'forwards'}}>
                    <p className="text-apple-title2 text-apple-gray-600 font-light max-w-2xl leading-relaxed">
                        Join Georgia Tech's premier business fraternity for Fall 2025 Rush. 
                        Experience professional development, networking, and brotherhood.
                    </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-slide-up" style={{animationDelay: '1.5s', animationFillMode: 'forwards'}}>
                    <button 
                        onClick={() => navigate('/register')} 
                        className="inline-flex items-center justify-center px-8 py-4 text-apple-body font-light text-white bg-black rounded-apple-2xl transition-all duration-200 ease-out border-0 cursor-pointer select-none hover:bg-apple-gray-800 focus:outline-none focus:ring-2 focus:ring-apple-gray-400 focus:ring-offset-2 active:scale-95 active:bg-apple-gray-900"
                    >
                        Register for Rush
                    </button>
                    <button 
                        onClick={() => navigate("/login")} 
                        className="inline-flex items-center justify-center px-8 py-4 text-apple-body font-light text-black bg-apple-gray-100 rounded-apple-2xl transition-all duration-200 ease-out border-0 cursor-pointer select-none hover:bg-apple-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-gray-400 focus:ring-offset-2 active:scale-95 active:bg-apple-gray-300"
                    >
                        Brother Login
                    </button>
                </div>
    
            </div>
        </div>
    );
}
