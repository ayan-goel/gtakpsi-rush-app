import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import Error from "../components/Error";
import Loader from "../components/Loader";
import Badges from "../components/Badge";

import Fuse from "fuse.js";

import { verifyUser } from "../js/verifications";
import Button from "../components/Button";

export default function Dashboard(props) {
    const [user, setUser] = useState(
        props.user ? props.user : JSON.parse(localStorage.getItem("user"))
    );
    const [loading, setLoading] = useState(true);
    const [errorTitle, setErrorTitle] = useState("Uh Oh! Something unexpected happened.");
    const [errorDescription, setErrorDescription] = useState("");
    const [error, setError] = useState(false);
    const [rushees, setRushees] = useState([]);
    const [filteredRushees, setFilteredRushees] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedMajor, setSelectedMajor] = useState("All");
    const [selectedClass, setSelectedClass] = useState("All");
    const [selectedCloud, setSelectedCloud] = useState("All");
    const [selectedSort, setSelectedSort] = useState("none");

    const navigate = useNavigate();
    const api = import.meta.env.VITE_API_PREFIX;

    function shuffleArray(array) {
        return array
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            await verifyUser()
                .then(async (response) => {
                    if (response === false) {
                        navigate("/");
                    }

                    await axios
                        .get(`${api}/rushee/get-rushees`)
                        .then((response) => {
                            if (response.data.status === "success") {

                                console.log(response.data.payload.length)

                                const shuffledRushees = shuffleArray(response.data.payload); // Shuffle the array
                                setRushees(shuffledRushees);
                                setFilteredRushees(shuffledRushees);

                            } else {
                                setErrorDescription("There was some issue fetching the rushees");
                                setError(true);
                            }
                        })
                        .catch(() => {
                            setErrorDescription("There was some network error while fetching the rushees.");
                            setError(true);
                        });
                })
                .catch(() => {
                    setErrorDescription("There was an error verifying your credentials.");
                    setError(true);
                });

            setLoading(false);
        }

        if (loading === true) {
            fetch();
        }
    }, [loading, navigate]);

    const fuse = new Fuse(rushees, {
        keys: ["name", "gtid", "major", "email"],
        threshold: 0.3, // Less strict
        minMatchCharLength: 1, // Minimum length of matching characters
    });


    const handleSearch = (e) => {
        const input = e.target.value;
        console.log(input)
        setQuery(input);

        // if (input.trim() === "") {
        //     setFilteredRushees(rushees);
        // } else {
        //     const fuzzyResults = fuse.search(input);
        //     setFilteredRushees(fuzzyResults.map((result) => result.item)); // Extract matching items
        // }
    };

    const handleFilters = () => {
        let filtered = rushees;

        // Filter by major
        if (selectedMajor !== "All") {
            filtered = filtered.filter((rushee) => rushee.major === selectedMajor);
        }

        // Filter by class
        if (selectedClass !== "All") {
            filtered = filtered.filter((rushee) => rushee.class === selectedClass);
        }

        // Filter by query
        if (query.trim() !== "") {
            // Check if query is a 9-digit GTID for exact matching
            if (query.trim().length === 9 && /^[0-9]+$/.test(query.trim())) {
                const exactMatch = filtered.find(rushee => rushee.gtid === query.trim());
                if (exactMatch) {
                    filtered = [exactMatch];
                } else {
                    filtered = []; // No results for exact GTID match
                }
            } else {
                // Use fuzzy search for other queries
                const fuzzyResults = fuse.search(query);
                filtered = fuzzyResults.map((result) => result.item);
            }
        }

        // Sort by selected criterion
        if (selectedSort === "firstName") {
            filtered = [...filtered].sort((a, b) => a.name.split(" ")[0].localeCompare(b.name.split(" ")[0]));
        } else if (selectedSort === "lastName") {
            filtered = [...filtered].sort((a, b) => {
                const aLastName = a.name.split(" ").slice(-1)[0];
                const bLastName = b.name.split(" ").slice(-1)[0];
                return aLastName.localeCompare(bLastName);
            });
        }

        console.log(filtered)
        setFilteredRushees(filtered);
    };

    useEffect(() => {
        handleFilters();
    }, [query, selectedMajor, selectedClass, selectedSort]);

    return (
        <div>
            {error ? (
                <Error title={errorTitle} description={errorDescription} />
            ) : (
                <div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="h-screen w-screen bg-slate-800 overflow-y-scroll">
                            <Navbar />

                            <div className="pt-20 p-4"> {/* Adjusted padding to account for Navbar */}
                                <div className="container mx-auto px-4">
                                    {/* Header with Bid Committee Toggle */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h1 className="text-3xl font-bold text-white">Rushee Dashboard</h1>
                                        <button
                                            onClick={() => navigate("/bid-committee")}
                                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                                'bg-blue-600 text-white hover:bg-blue-700' 
                                            }`}
                                        >
                                            Bid Committee Mode
                                        </button>
                                    </div>

                                    {/* Search Bar */}
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={handleSearch}
                                        placeholder="Search rushees..."
                                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 text-white placeholder-gray-400"
                                    />

                                    <div className="flex items-center justify-between mt-4">
                                        {/* Filters Group (Aligned to the Left) */}
                                        <div className="flex flex-wrap gap-4">
                                            {/* Major Filter */}
                                            <div className="relative">
                                                <select
                                                    value={selectedMajor}
                                                    onChange={(e) => setSelectedMajor(e.target.value)}
                                                    className="p-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 text-white appearance-none"
                                                >
                                                    <option value="All">All Majors</option>
                                                    {Array.from(new Set(rushees.map((rushee) => rushee.major))).map((major, idx) => (
                                                        <option key={idx} value={major}>
                                                            {major}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                                    ▼
                                                </span>
                                            </div>

                                            {/* Class Filter */}
                                            <div className="relative">
                                                <select
                                                    value={selectedClass}
                                                    onChange={(e) => setSelectedClass(e.target.value)}
                                                    className="p-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 text-white appearance-none"
                                                >
                                                    <option value="All">All Classes</option>
                                                    {Array.from(new Set(rushees.map((rushee) => rushee.class))).map((classYear, idx) => (
                                                        <option key={idx} value={classYear}>
                                                            {classYear}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                                    ▼
                                                </span>
                                            </div>

                                            {/* Sorting Dropdown */}
                                            <div className="relative">
                                                <select
                                                    value={selectedSort}
                                                    onChange={(e) => setSelectedSort(e.target.value)}
                                                    className="p-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 text-white appearance-none"
                                                >
                                                    <option value="none">No Sorting</option>
                                                    <option value="firstName">Sort by First Name</option>
                                                    <option value="lastName">Sort by Last Name</option>
                                                </select>
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* Shuffle Button (Aligned to the Right) */}
                                        <div onClick={() => {
                                            const shuffled = shuffleArray(rushees);
                                            setFilteredRushees(shuffled);
                                        }}>
                                            <Button text={"Shuffle Rushees"} />
                                        </div>
                                    </div>

                                </div>

                                <div className="container mx-auto px-4">
                                    <div className="grid gap-6 mt-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredRushees.map((rushee) => (
                                            <div
                                                onClick={() => {
                                                    window.open(`/brother/rushee/${rushee.gtid}`, "_blank");
                                                }}
                                                key={rushee.id}
                                                className="flex cursor-pointer flex-col bg-slate-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-2 border-transparent hover:border-blue-500"
                                            >
                                                {/* Picture */}
                                                <img
                                                    className="w-full h-48 object-cover"
                                                    src={rushee.image_url}
                                                    alt={rushee.name}
                                                />

                                                {/* Content */}
                                                <div className="flex flex-col flex-grow p-4">
                                                    <div className="flex flex-row gap-4">

                                                        <h2 className="text-xl font-bold text-white mb-2 truncate">
                                                            {rushee.name}
                                                        </h2>
                                                        {rushee.attendance.map((event, idx) => (
                                                            <Badges text={event.name} key={idx} />
                                                        ))}

                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-1 truncate">
                                                        {rushee.email}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mb-1 truncate">
                                                        {rushee.major}
                                                    </p>
                                                    <p className="text-sm text-gray-400">GTID: {rushee.gtid}</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {rushee.ratings.map((rating, rIdx) => (
                                                            <span
                                                                key={rIdx}
                                                                className="bg-slate-500 text-gray-200 px-2 py-1 rounded text-sm"
                                                            >
                                                                {rating.name}: {((rating.value / 5) * 100).toFixed(2)}%
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            <div className="h-10" />

                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
