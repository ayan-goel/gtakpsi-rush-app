import React, { useState } from "react";
import { useAdminVotingContext } from "./AdminVotingContext";
import { verifyUser } from "../../js/verifications";
import axios from "axios";
import Loader from "../../components/Loader";
import { Rushee } from "./types";
import { toast } from "react-toastify";

export default function RusheePreviewCard() {
    const { rushee, setRushee } = useAdminVotingContext();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [allRushees, setAllRushees] = useState<Rushee[] | null>(null);
    const [loading, setLoading] = useState(false);

    const api = import.meta.env.VITE_API_PREFIX;

    const handleClick = async () => {

        console.log(allRushees)

        if (dropdownOpen) {
            setDropdownOpen(false);
            return;
        }

        setDropdownOpen(true);
        if (!allRushees) {
            setLoading(true);

            try {
                const response = await axios.get(`${api}/rushee/get-rushees`);
                if (response.data.status === "success") {
                    setAllRushees(response.data.payload);
                } else {
                    console.error("Failed to fetch rushees");
                }
            } catch (err) {
                console.error("Network error while fetching rushees");
            }

            setLoading(false);
        }
    };

    const handleSelect = async (selected: Rushee) => {

        console.log(selected)

        const payload = { gtid: selected.gtid };

        await toast.promise(
            axios.post(`${api}/admin/voting/change-rushee`, payload),
            {
                pending: "Updating rushee...",
                success: "Rushee updated successfully!",
                error: "Failed to update rushee",
            },
            {
                position: "top-center",
                theme: "light",
            }
        );

        setDropdownOpen(false);
    };

    return (
        <div className="relative w-full">
            
            {rushee ? <div
                onClick={handleClick}
                className="card-apple flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-apple hover:shadow-md transition-all duration-200 cursor-pointer"
            >
                <img
                    src={rushee.image_url}
                    alt={`${rushee.first_name} ${rushee.last_name}`}
                    className="w-32 h-32 object-cover rounded-apple-2xl border border-apple-gray-200"
                />

                <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-apple-title1 font-light text-black">
                            {rushee.first_name} {rushee.last_name}
                        </h2>
                        <p className="text-apple-footnote text-apple-gray-600 font-light">
                            GTID: {rushee.gtid}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-apple-footnote text-apple-gray-600 font-light">
                        <span><span className="text-black font-normal">Major:</span> {rushee.major}</span>
                        <span><span className="text-black font-normal">Pronouns:</span> {rushee.pronouns}</span>
                    </div>

                    {rushee.ratings && rushee.ratings.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {rushee.ratings.map((rating, idx) => (
                                <span
                                    key={idx}
                                    className="bg-apple-gray-100 text-apple-gray-700 px-2 py-1 rounded-apple text-apple-caption1 font-light"
                                >
                                    {rating.name}: {((rating.value / 5) * 100).toFixed(0)}%
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div> : <div
                onClick={handleClick}
                className="card-apple flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-apple hover:shadow-md transition-all duration-200 cursor-pointer"
            > No Rushee Selected </div>}

            {dropdownOpen && (
                <div className="absolute z-50 mt-2 left-0 w-full bg-white border border-apple-gray-200 rounded-apple shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="p-4">
                            {/* TODO: ain't workin */}
                            <Loader />
                        </div>
                    ) : (
                        <ul>
                            {allRushees?.map((r, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleSelect(r)}
                                    className="px-4 py-3 hover:bg-apple-gray-50 text-apple-body text-black cursor-pointer"
                                >
                                    {(r as any).name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
