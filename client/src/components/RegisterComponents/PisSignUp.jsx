import React, { useState, useEffect } from "react";
import Loader from "../Loader";
import axios from "axios";

export default function PisSignUp(props) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // maps datetime object to an array of timeslots
    const [days, setDays] = useState(new Map());

    useEffect(() => {
        async function fetch() {
            // const api = process.env.REACT_APP_API_PREFIX
            const api = import.meta.env.VITE_API_PREFIX;

            await axios.get(`${api}/admin/get_pis_timeslots`).then((response) => {
                if (response.data.status && response.data.status == "success") {
                    const tempDays = new Map();

                    for (const slot in response.data.payload) {
                        const jsDate = new Date(
                            parseInt(response.data.payload[slot].time.$date.$numberLong)
                        );

                        const day = jsDate.toDateString(); // Grouping by the full date

                        if (tempDays.has(day)) {
                            tempDays.get(day).push({
                                time: jsDate,
                                num_available: response.data.payload[slot].num_available,
                            });
                        } else {
                            tempDays.set(day, [
                                {
                                    time: jsDate,
                                    num_available: response.data.payload[slot].num_available,
                                },
                            ]);
                        }

                        setDays(tempDays);
                    }
                } else {
                    setError(true);
                }
            });

            setLoading(false);
        }

        if (loading === true) {
            fetch();
        }
    });

    const handleSlotClick = (slot) => {
        props.setSelectedSlot(slot);
    };

    return (
        <div className="w-screen min-h-screen bg-white flex flex-col justify-center items-center pt-16">
            {error ? (
                <div className="card-apple p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-apple-gray-100 rounded-apple-2xl border border-apple-gray-200 mb-4 mx-auto">
                        <svg className="w-8 h-8 text-apple-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-apple-title2 font-light text-black mb-2">Unable to Load Timeslots</h3>
                    <p className="text-apple-body text-apple-gray-600 font-light">Please try again later or contact support.</p>
                </div>
            ) : (
                <div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="text-center w-full p-8 max-w-7xl mx-auto mb-16">
                            {/* Header Section */}
                            <div className="mb-8">
                                <h1 className="mb-3 text-apple-large font-light text-black">
                                    Choose Your PIS Start Time
                                </h1>
                                <div className="w-16 h-0.5 bg-black mx-auto mb-4"></div>
                                <p className="text-apple-subheadline text-apple-gray-600 font-light max-w-2xl mx-auto">
                                    The PIS is an interview to get to know a little more about you outside of a rush setting
                                </p>
                            </div>
                            
                            {/* Warning message for Wednesday slots */}
                            <div className="mb-8 flex justify-center">
                                <div className="bg-orange-50 border border-orange-200 rounded-apple-2xl p-6 max-w-2xl">
                                    <div className="flex items-start gap-3">
                                        <span className="text-orange-500 text-lg mt-0.5">⚠️</span>
                                        <div className="text-left">
                                            <p className="text-apple-body text-orange-800 font-normal leading-relaxed">
                                                <strong className="font-medium text-orange-900">Please do not sign up for a Wednesday (September 10th) timeslot unless you absolutely have to. </strong> 
                                                If you must, please email <a href="mailto:vmiriyapalli@gatech.edu" className="text-orange-700 underline hover:text-orange-600 transition-colors duration-200">vmiriyapalli@gatech.edu</a> with a reason as to why and she will schedule you between 8:00 PM and 10:15 PM.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Timeslot Selection */}
                            <div>
                                <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
                                    {[...days.entries()]
                                        .filter(([day]) => {
                                            // Exclude Monday
                                            const jsDate = new Date(day);
                                            return jsDate.getDay() !== 1; // Monday is day 1
                                        })
                                        .map(([day, timeslots]) => (
                                            <div
                                                key={day}
                                                className="card-apple p-6 flex-shrink-0 min-w-0"
                                            >
                                                <h2 className="text-apple-title2 font-light text-black text-center mb-6">
                                                    {day}
                                                </h2>
                                                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 max-w-2xl">
                                                    {timeslots.map((slot, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSlotClick(slot)}
                                                            className={`py-3 px-4 rounded-apple-xl transition-all duration-200 text-center ${
                                                                slot === props.selectedSlot
                                                                    ? "ring-2 ring-black ring-offset-2 bg-black text-white"
                                                                    : ""
                                                            } ${
                                                                slot.num_available === 0
                                                                    ? "bg-apple-gray-100 text-apple-gray-400 cursor-not-allowed border border-apple-gray-200"
                                                                    : slot === props.selectedSlot
                                                                    ? "bg-black text-white"
                                                                    : "bg-white border border-apple-gray-300 text-black hover:bg-apple-gray-50 hover:border-apple-gray-400 active:scale-95"
                                                            }`}
                                                            disabled={slot.num_available === 0}
                                                        >
                                                            <div className="text-apple-footnote font-medium">
                                                                {slot.time.toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>
                                                            <div className="text-apple-caption1 mt-1 opacity-75">
                                                                {slot.num_available > 0
                                                                    ? `${slot.num_available} left`
                                                                    : "Full"}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            {/* Flexibility Checkbox */}
                            {props.selectedSlot && (
                                <div className="mt-8 flex justify-center">
                                    <div className="card-apple p-6 inline-block">
                                        <label className="flex items-start cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={props.flexWindow}
                                                    onChange={(e) => props.setFlexWindow(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 mr-4 flex items-center justify-center ${
                                                    props.flexWindow 
                                                        ? "bg-black border-black" 
                                                        : "bg-white border-apple-gray-300 group-hover:border-apple-gray-400"
                                                }`}>
                                                    {props.flexWindow && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-apple-body text-black font-medium">
                                                    Flex Window: I can shift my start time +/-30 minutes if needed
                                                </p>
                                                <p className="text-apple-caption1 text-apple-gray-600 font-light mt-1">
                                                    This helps with scheduling flexibility
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                            
                            {/* Submit Button */}
                            <div className="mt-8 flex flex-col items-center">
                                {props.selectedSlot && (
                                    <p className="text-apple-body text-apple-gray-600 font-light mb-4">
                                        Selected: <span className="font-medium text-black">{props.selectedSlot.time.toLocaleString()}</span>
                                    </p>
                                )}
                                <button
                                    onClick={props.func}
                                    disabled={!props.selectedSlot}
                                    className={`px-8 py-4 text-apple-headline font-light rounded-apple-2xl transition-all duration-200 ${
                                        props.selectedSlot
                                            ? "btn-apple"
                                            : "bg-apple-gray-200 text-apple-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    Continue to Complete Registration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
    
}
