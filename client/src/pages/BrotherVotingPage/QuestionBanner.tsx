import React from "react";
import SplitText from "../../components/ReactBitsComponents/SplitText";
import { Brother } from "./types";
import { useBrotherVotingContext } from "./BrotherVotingContext";
import { toast } from "react-toastify";
import NotFound from "../404";
import axios from 'axios'

const votingOptions = ["Yes", "No", "Abstain"];

export default function QuestionBanner() {
    const { question, setQuestion } = useBrotherVotingContext();

    const storedUser: string | null = localStorage.getItem('user')

    if (!storedUser) {
        return <NotFound />
    }

    const user: Brother = JSON.parse(storedUser)

    const api = import.meta.env.VITE_API_PREFIX;

    const handleVote = async (vote: string) => {

        if (!question) {
            toast.error("No question has been set", {
                position: "top-center",
                autoClose: 3000,
                theme: "dark",
            });
            return;
        }

        const payload = {
            brother_id: user._id,
            first_name: user.firstname,
            last_name: user.lastname,
            vote: vote
        }

        console.log(payload)

        await toast.promise(
            (async () => {

                const response = await axios.post(`${api}/rushee/vote`, payload);
                console.log(response.data)

                if (response.data.status !== "success") {
                    const code = response.data.status;

                    if (code === "duplicate") {
                        throw new Error("You have already voted for this rushee.");
                    }

                    if (code === "ineligible") {
                        throw new Error("You are not eligible to vote, contact Visakhi if this is incorrect.");
                    }
                    throw new Error("Vote failed for unknown reason.");
                }

                return response;
            })(),
            {
                pending: "Sending vote to admin...",
                success: "Vote sent successfully!",
                error: {
                    render({ data }) {
                        // data is the error object thrown
                        return (data as any).message || "Failed to upload vote.";
                    },
                },
            },
            {
                position: "top-center",
                theme: "light",
            }
        );
    };

    return (
        <div className="relative w-full h-[240px] rounded-apple-xl overflow-hidden bg-gradient-to-br from-apple-gray-100 via-white to-apple-gray-50 shadow-md mb-8">
            {/* Floating question marks */}
            {Array.from({ length: 14 }).map((_, idx) => (
                <span
                    key={idx}
                    className="absolute text-[26px] sm:text-[34px] text-apple-gray-700 opacity-40 animate-float pointer-events-none select-none"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        transform: `translate(-50%, -50%)`,
                    }}
                >
                    ?
                </span>
            ))}

            {/* Centered animated question */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center space-y-6">
                <SplitText
                    key={question}
                    text={question ? question : "No Question Set"}
                    splitType="words"
                    className="text-4xl sm:text-5xl font-semibold text-apple-gray-800 drop-shadow-sm"
                    duration={0.5}
                    delay={60}
                />

                {/* Voting options */}
                <div className="flex gap-4 mt-2">
                    {votingOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleVote(option)}
                            className="px-5 py-2 rounded-apple bg-apple-gray-200 hover:bg-apple-gray-300 active:scale-[0.97] transition text-apple-gray-800 font-light text-apple-body"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
