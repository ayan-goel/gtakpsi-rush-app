import React from "react";
import { useAdminVotingContext } from "./AdminVotingContext";
import { FaSync } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

interface VoteSummaryProps {
  showBreakdown?: boolean;
}

export default function VoteSummary({ showBreakdown = true }: VoteSummaryProps) {
  const { votes, setVotes } = useAdminVotingContext();

  const total = votes.length;
  const yes = votes.filter((v) => v.vote === "Yes").length;
  const no = votes.filter((v) => v.vote === "No").length;
  const abstain = votes.filter((v) => v.vote === "Abstain").length;

  const api = import.meta.env.VITE_API_PREFIX;

  const handleClearVotes = async () => {

            await toast.promise(
                axios.post(`${api}/admin/voting/clear-votes`),
                {
                    pending: "Clearing votes...",
                    success: "Votes cleared successfully!",
                    error: "Failed to clear votes",
                },
                {
                    position: "top-center",
                    theme: "light",
                }
            );

  };

  return (
    <div className="relative rounded-apple shadow-md p-6 bg-gradient-to-br from-white via-apple-gray-50 to-apple-gray-100 border border-apple-gray-200">
      <button
        onClick={handleClearVotes}
        className="absolute top-4 right-4 border border-apple-gray-300 text-apple-gray-400 hover:text-black hover:border-black rounded-full p-2 transition-colors"
      >
        <FaSync className="w-4 h-4" />
      </button>

      <h2 className="text-apple-title2 font-semibold text-black mb-4 tracking-tight">
        Voting Progress
      </h2>
      <p className="text-apple-body font-light text-apple-gray-600 mb-2">
        Total Votes Received: <span className="font-medium text-black">{total}</span>
      </p>

      {showBreakdown && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="bg-green-100 text-green-800 rounded-apple px-4 py-2 text-center">
            <p className="text-apple-footnote font-medium">Yes</p>
            <p className="text-apple-title3 font-semibold">{yes}</p>
          </div>
          <div className="bg-red-100 text-red-800 rounded-apple px-4 py-2 text-center">
            <p className="text-apple-footnote font-medium">No</p>
            <p className="text-apple-title3 font-semibold">{no}</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 rounded-apple px-4 py-2 text-center">
            <p className="text-apple-footnote font-medium">Abstain</p>
            <p className="text-apple-title3 font-semibold">{abstain}</p>
          </div>
        </div>
      )}
    </div>
  );
}