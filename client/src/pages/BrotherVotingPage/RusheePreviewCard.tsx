import React from "react";
import { useBrotherVotingContext } from "./BrotherVotingContext";
import { Rushee } from "./types";

export default function RusheePreviewCard() {
    const { rushee } = useBrotherVotingContext();

    if (!rushee) return null;

    return (
        <div className="relative w-full">
            <div className="card-apple flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-apple hover:shadow-md transition-all duration-200">
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
            </div>
        </div>
    );
}
