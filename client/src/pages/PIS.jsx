import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import VoiceRecorder from "../components/VoiceRecorder";
import axios from "axios";

import { verifyUser } from "../js/verifications";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Badges from "../components/Badge";

export default function PIS() {
    const { gtid } = useParams();

    const [loading, setLoading] = useState(true);
    const [rushee, setRushee] = useState();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // Stores answers for each question
    const [brotherA, setBrotherA] = useState({ firstName: '', lastName: '' });
    const [brotherB, setBrotherB] = useState({ firstName: '', lastName: '' });

    const navigate = useNavigate();

    const errorTitle = "Default Error Title";
    const errorDescription = "Default Error Description";
    const api = import.meta.env.VITE_API_PREFIX;

    useEffect(() => {
        async function fetch() {
            await verifyUser()
                .then(async (response) => {
                    if (response === false) {
                        navigate(`/error/${errorTitle}/${errorDescription}`);
                    }

                    // Fetch rushee data
                    await axios.get(`${api}/rushee/${gtid}`)
                        .then((response) => {
                            if (response.data.status === "success") {
                                setRushee(response.data.payload);

                                // Prepopulate answers with existing PIS answers
                                const existingAnswers = {};
                                response.data.payload.pis?.forEach((pis) => {
                                    existingAnswers[pis.question] = pis.answer;
                                });
                                setAnswers(existingAnswers);
                            } else {
                                navigate(`/error/${errorTitle}/${"Rushee with this GTID does not exist"}`);
                            }
                        });

                    // Fetch PIS questions
                    await axios.get(`${api}/admin/get_pis_questions`)
                        .then((response) => {
                            if (response.data.status === "success") {
                                setQuestions(response.data.payload);
                            } else {
                                navigate(`/error/${errorTitle}/${"Failed to fetch PIS questions"}`);
                            }
                        });
                })
                .catch((error) => {
                    console.log(error);
                    navigate(`/error/${errorTitle}/${errorDescription}`);
                });

            setLoading(false);
        }

        if (loading) {
            fetch();
        }
    }, [loading, api, gtid, navigate]);

    // Handle answer input changes
    const handleAnswerChange = (question, answer) => {
        setAnswers((prev) => ({
            ...prev,
            [question]: answer,
        }));
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validation: At least Brother A must be filled out
        if (!brotherA.firstName.trim() || !brotherA.lastName.trim()) {
            toast.error("Brother A information is required", {
                position: "top-center",
                autoClose: 3000,
                theme: "dark",
            });
            return;
        }

        setLoading(true);

        try {
            // Register Brother A
            await axios.post(`${api}/admin/pis-signup/${gtid}`, {
                brother_first_name: brotherA.firstName.trim(),
                brother_last_name: brotherA.lastName.trim()
            });

            // Register Brother B if provided
            if (brotherB.firstName.trim() && brotherB.lastName.trim()) {
                await axios.post(`${api}/admin/pis-signup/${gtid}`, {
                    brother_first_name: brotherB.firstName.trim(),
                    brother_last_name: brotherB.lastName.trim()
                });
            }

            // Prepare the payload with all questions, including unanswered ones
            const payload = questions.map((question) => ({
                question: question.question,
                answer: answers[question.question] || "", // Use an empty string for unanswered questions
            }));

            // Submit PIS responses
            const response = await axios.post(`${api}/rushee/post-pis/${gtid}`, payload);
            
            if (response.data.status === "success") {
                navigate(`/brother/rushee/${gtid}`);
            } else {
                toast.error(`${response.data.message}`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error submitting PIS:", error);
            toast.error("An error occurred while submitting the PIS. Please try again.", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
        }

        setLoading(false);
    };

    return (
        <div>
            {loading ? (
                <Loader />
            ) : (
                <div className="w-screen h-screen bg-slate-800 overflow-y-scroll">
                    <Navbar />

                    <div className="h-20" />

                    <div className="text-white max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg overflow-hidden">
                        <div className="flex items-center space-x-6 p-6">
                            <img
                                src={rushee.image_url}
                                alt={`${rushee.first_name} ${rushee.last_name}`}
                                className="w-44 h-44 rounded-lg object-cover border-2 border-slate-600"
                            />
                            <div>
                                <div className="flex flex-row gap-2 items-center">
                                    <h1 className="text-3xl font-bold">
                                        {rushee.first_name} {rushee.last_name}
                                    </h1>
                                    {rushee.attendance.map((event, idx) => (
                                        <Badges text={event.name} key={idx} />
                                    ))}
                                </div>
                                <p className="text-slate-300">Pronouns: {rushee.pronouns}</p>
                                <p className="text-slate-300">Major: {rushee.major}</p>
                                <p>Email: {rushee.email}</p>
                                <p>Phone: {rushee.phone_number}</p>
                                <p>Housing: {rushee.housing}</p>
                                <p>GTID: {rushee.gtid}</p>
                            </div>
                        </div>
                    </div>

                    {/* PIS Questions */}
                    <div className="mt-10 max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg p-6">
                        <h1 className="text-3xl font-bold text-gray-200 mb-6">PIS Questions</h1>
                        
                        {/* Brother Information */}
                        <div className="mb-8 p-4 bg-slate-600 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-200 mb-4">Brother Information</h3>
                            
                            {/* Show current assignments if they exist */}
                            {rushee.pis_signup && (rushee.pis_signup.first_brother_first_name !== "none" || rushee.pis_signup.second_brother_first_name !== "none") && (
                                <div className="mb-4 p-3 bg-slate-700 rounded border-l-4 border-yellow-500">
                                    <h4 className="text-yellow-300 font-semibold mb-2">Currently Assigned:</h4>
                                    {rushee.pis_signup.first_brother_first_name !== "none" && (
                                        <p className="text-gray-300">
                                            Brother 1: {rushee.pis_signup.first_brother_first_name} {rushee.pis_signup.first_brother_last_name}
                                        </p>
                                    )}
                                    {rushee.pis_signup.second_brother_first_name !== "none" && (
                                        <p className="text-gray-300">
                                            Brother 2: {rushee.pis_signup.second_brother_first_name} {rushee.pis_signup.second_brother_last_name}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {/* Brother A */}
                            <div className="mb-4">
                                <label className="block text-gray-200 font-semibold mb-2">Brother A:</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={brotherA.firstName}
                                        onChange={(e) => setBrotherA({...brotherA, firstName: e.target.value})}
                                        className="p-3 bg-slate-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={brotherA.lastName}
                                        onChange={(e) => setBrotherA({...brotherA, lastName: e.target.value})}
                                        className="p-3 bg-slate-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Brother B */}
                            <div className="mb-4">
                                <label className="block text-gray-200 font-semibold mb-2">Brother B:</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={brotherB.firstName}
                                        onChange={(e) => setBrotherB({...brotherB, firstName: e.target.value})}
                                        className="p-3 bg-slate-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={brotherB.lastName}
                                        onChange={(e) => setBrotherB({...brotherB, lastName: e.target.value})}
                                        className="p-3 bg-slate-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {questions.length > 0 ? (
                            questions.map((question, idx) => (
                                <div key={idx} className="mb-6">
                                    <p className="text-gray-200 font-semibold mb-2">
                                        {idx + 1}. {question.question}
                                    </p>

                                    {question.question_type === "MC" ? (
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center text-gray-200">
                                                <input
                                                    type="radio"
                                                    name={question.question}
                                                    value="Yes"
                                                    checked={answers[question.question] === "Yes"}
                                                    onChange={(e) => handleAnswerChange(question.question, e.target.value)}
                                                    className="mr-2"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center text-gray-200">
                                                <input
                                                    type="radio"
                                                    name={question.question}
                                                    value="No"
                                                    checked={answers[question.question] === "No"}
                                                    onChange={(e) => handleAnswerChange(question.question, e.target.value)}
                                                    className="mr-2"
                                                />
                                                No
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 items-center">
                                            <textarea
                                                className="flex-1 p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500 min-h-[100px] resize-y"
                                                placeholder="Your answer..."
                                                value={answers[question.question] || ""}
                                                onChange={(e) => handleAnswerChange(question.question, e.target.value)}
                                            />
                                            <div className="flex-shrink-0">
                                                <VoiceRecorder
                                                    onTranscription={(transcription) => {
                                                        // Append to existing text if there's already content
                                                        const existingAnswer = answers[question.question] || "";
                                                        const newAnswer = existingAnswer 
                                                            ? `${existingAnswer} ${transcription}` 
                                                            : transcription;
                                                        handleAnswerChange(question.question, newAnswer);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-300">No questions available.</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!brotherA.firstName.trim() || !brotherA.lastName.trim()}
                            className={`w-full py-3 rounded-lg transition duration-200 ${
                                brotherA.firstName.trim() && brotherA.lastName.trim()
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            Submit Answers
                        </button>
                    </div>

                    <div className="h-20" />
                </div>
            )}
        </div>
    );
}
