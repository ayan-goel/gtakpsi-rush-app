import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import Error from "../components/Error";
import Loader from "../components/Loader";
import Badges from "../components/Badge";
import { verifyUser } from "../js/verifications";
import { toast } from "react-toastify";

export default function GTIDSearch() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [loading, setLoading] = useState(true);
    const [errorTitle, setErrorTitle] = useState("Uh Oh! Something unexpected happened.");
    const [errorDescription, setErrorDescription] = useState("");
    const [error, setError] = useState(false);
    const [gtidInput, setGtidInput] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);

    const navigate = useNavigate();
    const api = import.meta.env.VITE_API_PREFIX;

    // Function to assign rushee ID based on GTID
    const getRusheeId = (gtid) => {
        // Use the last 4 digits of GTID as the rushee ID, preserving leading zeros
        return gtid.slice(-4);
    };

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            await verifyUser()
                .then(async (response) => {
                    if (response === false) {
                        navigate("/");
                    }
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

    const handleGTIDSearch = async () => {
        const gtid = gtidInput.trim();
        
        if (gtid.length !== 9) {
            toast.error("Please enter a valid 9-digit GTID", {
                position: "top-center",
                autoClose: 3000,
                theme: "dark",
            });
            return;
        }

        if (!/^[0-9]+$/.test(gtid)) {
            toast.error("GTID must contain only numbers", {
                position: "top-center",
                autoClose: 3000,
                theme: "dark",
            });
            return;
        }

        setSearching(true);
        try {
            const response = await axios.get(`${api}/rushee/${gtid}`);
            
            if (response.data.status === "success") {
                setSearchResult(response.data.payload);
            } else {
                toast.error(`No rushee found with GTID: ${gtid}`, {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                });
                setSearchResult(null);
            }
        } catch (error) {
            console.error("Search error:", error);
            if (error.response?.status === 404) {
                toast.error(`No rushee found with GTID: ${gtid}`, {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                });
            } else {
                toast.error("Error searching for rushee", {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                });
            }
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGTIDSearch();
        }
    };

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
                                <div className="container mx-auto px-4 max-w-4xl">
                                    {/* Header */}
                                    <div className="mb-8 text-center">
                                        <h1 className="text-4xl font-bold text-white mb-2">GTID Search</h1>
                                        <p className="text-gray-300 text-lg">Quickly find rushees by their GTID</p>
                                    </div>

                                    {/* Search Section */}
                                    <div className="bg-slate-700 rounded-lg p-6 mb-8">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <input
                                                type="text"
                                                value={gtidInput}
                                                onChange={(e) => setGtidInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Enter 9-digit GTID..."
                                                className="flex-1 p-4 text-xl rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-600 text-white placeholder-gray-400"
                                                maxLength="9"
                                                pattern="[0-9]{9}"
                                            />
                                            <button
                                                onClick={handleGTIDSearch}
                                                disabled={searching}
                                                className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
                                                    searching 
                                                        ? 'bg-gray-500 cursor-not-allowed' 
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                } text-white`}
                                            >
                                                {searching ? 'Searching...' : 'Search GTID'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Results Section */}
                                    {searchResult && (
                                        <div className="bg-slate-700 rounded-lg p-6">
                                            <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
                                            
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Normal View */}
                                                <div className="bg-slate-600 rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold text-white mb-3">Normal View</h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-gray-300">Name: </span>
                                                            <span className="text-white font-semibold">{searchResult.first_name} {searchResult.last_name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">GTID: </span>
                                                            <span className="text-white font-semibold">{searchResult.gtid}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Email: </span>
                                                            <span className="text-white">{searchResult.email}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Major: </span>
                                                            <span className="text-white">{searchResult.major}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Class: </span>
                                                            <span className="text-white">{searchResult.class}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.open(`/brother/rushee/${searchResult.gtid}`, "_blank")}
                                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        View Full Profile
                                                    </button>
                                                </div>

                                                {/* Bid Committee View */}
                                                <div className="bg-slate-600 rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold text-white mb-3">Bid Committee View</h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-gray-300">Rushee ID: </span>
                                                            <span className="text-white font-semibold">#{getRusheeId(searchResult.gtid)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">GTID: </span>
                                                            <span className="text-white font-semibold">{searchResult.gtid}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Major: </span>
                                                            <span className="text-white">{searchResult.major}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Class: </span>
                                                            <span className="text-white">{searchResult.class}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-300">Attendance: </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {searchResult.attendance.map((event, idx) => (
                                                                    <Badges text={event.name} key={idx} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.open(`/brother/rushee/${searchResult.gtid}?bid_committee=true`, "_blank")}
                                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        View Full Profile
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Instructions */}
                                    <div className="mt-8 bg-slate-700 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-white mb-3">How to Use</h3>
                                        <ul className="text-gray-300 space-y-2">
                                            <li>• Enter the 9-digit GTID of the rushee you want to find</li>
                                            <li>• The search will show both normal and bid committee views</li>
                                            <li>• Click "View Full Profile" to see complete rushee information</li>
                                            <li>• Use the bid committee view for unbiased evaluation</li>
                                        </ul>
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