import React, { useState, useRef } from "react";
import { useAdminVotingContext } from "./AdminVotingContext";
import axios from "axios";
import { toast } from "react-toastify";

export default function QuestionDisplay() {

    const { question, setQuestion } = useAdminVotingContext();
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(question || ""); // fix this bug because question hasn't resolved yet, ashwin is too lazy
    const inputRef = useRef<HTMLInputElement>(null);

    const lambdaURL = import.meta.env.VITE_API_PREFIX;

    const handleBlur = async () => {
        setEditing(false);

        if (inputValue.trim() !== question) {
            const payload = { question: inputValue };

            // Show loader → then success or error toast
            await toast.promise(
                axios.post(`${lambdaURL}/admin/voting/post-question`, payload),
                {
                    pending: "Updating question...",
                    success: "Question updated successfully! 🎉",
                    error: "Failed to update question ❌",
                },
                {
                    position: "top-center",
                    theme: "light",
                }
            );
        }
    };

    const handleClick = () => {
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div
            onClick={handleClick}
            className="card-apple p-6 rounded-apple shadow-sm hover:shadow-md transition-shadow duration-150 cursor-text"
        >
            <label className="text-apple-footnote text-apple-gray-600 font-light block mb-3">
                Current Question
            </label>

            {editing ? (
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full text-apple-title1 text-black bg-transparent outline-none border-b border-apple-gray-300 focus:border-black transition-all duration-150"
                />
            ) : (
                <p className={`text-apple-title1 text-black ${!question && "text-apple-gray-400 italic"}`}>
                    {question || "Click to set question..."}
                </p>
            )}
        </div>
    );
}
