import React, { useState, useEffect } from "react";

export default function BasicInfo(props) {

    return (
        <div className="mt-16 p-4">
            <h1 className="mb-2 text-left font-bold bg-gradient-to-r from-sky-700 via-amber-600 to-sky-700 animate-text bg-clip-text text-transparent text-4xl">
                Basic Info
            </h1>
            <h1 className="text-slate-500 text-left mb-4">
                First, let's get some basic information about you!
            </h1>
            <form className="text-left w-full max-w-lg mx-auto">
                {/* Row 1: First and Last Name */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full sm:w-1/2 px-3 mb-4 sm:mb-0">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-first-name">
                            First Name
                        </label>
                        <input
                            ref={props.firstname}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-first-name"
                            type="text"
                            placeholder="George"
                        />
                    </div>
                    <div className="w-full sm:w-1/2 px-3">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-last-name">
                            Last Name
                        </label>
                        <input
                            ref={props.lastname}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-last-name"
                            type="text"
                            placeholder="Burdell"
                        />
                    </div>
                </div>

                {/* Row 2: Email */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full px-3">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-email">
                            GT Email
                        </label>
                        <input
                            ref={props.email}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-email"
                            type="email"
                            placeholder="gburdell3@gatech.edu"
                        />
                    </div>
                </div>

                {/* Row 3: Housing and Phone */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full sm:w-1/2 px-3 mb-4 sm:mb-0">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-housing">
                            Housing
                        </label>
                        <input
                            ref={props.housing}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-housing"
                            type="text"
                            placeholder="Glenn 346"
                        />
                    </div>
                    <div className="w-full sm:w-1/2 px-3">
                        <label
                            className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2"
                            htmlFor="grid-phone"
                        >
                            Phone
                        </label>
                        <input
                            ref={props.phone}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-phone"
                            type="tel"
                            placeholder="(123) 456-7890"
                            onChange={(e) => {
                                const input = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                                const formatted = input
                                    .replace(/^(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3") // Format for full phone numbers
                                    .replace(/^(\d{3})(\d{1,3})$/, "($1) $2") // Format for partial numbers
                                    .replace(/^(\d{1,3})$/, "($1"); // Format for the area code only
                                e.target.value = formatted;
                            }}
                        />
                    </div>
                </div>

                {/* Row 4: GTID and Major */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full sm:w-1/2 px-3 mb-4 sm:mb-0">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-gtid">
                            GTID
                        </label>
                        <input
                            ref={props.gtid}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-gtid"
                            type="text"
                            placeholder="903753779"
                        />
                    </div>
                    <div className="w-full sm:w-1/2 px-3">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-major">
                            Major
                        </label>
                        <select
                            ref={props.major}
                            className="block appearance-none w-full bg-gray-700 text-gray-200 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-year"
                        >
                            <option>Aerospace Engineering</option>
                            <option>Applied Languages and Intercultural Studies</option>
                            <option>Architecture</option>
                            <option>Biochemistry</option>
                            <option>Biology</option>
                            <option>Biomedical Engineering</option>
                            <option>Business Administration</option>
                            <option>Chemical and Biomolecular Engineering</option>
                            <option>Chemistry</option>
                            <option>Civil Engineering</option>
                            <option>Computational Media</option>
                            <option>Computer Engineering</option>
                            <option>Computer Science</option>
                            <option>Earth and Atmospheric Sciences</option>
                            <option>Economics</option>
                            <option>Economics and International Affairs</option>
                            <option>Electrical Engineering</option>
                            <option>Environmental Engineering</option>
                            <option>Global Economics and Modern Languages</option>
                            <option>History, Technology, and Society</option>
                            <option>Industrial Design</option>
                            <option>Industrial Engineering</option>
                            <option>International Affairs</option>
                            <option>International Affairs and Modern Languages</option>
                            <option>Literature, Media, and Communication</option>
                            <option>Materials Science and Engineering</option>
                            <option>Mathematics</option>
                            <option>Mechanical Engineering</option>
                            <option>Nuclear and Radiological Engineering</option>
                            <option>Neuroscience</option>
                            <option>Physics</option>
                            <option>Psychology</option>
                            <option>Public Policy</option>

                        </select>
                    </div>
                </div>

                {/* Row 5: Pronouns and Year */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full sm:w-1/2 px-3 mb-4 sm:mb-0">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-pronouns">
                            Pronouns
                        </label>
                        <select
                            ref={props.pronouns}
                            className="appearance-none block w-full bg-gray-700 text-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-pronouns"
                        >
                            <option value="">Select pronouns</option>
                            <option value="he/him">he/him</option>
                            <option value="she/her">she/her</option>
                            <option value="they/them">they/them</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-1/2 px-3">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-year">
                            Year
                        </label>
                        <select
                            ref={props.year}
                            className="block appearance-none w-full bg-gray-700 text-gray-200 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-year"
                        >
                            <option>First</option>
                            <option>Second</option>
                            <option>Third</option>
                            <option>Fourth</option>
                            <option>Fifth+</option>
                        </select>
                    </div>
                </div>

                {/* Row 6: Exposure */}
                <div className="flex flex-wrap -mx-3 mb-4">
                    <div className="w-full px-3">
                        <label className="block uppercase tracking-wide text-gray-100 text-xs font-bold mb-2" htmlFor="grid-exposure">
                            How did you find us?
                        </label>

                        <select
                            ref={props.exposure}
                            className="block appearance-none w-full bg-gray-700 text-gray-200 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring focus:ring-blue-400"
                            id="grid-year"
                        >

                            <option>Friend or relative in GT AKPsi</option>
                            <option>Friend or relative NOT in GT AKPsi</option>
                            <option>Instagram Account</option>
                            <option>Instagram Ad</option>
                            <option>GT 1000/2000 Advertisement</option>
                            <option>Email Newsletter</option>
                            <option>Canvas Announcement</option>
                            <option>TikTok</option>
                            <option>LinkedIn</option>
                            <option>Reddit</option>
                            <option>Email</option>
                            <option>Flyer Found on Campus</option>
                            <option>Via Another Organization</option>
                            <option>AKPsi Website/Online Search</option>
                            <option>Virtual Information Session</option>
                            <option>Resume Blitz</option>
                            <option>Fall Org Fair</option>
                            <option>Interest Night</option>
                            <option>Scheller Org Fair</option>
                            <option>Tabling Event</option>

                        </select>

                    </div>

                    <div className="w-full pb-10 flex justify-center">
                    <button
                        onClick={props.func}
                        className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                        type="button"
                    >
                        Submit
                    </button>
                </div>

                </div>
                


            </form>
        </div>

    )

}