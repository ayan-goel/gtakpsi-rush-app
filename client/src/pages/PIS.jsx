import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import VoiceRecorder from "../components/VoiceRecorder";
import axios from "axios";
import CommentWarning from "../components/CommentWarning";
import { validateComment, generateWarnings } from "../js/speculativeWordBank";

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
    const [answerWarnings, setAnswerWarnings] = useState({}); // Stores warnings for each answer
    const [brotherA, setBrotherA] = useState({ firstName: '', lastName: '' });
    const [brotherB, setBrotherB] = useState({ firstName: '', lastName: '' });
    const [brotherC, setBrotherC] = useState({ firstName: '', lastName: '' });

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
        
        // Validate answer for speculative language and rushee names
        if (rushee && answer) {
            const validationResult = validateComment(answer, rushee.first_name, rushee.last_name);
            const warnings = generateWarnings(validationResult);
            
            setAnswerWarnings((prev) => ({
                ...prev,
                [question]: warnings
            }));
        } else {
            // Clear warnings if no answer
            setAnswerWarnings((prev) => {
                const newWarnings = { ...prev };
                delete newWarnings[question];
                return newWarnings;
            });
        }
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

        // Check for speculative language warnings
        const hasWarnings = Object.values(answerWarnings).some(warnings => warnings && warnings.length > 0);
        if (hasWarnings) {
            toast.warning("Some answers contain potentially problematic language. Please review before submitting.", {
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

            // Register Brother C if provided
            if (brotherC.firstName.trim() && brotherC.lastName.trim()) {
                await axios.post(`${api}/admin/pis-signup/${gtid}`, {
                    brother_first_name: brotherC.firstName.trim(),
                    brother_last_name: brotherC.lastName.trim()
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
                <div className="min-h-screen w-full bg-white overflow-y-auto">
                    <Navbar />

                    <div className="pt-24 p-4 pb-20">
                        <div className="container mx-auto px-4 max-w-4xl">
                            {/* Profile Header */}
                            <div className="card-apple p-6 mb-6">
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <img
                                        src={rushee.image_url}
                                        alt={`${rushee.first_name} ${rushee.last_name}`}
                                        className="w-60 h-60 rounded-apple-2xl object-cover border border-apple-gray-200 shrink-0"
                                    />
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row gap-3 items-start mb-4">
                                            <h1 className="text-apple-large font-light text-black">
                                                {rushee.first_name} {rushee.last_name}
                                            </h1>
                                            <div className="flex flex-wrap gap-2">
                                                {rushee.attendance.map((event, idx) => (
                                                    <Badges text={event.name} key={idx} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-apple-body">
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">Pronouns:</span> {rushee.pronouns}
                                            </p>
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">Major:</span> {rushee.major}
                                            </p>
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">Email:</span> {rushee.email}
                                            </p>
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">Phone:</span> {rushee.phone_number}
                                            </p>
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">Housing:</span> {rushee.housing}
                                            </p>
                                            <p className="text-apple-gray-600 font-light">
                                                <span className="text-black font-normal">GTID:</span> {rushee.gtid}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PIS Questions */}
                            <div className="card-apple p-6 mb-6">
                                <h1 className="text-apple-title1 font-light text-black mb-6">PIS Questions</h1>
                                
                                {/* Disclaimer Message */}
                                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-apple">
                                    <p className="text-apple-footnote text-orange-800 font-light">
                                        <span className="font-normal">Note:</span> Only the brother who does the main interview should submit this form. 
                                        The comments from the other two brothers should be taken from a shared Google Doc. If multiple people submit
                                        the form, the comments there before will be deleted. 
                                    </p>
                                </div>
                                
                                {/* Brother Information */}
                                <div className="mb-8 p-6 bg-apple-gray-50 border border-apple-gray-200 rounded-apple">
                                    <h3 className="text-apple-title2 font-normal text-black mb-4">Brother Information</h3>
                                    
                                    {/* Show current assignments if they exist */}
                                    {rushee.pis_signup && (rushee.pis_signup.first_brother_first_name !== "none" || rushee.pis_signup.second_brother_first_name !== "none" || rushee.pis_signup.third_brother_first_name !== "none") && (
                                        <div className="mb-6 p-4 bg-apple-gray-100 border border-apple-gray-200 rounded-apple">
                                            <h4 className="text-apple-body text-black font-normal mb-2">Currently Assigned:</h4>
                                            {rushee.pis_signup.first_brother_first_name !== "none" && (
                                                <p className="text-apple-body text-apple-gray-600 font-light">
                                                    Brother 1: {rushee.pis_signup.first_brother_first_name} {rushee.pis_signup.first_brother_last_name}
                                                </p>
                                            )}
                                            {rushee.pis_signup.second_brother_first_name !== "none" && (
                                                <p className="text-apple-body text-apple-gray-600 font-light">
                                                    Brother 2: {rushee.pis_signup.second_brother_first_name} {rushee.pis_signup.second_brother_last_name}
                                                </p>
                                            )}
                                            {rushee.pis_signup.third_brother_first_name !== "none" && (
                                                <p className="text-apple-body text-apple-gray-600 font-light">
                                                    Brother 3: {rushee.pis_signup.third_brother_first_name} {rushee.pis_signup.third_brother_last_name}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Brother A */}
                                    <div className="mb-6">
                                        <label className="block text-apple-footnote font-normal text-apple-gray-700 mb-2">Brother A (Required):</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={brotherA.firstName}
                                                onChange={(e) => setBrotherA({...brotherA, firstName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={brotherA.lastName}
                                                onChange={(e) => setBrotherA({...brotherA, lastName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Brother B */}
                                    <div className="mb-6">
                                        <label className="block text-apple-footnote font-normal text-apple-gray-700 mb-2">Brother B (Optional):</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={brotherB.firstName}
                                                onChange={(e) => setBrotherB({...brotherB, firstName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={brotherB.lastName}
                                                onChange={(e) => setBrotherB({...brotherB, lastName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Brother C */}
                                    <div className="mb-0">
                                        <label className="block text-apple-footnote font-normal text-apple-gray-700 mb-2">Brother C (Optional):</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={brotherC.firstName}
                                                onChange={(e) => setBrotherC({...brotherC, firstName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={brotherC.lastName}
                                                onChange={(e) => setBrotherC({...brotherC, lastName: e.target.value})}
                                                className="input-apple text-apple-footnote"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {questions.length > 0 ? (
                                    questions.map((question, idx) => (
                                        <div key={idx} className="mb-8">
                                            <p className="text-apple-body text-black font-normal mb-4">
                                                {idx + 1}. {question.question}
                                            </p>

                                            {question.question_type === "MC" ? (
                                                <div className="flex items-center space-x-6">
                                                    <label className="flex items-center text-apple-body text-black font-light">
                                                        <input
                                                            type="radio"
                                                            name={question.question}
                                                            value="Yes"
                                                            checked={answers[question.question] === "Yes"}
                                                            onChange={(e) => handleAnswerChange(question.question, e.target.value)}
                                                            className="mr-3 w-4 h-4 text-black focus:ring-black focus:ring-2"
                                                        />
                                                        Yes
                                                    </label>
                                                    <label className="flex items-center text-apple-body text-black font-light">
                                                        <input
                                                            type="radio"
                                                            name={question.question}
                                                            value="No"
                                                            checked={answers[question.question] === "No"}
                                                            onChange={(e) => handleAnswerChange(question.question, e.target.value)}
                                                            className="mr-3 w-4 h-4 text-black focus:ring-black focus:ring-2"
                                                        />
                                                        No
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 items-center">
                                                    <textarea
                                                        className="input-apple flex-1 min-h-[120px] resize-y text-apple-footnote"
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
                                            
                                            {/* Show warnings for this answer */}
                                            {answerWarnings[question.question] && answerWarnings[question.question].length > 0 && (
                                                <div className="mt-4">
                                                    <CommentWarning 
                                                        warnings={answerWarnings[question.question]} 
                                                        onDismiss={(index) => {
                                                            const newWarnings = answerWarnings[question.question].filter((_, i) => i !== index);
                                                            setAnswerWarnings((prev) => ({
                                                                ...prev,
                                                                [question.question]: newWarnings
                                                            }));
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-apple-body text-apple-gray-600 font-light text-center py-8">No questions available.</p>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={!brotherA.firstName.trim() || !brotherA.lastName.trim()}
                                    className={`w-full py-4 px-6 text-apple-headline font-light rounded-apple-xl transition-all duration-200 ${
                                        brotherA.firstName.trim() && brotherA.lastName.trim()
                                            ? 'bg-black text-white hover:bg-apple-gray-800 cursor-pointer'
                                            : 'bg-apple-gray-200 text-apple-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Submit Answers
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
