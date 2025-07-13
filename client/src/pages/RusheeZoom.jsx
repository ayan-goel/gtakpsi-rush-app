import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import dayjs from 'dayjs';

import Navbar from "../components/Navbar";
import { verifyUser } from "../js/verifications";
import Loader from "../components/Loader";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { FaEdit, FaTrash } from "react-icons/fa";
import Badges from "../components/Badge";


export default function RusheeZoom() {

    const { gtid } = useParams();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'))

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [errorTitle, setErrorTitle] = useState("Uh Oh! Something untoward happened");
    const [errorDescription, setErrorDescription] = useState("Something really weird happened");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentText, setEditedCommentText] = useState("");

    const [selectedPis, setSelectedPis] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);

    const [rushee, setRushee] = useState();
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [ratings, setRatings] = useState({
        "Why AKPsi": null,
        "1:1 Interactions": null,
        "Group Interactions": null,
        "Professionalism": null,
    });

    const navigate = useNavigate();

    const api = import.meta.env.VITE_API_PREFIX;

    // Function to assign rushee ID based on GTID
    const getRusheeId = (gtid) => {
        // Use the last 4 digits of GTID as the rushee ID, preserving leading zeros
        return gtid.slice(-4);
    };

    // Check if user is in bid committee mode
    const isBidCommitteeMode = () => {
        return location.pathname.includes('/bid-committee') || 
               location.search.includes('bid_committee=true') ||
               document.referrer.includes('/bid-committee');
    };

    const ratingFields = [
        "Why AKPsi",
        "1:1 Interactions",
        "Group Interactions",
        "Professionalism",
    ];

    useEffect(() => {

        async function fetch() {

            await verifyUser()
                .then(async (response) => {

                    if (response == false) {
                        navigate(`/error/${errorTitle}/${errorDescription}`);
                    }

                    await axios.get(`${api}/rushee/${gtid}`)
                        .then((response) => {

                            if (response.data.status === "success") {

                                console.log(response.data.payload);
                                setRushee(response.data.payload);

                            } else {

                                navigate(`/error/${errorTitle}/${"Rushee with this GTID does not exist"}`);
                            }

                        });

                })
                .catch((error) => {

                    setError(true);
                    navigate(`/error/${errorTitle}/${errorDescription}`);

                });

            setLoading(false);

        }

        if (loading == true) {
            fetch();
        }

    });

    const handleAddComment = () => {
        setIsAddingComment(true);
    };

    const handleRatingChange = (field, value) => {
        setRatings({
            ...ratings,
            [field]: value,
        });
    };

    const handleSubmitComment = async () => {
        setLoading(true)

        const actualRatings = []

        for (const rating in ratings) {
            if (ratings[rating] != null) {
                actualRatings.push({
                    name: rating,
                    value: parseInt(ratings[rating])
                })
            }
        }

        const payload = {
            brother_id: "000000",
            brother_name: user.firstname + " " + user.lastname,
            comment: newComment,
            ratings: actualRatings,
        }

        console.log(user)

        await axios.post(`${api}/rushee/post-comment/${gtid}`, payload)
            .then((response) => {

                if (response.data.status === "success") {

                    window.location.reload();

                } else {

                    const title = "Uh Oh! Something weird happened..."
                    const description = "Something odd happened while submitting your comment..."

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

            })
            .catch((error) => {

                console.log(error)

                const title = "Uh Oh! Something weird happened..."
                const description = "Some network error happened while submitting your comment..."

                navigate(`/error/${title}/${description}`)

            })

        // Reset the form after submission
        setNewComment("");
        setRatings({
            "Professionalism": null,
            "Goatedness": null,
            "Awesomeness": null,
            "Eye Contact": null,
        });
        setIsAddingComment(false);
        setLoading(false)
    };

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://rush-app-2024.web.app/rushee/${gtid}/${rushee.access_code}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
        });
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.comment); // Track the comment being edited
        setEditedCommentText(comment.comment); // Pre-populate with the existing comment text
    };

    const handleSubmitEdit = async (comment) => {

        console.log(comment)

        setLoading(true)
        const payload = {
            brother_id: "000000",
            brother_name: comment.brother_name,
            comment: editedCommentText,
            ratings: comment.ratings,
            night: comment.night,
        }

        await axios.post(`${api}/rushee/edit-comment/${gtid}`, payload)
            .then((response) => {

                if (response.data.status === "success") {

                    window.location.reload();
                    // console.log("worked")

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

            })
            .catch((err) => {

                console.log(error)
                toast.error(`Some network error occurred`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });

            })

        setEditingCommentId(null); // Reset editing state
        setEditedCommentText("");
        setLoading(false)

    }

    const handleDeleteComment = async (comment) => {

        setLoading(true)

        await axios.post(`${api}/rushee/edit-comment/${gtid}`, comment)
            .then((response) => {

                if (response.data.status === "success") {
                    window.location.reload();
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

            })
            .catch((error) => {

                console.log(error)

                toast.error(`Some network error occurred`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            })

        setLoading(false)

    }

    return (
        <div>
            {loading ? (
                <Loader />
            ) : (
                <div>
                    <div className="h-screen w-screen bg-slate-800">

                        {/* Modal for Zoomed-In Comment */}
                        {selectedComment && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center
               bg-black bg-opacity-50"
                                onClick={() => setSelectedComment(null)} // close if user clicks backdrop
                            >
                                {/* Modal inner box, stops click propagation */}
                                <div
                                    className="bg-slate-700 rounded-lg shadow-lg p-6 w-11/12 max-w-2xl
                 transform scale-100 transition-transform duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close button */}
                                    <button
                                        className="text-gray-300 hover:text-white float-right text-xl
                   focus:outline-none"
                                        onClick={() => setSelectedComment(null)}
                                    >
                                        &times;
                                    </button>

                                    {/* Modal Content */}
                                    <h3 className="text-3xl font-semibold mb-2 text-gray-200">
                                        Comment from <span className="font-bold bg-gradient-to-r from-sky-700 via-amber-600 to-sky-700 animate-text bg-clip-text text-transparent">{selectedComment.brother_name}</span>
                                    </h3>
                                    <p className="text-gray-200 text-2xl mb-4">{selectedComment.comment}</p>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedComment.ratings.map((rating, rIdx) => (
                                                    <span
                                                        key={rIdx}
                                                        className="bg-slate-500 text-gray-200 px-2 py-1 rounded text-sm"
                                                    >
                                                        {rating.name}: {rating.value == 5 ? "Satisfactory" : "Unsatisfactory"}
                                                    </span>
                                                ))}
                                            </div>
                                </div>
                            </div>
                        )}

                        {/* ADD THIS (Modal for Zoomed-In PIS View) */}
                        {selectedPis && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center
               bg-black bg-opacity-50"
                                onClick={() => setSelectedPis(null)} // close if user clicks backdrop
                            >
                                {/* This inner box stops clicks from propagating to backdrop */}
                                <div
                                    className="bg-slate-700 rounded-lg shadow-lg p-6 w-11/12 max-w-2xl
                 transform scale-100 transition-transform duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close button */}
                                    <button
                                        className="text-gray-300 hover:text-white float-right text-xl
                   focus:outline-none"
                                        onClick={() => setSelectedPis(null)}
                                    >
                                        &times;
                                    </button>

                                    {/* Modal content */}
                                    <h3 className="text-2xl font-semibold text-blue-400 mt-2">Q:</h3>
                                    <p className="text-gray-200 text-2xl mb-4">{selectedPis.question}</p>

                                    <h3 className="text-2xl font-semibold text-green-400">A:</h3>
                                    <p className="text-gray-200 text-2xl">{selectedPis.answer}</p>
                                </div>
                            </div>
                        )}

                        <Navbar />
                        <div className="h-10" />



                        <div className="min-h-screen bg-slate-800 py-10 text-gray-100 p-4">
                            {/* Profile Header */}
                            <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg overflow-hidden">
                                <div className="flex items-center space-x-6 p-6">
                                    {isBidCommitteeMode() ? (
                                        // Bid Committee Mode - Show numbered placeholder
                                        <div className="w-44 h-44 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-slate-600 flex items-center justify-center">
                                            <span className="text-6xl font-bold text-white">
                                                {getRusheeId(rushee.gtid)}
                                            </span>
                                        </div>
                                    ) : (
                                        // Normal Mode - Show actual photo
                                        <img
                                            src={rushee.image_url}
                                            alt={`${rushee.first_name} ${rushee.last_name}`}
                                            className="w-44 h-44 rounded-lg object-cover border-2 border-slate-600"
                                        />
                                    )}
                                    <div>
                                        <div className="flex flex-row gap-2 items-center">
                                            {isBidCommitteeMode() ? (
                                                <h1 className="text-3xl font-bold">
                                                    Rushee #{getRusheeId(rushee.gtid)}
                                                </h1>
                                            ) : (
                                                <h1 className="text-3xl font-bold">
                                                    {rushee.first_name} {rushee.last_name}
                                                </h1>
                                            )}
                                            {rushee.attendance.map((event, idx) => (
                                                <Badges text={event.name} key={idx} />
                                            ))}
                                        </div>
                                        {!isBidCommitteeMode() && (
                                            <>
                                                <p className="text-slate-300">Pronouns: {rushee.pronouns}</p>
                                                <p className="text-slate-300">Email: {rushee.email}</p>
                                            </>
                                        )}
                                        <p className="text-slate-300">Major: {rushee.major}</p>
                                        <p className="text-slate-300">Class: {rushee.class}</p>
                                        {isBidCommitteeMode() && (
                                            <p className="text-slate-300">GTID: {rushee.gtid}</p>
                                        )}
                                        {!isBidCommitteeMode() && (
                                            <p className="text-slate-300">GTID: {rushee.gtid}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!isBidCommitteeMode() && (
                                <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6 grid grid-cols-2 gap-6">
                                    <div onClick={() => {
                                        navigate(`/pis/${gtid}`)
                                    }} className="cursor-pointer flex items-center justify-center bg-slate-400 h-12 w-full rounded-lg bg-gradient-to-r from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 focus:ring transform transition hover:scale-105 duration-300 ease-in-out">
                                        Submit PIS
                                    </div>
                                    <div onClick={handleCopy} className="cursor-pointer flex items-center justify-center bg-slate-400 h-12 w-full rounded-lg bg-gradient-to-r from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 focus:ring transform transition hover:scale-105 duration-300 ease-in-out">
                                        {copied ? "Link Copied!" : "Copy Edit Page Link"}
                                    </div>
                                </div>
                            )}

                            {/* Ratings */}
                            <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6">

                                <h2 className="text-xl font-semibold text-gray-200">Ratings</h2>

                                <div className="flex flex-col gap-4 mt-4">
                                    {rushee.ratings.map((rating, idx) => (
                                        <div key={idx} className="w-full">
                                            <p className="text-gray-200 font-semibold">{rating.name}</p>
                                            <div className="w-full bg-gray-700 rounded-lg h-4 mt-1">
                                                <div
                                                    className="bg-blue-500 h-4 rounded-lg"
                                                    style={{ width: `${(rating.value / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{`${(rating.value / 5) * 100}%`}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PIS Responses */}
                            <div className="max-w-4xl max-h-[40rem] mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6 overflow-y-scroll no-scrollbar">
                                <h2 className="text-xl font-semibold text-gray-200 mb-4">PIS Details</h2>

                                <p className="mt-2 text-slate-300">
                                    🕒 Timeslot:{" "}
                                    {dayjs(parseInt(rushee.pis_timeslot.$date.$numberLong)).format('ddd, DD MMM YYYY HH:mm:ss')}
                                </p>
                                <p className="mt-2 text-slate-300">
                                    <strong>Brother 1:</strong> {rushee.pis_signup.first_brother_first_name} {rushee.pis_signup.first_brother_last_name}
                                </p>
                                <p className="mt-2 text-slate-300">
                                    <strong>Brother 2:</strong> {rushee.pis_signup.second_brother_first_name} {rushee.pis_signup.second_brother_last_name}
                                </p>

                                {/* PIS Responses Section */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-200 mb-2">PIS Responses</h3>
                                    <div className="space-y-4">
                                        {rushee.pis.map((pis, idx) => (
                                            // ADD THIS onClick:
                                            <div
                                                key={idx}
                                                className="bg-slate-600 p-4 rounded-lg shadow-md border border-gray-500
                   hover:bg-slate-500 cursor-pointer transition duration-200"
                                                onClick={() => setSelectedPis(pis)} // ADD THIS
                                            >
                                                <p className="text-gray-300 font-semibold">
                                                    <strong className="text-blue-400">Q:</strong> {pis.question}
                                                </p>
                                                <p className="text-gray-200 mt-2">
                                                    <strong className="text-green-400">A:</strong> {pis.answer}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Brothers who wrote comments */}
                            <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6">
                                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                                    Brothers Who Commented
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {rushee.comments.map((comment, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-500 text-gray-200 px-3 py-1 rounded-lg
                   hover:bg-slate-400 cursor-pointer
                   transform transition-all duration-200 ease-in-out
                   hover:-translate-y-1 hover:scale-105"
                                        >
                                            {comment.brother_name}
                                        </div>
                                    ))}
                                </div>
                            </div>


                            {/* Comments */}
                            <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6">
                                <h2 className="text-xl font-semibold text-gray-200 bg-slate-700 mb-2">
                                    Comments
                                </h2>
                                {!isAddingComment ? (
                                    <div
                                        onClick={handleAddComment}
                                        className="border-2 border-dashed border-gray-400 p-6 rounded-lg cursor-pointer flex items-center justify-center hover:bg-slate-600 transition duration-300"
                                    >
                                        <span className="text-3xl text-gray-400">+</span>
                                    </div>
                                ) : (
                                    <div className="bg-slate-600 p-4 rounded-lg">
                                        <textarea
                                            className="w-full p-2 bg-slate-700 text-gray-200 rounded-lg mb-4"
                                            placeholder="Add your comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        ></textarea>

                                        {ratingFields.map((field) => (
                                            <div key={field} className="mb-4">
                                                <label
                                                    htmlFor={field}
                                                    className="block text-gray-200 mb-2"
                                                >
                                                    {field}
                                                </label>
                                                <select
                                                    id={field}
                                                    className="w-full p-2 bg-slate-700 text-gray-200 rounded-lg"
                                                    value={ratings[field] || ""}
                                                    onChange={(e) =>
                                                        handleRatingChange(field, e.target.value)
                                                    }
                                                >
                                                    <option value="" disabled>
                                                        Not Seen
                                                    </option>
                                                    {/* {[...Array(6).keys()].map((value) => (
                                                        <option key={value} value={value}>
                                                            {value}
                                                        </option>
                                                    ))} */}
                                                    <option value={5}>Satisfactory</option>
                                                    <option value={0}>Unsatisfactory</option>
                                                </select>
                                            </div>
                                        ))}

                                        <button
                                            onClick={handleSubmitComment}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                )}
                                <div className="mt-4">
                                    {rushee.comments.map((comment, idx) => (
                                        <div
                                            key={idx}
                                            // Add this onClick to open the modal if the user clicks anywhere 
                                            // except on the edit/delete icons.
                                            onClick={() => setSelectedComment(comment)}
                                            className="relative mt-4 bg-slate-600 p-4 rounded-lg
               hover:bg-slate-500 cursor-pointer transition duration-200 border border-gray-500"
                                        >
                                            {/* Buttons in the top-right corner */}
                                            <div
                                                className={
                                                    user.firstname + " " + user.lastname === comment.brother_name &&
                                                        editingCommentId !== comment.comment
                                                        ? "absolute top-2 right-2 flex space-x-2"
                                                        : "hidden"
                                                }
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();  // Prevent click from opening modal
                                                        handleEditComment(comment);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 text-xl"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();  // Prevent click from opening modal
                                                        handleDeleteComment(comment);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 text-xl"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            {/* Comment Content or Edit Field */}
                                            {editingCommentId === comment.comment ? (
                                                <div>
                                                    <textarea
                                                        className="w-full p-2 bg-slate-700 text-gray-200 rounded-lg mb-4"
                                                        value={editedCommentText}
                                                        onChange={(e) => setEditedCommentText(e.target.value)}
                                                    ></textarea>
                                                    <button
                                                        onClick={() => handleSubmitEdit(comment)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                                    >
                                                        Submit
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Badges text={comment.night.name} />
                                                    <div className="h-1" />
                                                    <p>
                                                        <strong className="text-gray-200">{comment.brother_name}:</strong> {comment.comment}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {comment.ratings.map((rating, rIdx) => (
                                                    <span
                                                        key={rIdx}
                                                        className="bg-slate-500 text-gray-200 px-2 py-1 rounded text-sm"
                                                    >
                                                        {rating.name}: {rating.value == 5 ? "Satisfactory" : "Unsatisfactory"}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>


                            </div>

                            {/* Attendance */}
                            {/* <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg mt-6 p-6">
                                <h2 className="text-xl font-semibold text-gray-200">Attendance</h2>
                                {rushee.attendance.map((event, idx) => (
                                    <p key={idx} className="mt-2 text-slate-300">
                                        {event.name} - {event.date}
                                    </p>
                                ))}
                            </div> */}
                        </div>
                    </div>
                </div>
            )}
        </div>

    );

}
