import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import Badges from "../components/Badge";
import axios from "axios";
import Webcam from "react-webcam";

import Navbar from "../components/Navbar";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Button from "../components/Button";
import { FaRegEdit } from "react-icons/fa";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { base64ToBlob } from "../js/image_processing";
import { verifyInfo } from "../js/verifications";

export default function RusheePage() {

    const { gtid, link } = useParams();
    const [rushee, setRushee] = useState(null); // Stores the current state of the rushee
    const [initialRushee, setInitialRushee] = useState(null); // Stores the initial fetched state
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showPreview, setShowPreview] = useState(false)
    const [image, setImage] = useState()

    const webcamRef = useRef();

    const capture = () => {
        const screenshot = webcamRef.current.getScreenshot();
        setShowPreview(true)
        setImage(screenshot);
    };

    const navigate = useNavigate();

    const api = import.meta.env.VITE_API_PREFIX;
    const aws_access_key_id = import.meta.env.VITE_AWS_ACCESS_KEY_ID
    const aws_secret_access_key = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY

    useEffect(() => {
        async function fetch() {
            await axios
                .get(`${api}/rushee/${gtid}`)
                .then((response) => {
                    if (response.data.status === "success") {
                        const fetchedRushee = response.data.payload;

                        if (fetchedRushee.access_code !== link) {
                            navigate(`/error/${"Incorrect Access Code"}/${"Reach out to the Support Team for assistance"}`);
                        } else {
                            setRushee(fetchedRushee);
                            setInitialRushee(fetchedRushee); // Save the initial state for comparison
                        }
                    } else {
                        navigate(`/error/${"Rushee with this GTID does not exist"}`);
                    }
                })
                .catch(() => {
                    navigate(`/error/${"An error occurred"}/${"Please try again later"}`);
                });

            setLoading(false);
        }

        if (loading) {
            fetch();
        }
    }, [loading, api, gtid, link, navigate]);


    const handlePhotoSubmit = async () => {

        setLoading(true)

        const s3Client = new S3Client({
            region: "us-east-2",
            credentials: {
                accessKeyId: aws_access_key_id,
                secretAccessKey: aws_secret_access_key,
            },
        });

        const s3Key = `${(gtid + new Date().toLocaleString()).replace(/\//g, "")}.jpg`;

        // Prepare the upload parameters
        const uploadParams = {
            Bucket: "rush-app-photos", // S3 bucket name
            Key: s3Key, // File name
            Body: base64ToBlob(image), // File content
            ContentType: image.type, // File MIME type (e.g., image/jpeg)
        };

        const command = new PutObjectCommand(uploadParams);

        try {

            const response = await s3Client.send(command);
            const payload = [
                {
                    "field": "image_url",
                    "new_value": `https://rush-app-photos.s3.us-east-2.amazonaws.com/${s3Key}`,
                }
            ]

            await axios.post(`${api}/rushee/update-rushee/${gtid}`, payload)
                .then((response) => {

                    if (response.data.status == "success") {

                        window.location.reload()

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

                    toast.error(`Some internal network error occurred`, {
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

        } catch (error) {

            setErrorTitle("Uh Oh! Something Unexpected Occurred..")
            setErrorDescription("There was an error uploading your image to the cloud.")
            navigate(`/error/${errorTitle}/${errorDescription}`)
            return;

        }

        setLoading(false)

    }

    // Handle form submission
    const handleSubmit = async (e) => {

        setLoading(true)

        if (
            !rushee.first_name ||
            !rushee.last_name ||
            !rushee.housing ||
            !rushee.phone_number ||
            !rushee.email ||
            !rushee.gtid ||
            !rushee.major ||
            !rushee.class ||
            !rushee.pronouns ||
            rushee.first_name === "" ||
            rushee.last_name === "" ||
            rushee.housing === "" ||
            rushee.phone_number === "" ||
            rushee.email === "" ||
            rushee.gtid === "" ||
            rushee.major === "" ||
            rushee.class === "" ||
            rushee.pronouns === ""
        ) {
            toast.error(`Fields cannot be empty`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            return;
        }

        e.preventDefault();

        if (!rushee || !initialRushee) {
            toast.error(`${"Unable to parse changes"}`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            return;
        }

        // Create a payload with only the changed fields
        const payload = Object.keys(rushee)
            .filter((key) => rushee[key] !== initialRushee[key]) // Compare initial and current state
            .map((key) => ({
                field: key,
                new_value: rushee[key],
            }));

        if (payload.length === 0) {
            toast.info(`${"No changes were made"}`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            return;
        }

        try {

            const checkValidity = await verifyInfo(rushee["gtid"], rushee["email"], rushee["phone_number"], rushee["gtid"] !== initialRushee["gtid"])

            if (checkValidity.status === "error") {

                toast.error(`${checkValidity.message}`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });

                return;

            }

        } catch (err) {
            console.log(err)
            toast.error(`${"Failed to update rushee"}`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            return;
        }

        try {
            const response = await axios.post(`${api}/rushee/update-rushee/${gtid}`, payload);

            if (response.data.status === "success") {
                window.location.reload(`https://www.gtakpsi-rush.com/rushee/${rushee.gtid}/${link}`)
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

        } catch (err) {
            toast.error(`${err.response?.data?.message || "Failed to update rushee"}`, {
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

        setLoading(false)
    };

    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;
        setRushee({ ...rushee, [name]: value });
    };

    return (
        <div>

            <Navbar stripped={true} />

            {loading ? (
                <Loader />
            ) : (

                <div className="min-h-screen bg-slate-800 py-10 text-gray-100">
                    {/* Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-0">
                            <div className="bg-transparent p-6 rounded-lg shadow-lg max-w-md w-full relative">
                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setIsModalOpen(!isModalOpen)
                                    }}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                                >
                                    &times;
                                </button>

                                <div className="w-96 h-96 bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                                    {showPreview ? <img
                                        src={image}
                                        alt="Captured"
                                        className="w-96 h-96 rounded-lg shadow-md border border-gray-700"
                                    /> : <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                    />}
                                </div>


                                {showPreview ? <div className="flex flex-row gap-6">
                                    <button
                                        onClick={() => {
                                            setShowPreview(false)
                                        }}
                                        className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                                    >
                                        Retake Photo
                                    </button>
                                    <button
                                        onClick={handlePhotoSubmit}
                                        className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                                    >
                                        Submit Photo
                                    </button>
                                </div> : <button
                                    onClick={capture}
                                    className="bg-gradient-to-r mt-3 from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                                >
                                    Take Photo
                                </button>}


                                {/* <h2 className="text-lg font-bold mb-4">Edit Image</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Add functionality to upload and change the image here.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(!isModalOpen)
                                    }}
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                                >
                                    Close
                                </button> */}

                            </div>
                        </div>
                    )}
                    <div className="h-10" />
                    {/* Rushee Information */}
                    <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6">
                            {/* Image with Edit Icon */}
                            <div className="relative">
                                <img
                                    src={initialRushee.image_url}
                                    alt={`${initialRushee.first_name} ${initialRushee.last_name}`}
                                    className="w-40 h-40 rounded-lg object-cover border-2 border-slate-600"
                                />
                                {/* Edit Icon */}
                                <button
                                    onClick={() => {
                                        setIsModalOpen(true)
                                    }}
                                    className="absolute top-2 text-center right-2 bg-gray-800 text-white pl-2.5 pr-2 pt-2 pb-2.5 rounded-full hover:bg-blue-500 transition duration-200"
                                    aria-label="Edit Image"
                                >
                                    <FaRegEdit />
                                </button>
                            </div>

                            {/* Rushee Details */}
                            <div>
                                <div className="flex flex-row gap-2 items-center">
                                    <h1 className="text-3xl font-bold">
                                        {initialRushee.first_name} {initialRushee.last_name}
                                    </h1>
                                    {initialRushee.attendance.map((event, idx) => (
                                        <Badges text={event.name} key={idx} />
                                    ))}
                                </div>
                                <p className="text-slate-300">Pronouns: {initialRushee.pronouns}</p>
                                <p className="text-slate-300">Major: {initialRushee.major}</p>
                                <p className="text-slate-300">Email: {initialRushee.email}</p>
                                <p className="text-slate-300">Phone: {initialRushee.phone_number}</p>
                                <p className="text-slate-300">Housing: {initialRushee.housing}</p>
                            </div>
                        </div>
                    </div>


                    <div className="mt-10 max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-200">PIS Details</h2>
                        <p className="mt-2 text-slate-300">
                            🕒 Timeslot:{" "}
                            {new Date(parseInt(initialRushee.pis_timeslot.$date.$numberLong)).toUTCString()}
                        </p>
                        {/* <div onClick={() => {
                            console.log("fill this in later")
                        }}>
                            <Button text={"Reschedule"} />
                        </div> */}
                    </div>

                    {/* Form Section */}
                    <div className="mt-10 max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg p-6">
                        <h1 className="text-3xl font-bold text-left mb-6">Edit Rushee Info</h1>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Row 1 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={rushee.first_name}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                                {/* Last Name */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={rushee.last_name}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Housing */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Housing</label>
                                    <input
                                        type="text"
                                        name="housing"
                                        value={rushee.housing}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                                {/* Phone Number */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={rushee.phone_number}
                                        onChange={(e) => {
                                            const input = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                                            const formatted = input
                                                .replace(/^(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3") // Format for full phone numbers
                                                .replace(/^(\d{3})(\d{1,3})$/, "($1) $2") // Format for partial numbers
                                                .replace(/^(\d{1,3})$/, "($1"); // Format for the area code only
                                            e.target.value = formatted;
                                            handleChange(e)
                                        }}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={rushee.email}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                                {/* GTID */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">GTID</label>
                                    <input
                                        type="text"
                                        name="gtid"
                                        value={rushee.gtid}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Row 4 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Major */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Major</label>
                                    <select
                                        name="major"
                                        value={rushee.major}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                        id="grid-year"
                                    >
                                        <option>Aerospace Engineering</option>
                                        <option value={"new"}>Applied Languages and Intercultural Studies</option>
                                        <option>Architecture</option>
                                        <option>Biochemistry</option>
                                        <option>Biology</option>
                                        <option>Biomedical Engineering</option>
                                        <option>Business Administration</option>
                                        <option>Chemical and Biomolecular Engineering</option>
                                        <option>Chemistry</option>
                                        <option>Civil Engineering</option>
                                        <option>Computational Media</option>
                                        <option>Computer Engineering</option>
                                        <option>Computer Science</option>
                                        <option>Earth and Atmospheric Sciences</option>
                                        <option>Economics</option>
                                        <option>Economics and International Affairs</option>
                                        <option>Electrical Engineering</option>
                                        <option>Environmental Engineering</option>
                                        <option>Global Economics and Modern Languages</option>
                                        <option>History, Technology, and Society</option>
                                        <option>Industrial Design</option>
                                        <option>Industrial Engineering</option>
                                        <option>International Affairs</option>
                                        <option>International Affairs and Modern Languages</option>
                                        <option>Literature, Media, and Communication</option>
                                        <option>Materials Science and Engineering</option>
                                        <option>Mathematics</option>
                                        <option>Mechanical Engineering</option>
                                        <option>Nuclear and Radiological Engineering</option>
                                        <option>Neuroscience</option>
                                        <option>Physics</option>
                                        <option>Psychology</option>
                                        <option>Public Policy</option>

                                    </select>
                                </div>
                                {/* Class */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Class</label>
                                    <select
                                        type="text"
                                        name="class"
                                        value={rushee.class}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    >
                                        <option>First</option>
                                        <option>Second</option>
                                        <option>Third</option>
                                        <option>Fourth</option>
                                        <option>Fifth+</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 5 */}
                            <div className="grid grid-cols-1">
                                {/* Pronouns */}
                                <div>
                                    <label className="block text-gray-200 font-semibold mb-1">Pronouns</label>
                                    <select
                                        name="pronouns"
                                        value={rushee.pronouns}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-600 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                    >
                                        <option value="">Select pronouns</option>
                                        <option value="he/him">he/him</option>
                                        <option value="she/her">she/her</option>
                                        <option value="they/them">they/them</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-200"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
