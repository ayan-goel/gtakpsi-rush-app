import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function GetImage(props) {

    const [showPreview, setShowPreview] = useState(false)

    const capture = () => {
        const screenshot = props.webcamRef.current.getScreenshot();
        setShowPreview(true)
        props.setImage(screenshot);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-800 text-white">
            <h1 className="mb-2 text-left font-bold bg-gradient-to-r from-sky-700 via-amber-600 to-sky-700 animate-text bg-clip-text text-transparent text-4xl">Capture your photo!</h1>
            <h1 className="text-slate-500 text-left mb-4">Take a picture so we know what you look like during rush.</h1>

            <div className="w-96 h-96 bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                {showPreview ? <img
                    src={props.image}
                    alt="Captured"
                    className="w-96 h-96 rounded-lg shadow-md border border-gray-700"
                /> : <Webcam
                    ref={props.webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                />}
            </div>


                {showPreview ? <div className="flex flex-row gap-6"> 
                    <button
                    onClick={() => {
                        setShowPreview(false)
                    }}
                    className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                >
                    Retake Photo
                </button>
                <button
                    onClick={props.func}
                    className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                >
                    Submit Photo
                </button>
                </div> : <button
                    onClick={capture}
                    className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                >
                    Take Photo
                </button>}

                

            {/* {image && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-3">Preview</h2>
                    <img
                        src={image}
                        alt="Captured"
                        className="w-96 h-96 rounded-lg shadow-md border border-gray-700"
                    />
                </div>
            )} */}
        </div>
    );
}
