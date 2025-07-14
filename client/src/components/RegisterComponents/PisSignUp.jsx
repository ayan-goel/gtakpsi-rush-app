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
        <div className="w-screen min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center">
            {error ? (
                <div className="text-red-500 text-center mt-4">
                    Error loading timeslots. Please try again later.
                </div>
            ) : (
                <div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="text-center w-full p-8">
                            <h1 className="mb-2 font-bold bg-gradient-to-r from-sky-700 via-amber-600 to-sky-700 animate-text bg-clip-text text-transparent text-4xl">
                                Choose your PIS Timeslot
                            </h1>
                            <h1 className="text-slate-500 mb-4">
                                The PIS is an interview to get to know a little more about you
                                outside of a rush setting.
                            </h1>
                            
                            {/* Warning message for Wednesday slots */}
                            <div className="mb-6 p-4 bg-yellow-900 border border-yellow-600 rounded-lg max-w-4xl mx-auto">
                                <div className="flex items-center gap-2 text-yellow-200">
                                    <span className="text-yellow-400 text-xl">⚠️</span>
                                    <p className="text-sm">
                                        <strong>Please do not sign up for a Wednesday (September 10th) timeslot unless you absolutely have to.</strong> 
                                        If you must, please email <a href="mailto:vmiriyapalli@gatech.edu" className="text-yellow-300 underline">vmiriyapalli@gatech.edu</a> with a reason as to why and she will schedule you between 8:00 PM and 10:15 PM.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <div className="flex gap-8 justify-center items-start max-w-7xl">
                                {[...days.entries()]
                                    .filter(([day]) => {
                                        // Exclude Monday
                                        const jsDate = new Date(day);
                                        return jsDate.getDay() !== 1; // Monday is day 1
                                    })
                                    .map(([day, timeslots]) => (
                                        <div
                                            key={day}
                                            className="bg-gray-800 shadow-lg rounded-lg p-4 flex-shrink-0 min-w-0"
                                        >
                                            <h2 className="text-xl font-semibold text-center mb-4">
                                                {day}
                                            </h2>
                                            <div className="grid grid-cols-6 gap-2 max-w-2xl justify-items-center">
                                                {timeslots.map((slot, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSlotClick(slot)}
                                                        className={`py-2 px-4 rounded-lg transition transform ${
                                                            slot === props.selectedSlot
                                                                ? "outline outline-2 outline-white"
                                                                : ""
                                                        } ${
                                                            slot.num_available === 0
                                                                ? "bg-gray-500 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-sky-700 via-teal-600 to-amber-600 hover:scale-105 hover:shadow-lg"
                                                        }`}
                                                        disabled={slot.num_available === 0}
                                                    >
                                                        {slot.time.toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                        <span className="block text-sm">
                                                            {slot.num_available > 0
                                                                ? `${slot.num_available} slots available`
                                                                : "Full"}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            </div>
                            {props.selectedSlot && (
                                <div className="mt-6 text-center text-green-500">
                                    You selected: {props.selectedSlot.time.toLocaleString()}
                                </div>
                            )}
                            <button
                                onClick={props.func}
                                disabled={!props.selectedSlot}
                                className={`mt-6 py-3 px-6 text-lg font-bold rounded-lg transition ${
                                    props.selectedSlot
                                        ? "bg-gradient-to-r from-amber-600 to-sky-700 hover:scale-105 hover:shadow-lg text-white"
                                        : "bg-gray-500 cursor-not-allowed text-gray-300"
                                }`}
                            >
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
    
}
