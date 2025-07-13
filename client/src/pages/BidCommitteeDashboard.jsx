import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Error from "../components/Error";
import Loader from "../components/Loader";
import Badges from "../components/Badge";
import { verifyUser } from "../js/verifications";
import Button from "../components/Button";

export default function BidCommitteeDashboard(props) {
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
    const [selectedSort, setSelectedSort] = useState("none");
    const [showGTID, setShowGTID] = useState(false);

    const navigate = useNavigate();
    const api = import.meta.env.VITE_API_PREFIX;

    // Function to assign rushee ID based on GTID
    const getRusheeId = (gtid) => {
        // Use the last 4 digits of GTID as the rushee ID, preserving leading zeros
        return gtid.slice(-4);
    };

    // Function to generate a placeholder image with number
    const getPlaceholderImage = (rusheeId) => {
        // Create a canvas-based placeholder image with the number
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 300, 300);
        gradient.addColorStop(0, '#1e3a8a'); // Blue
        gradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);
        
        // Add number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rusheeId.toString(), 150, 150);
        
        return canvas.toDataURL();
    };

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
                                console.log(response.data.payload.length);
                                const shuffledRushees = shuffleArray(response.data.payload);
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

    // Removed fuzzy search - only using exact GTID matching

    const handleSearch = (e) => {
        const input = e.target.value;
        console.log(input);
        setQuery(input);
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

        // Filter by query (search by GTID only)
        if (query.trim() !== "") {
            // Only allow 9-digit GTID for exact matching
            if (query.trim().length === 9 && /^[0-9]+$/.test(query.trim())) {
                const exactMatch = filtered.find(rushee => rushee.gtid === query.trim());
                if (exactMatch) {
                    filtered = [exactMatch];
                } else {
                    filtered = []; // No results for exact GTID match
                }
            } else {
                // Invalid GTID format - show no results
                filtered = [];
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
        } else if (selectedSort === "rusheeId") {
            filtered = [...filtered].sort((a, b) => getRusheeId(a.gtid) - getRusheeId(b.gtid));
        }

        console.log(filtered);
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

                            <div className="pt-20 p-4">
                                <div className="container mx-auto px-4">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <h1 className="text-3xl font-bold text-white mb-2">Bid Committee Mode</h1>
                                        <p className="text-gray-300">Names and faces are replaced with numbers for unbiased evaluation</p>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={handleSearch}
                                            placeholder="Search by 9-digit GTID..."
                                            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 text-white placeholder-gray-400"
                                            maxLength="9"
                                            pattern="[0-9]{9}"
                                        />
                                    </div>



                                    <div className="flex items-center justify-between mt-4">
                                        {/* Filters Group */}
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
                                                    <option value="rusheeId">Sort by Rushee ID</option>
                                                    <option value="firstName">Sort by First Name</option>
                                                    <option value="lastName">Sort by Last Name</option>
                                                </select>
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                                    ▼
                                                </span>
                                            </div>

                                            {/* Toggle GTID Visibility */}
                                            <button
                                                onClick={() => setShowGTID(!showGTID)}
                                                className={`px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                                    showGTID 
                                                        ? 'bg-blue-600 border-blue-500 text-white' 
                                                        : 'bg-slate-700 border-gray-300 text-white'
                                                }`}
                                            >
                                                {showGTID ? 'Hide GTID' : 'Show GTID'}
                                            </button>
                                        </div>

                                        {/* Shuffle Button */}
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
                                        {filteredRushees.map((rushee) => {
                                            const rusheeId = getRusheeId(rushee.gtid);
                                            return (
                                                <div
                                                    onClick={() => {
                                                        window.open(`/brother/rushee/${rushee.gtid}?bid_committee=true`, "_blank");
                                                    }}
                                                    key={rushee.id}
                                                    className="flex cursor-pointer flex-col bg-slate-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-2 border-transparent hover:border-blue-500"
                                                >
                                                    {/* Numbered Picture */}
                                                    <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                                        <span className="text-6xl font-bold text-white">
                                                            {rusheeId}
                                                        </span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex flex-col flex-grow p-4">
                                                        <div className="flex flex-row gap-4 items-center mb-2">
                                                            <h2 className="text-xl font-bold text-white truncate">
                                                                Rushee #{rusheeId}
                                                            </h2>
                                                            {rushee.attendance.map((event, idx) => (
                                                                <Badges text={event.name} key={idx} />
                                                            ))}
                                                        </div>
                                                        
                                                        {showGTID && (
                                                            <p className="text-sm text-gray-400 mb-1">
                                                                GTID: {rushee.gtid}
                                                            </p>
                                                        )}
                                                        
                                                        <p className="text-sm text-gray-400 mb-1 truncate">
                                                            {rushee.major}
                                                        </p>
                                                        
                                                        <p className="text-sm text-gray-400 mb-1 truncate">
                                                            {rushee.class}
                                                        </p>
                                                        
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
                                            );
                                        })}
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