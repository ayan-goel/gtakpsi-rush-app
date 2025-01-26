import React, { useState, useRef } from "react";
import axios from "axios";
import BasicInfo from "../components/RegisterComponents/BasicInfo";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import GetImage from "../components/RegisterComponents/GetImage";
import PisSignUp from "../components/RegisterComponents/PisSignUp"
import SuccessPage from "../components/RegisterComponents/SuccessPage";
import Loader from "../components/Loader";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { base64ToBlob } from "../js/image_processing";
import Error from "../components/Error";
import { useNavigate } from "react-router-dom";
import { verifyInfo } from "../js/verifications";

export default function Register() {

    const api = import.meta.env.VITE_API_PREFIX;

    // field values
    const [firstnameVal, setFirstnameVal] = useState()
    const [lastnameVal, setLastnameVal] = useState()
    const [emailVal, setEmailVal] = useState()
    const [housingVal, setHousingVal] = useState()
    const [phoneVal, setPhoneVal] = useState()
    const [gtidVal, setGtidVal] = useState()
    const [majorVal, setMajorVal] = useState()
    const [pronounsVal, setPronounsVal] = useState()
    const [yearVal, setYearVal] = useState()
    const [exposureVal, setExposureVal] = useState()

    const [page, setPage] = useState(0);
    const [currLoading, setCurrLoading] = useState(false)

    const [error, setError] = useState(null)
    const [errorTitle, setErrorTitle] = useState("Uh Oh! Something Unexpected Occurred..")
    const [errorDescription, setErrorDescription] = useState("Default Error Message...")

    const [image, setImage] = useState()
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [accessCode, setAccessCode] = useState()

    const aws_access_key_id = import.meta.env.VITE_AWS_ACCESS_KEY_ID
    const aws_secret_access_key = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY

    // references
    const firstname = useRef();
    const lastname = useRef();
    const email = useRef();
    const housing = useRef();
    const phone = useRef();
    const gtid = useRef();
    const major = useRef();
    const pronouns = useRef();
    const year = useRef();
    const exposure = useRef();

    const webcamRef = useRef();

    const navigate = useNavigate()

    const basic_info = [
        firstname,
        lastname,
        email,
        housing,
        phone,
        gtid,
        major,
        pronouns,
        year,
        exposure
    ]

    // submit button behaviors
    const basic_info_submit = async () => {

        setCurrLoading(true)

        for (const info of basic_info) {

            if (!info.current || info.current.value == null || info.current.value === "") {
                toast.warn('Fields cannot be empty', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
                return;
            }

        }

        await verifyInfo(gtid.current?.value, email.current?.value, phone.current?.value, true)
            .then((response) => {

                if (response.status === "success") {

                    setFirstnameVal(firstname.current?.value)
                    setLastnameVal(lastname.current?.value)
                    setEmailVal(email.current?.value)
                    setHousingVal(housing.current?.value)
                    setPhoneVal(phone.current?.value)
                    setGtidVal(gtid.current?.value)
                    setMajorVal(major.current?.value)
                    setPronounsVal(pronouns.current?.value)
                    setYearVal(year.current?.value)
                    setExposureVal(exposure.current?.value)

                    setPage(1)

                } else {

                    toast.warn(`${response.message}`, {
                        position: "top-center",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });

                }

            })
            .catch((error) => {

                console.log(error)

                toast.warn(`Some internal error occurred`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });

            })

        setCurrLoading(false)
    }

    const image_submit = () => {

        setPage(2)

    }

    const pis_submit = async () => {

        setCurrLoading(true)
        setPage(3)

        const s3Client = new S3Client({
            region: "us-east-1",
            credentials: {
                accessKeyId: aws_access_key_id,
                secretAccessKey: aws_secret_access_key,
            },
        });

        try {

            const s3Key = `${gtidVal}.jpg`;

            // Prepare the upload parameters
            const uploadParams = {
                Bucket: "rush-app-pictures", // S3 bucket name
                Key: s3Key, // File name
                Body: base64ToBlob(image), // File content
                ContentType: image.type, // File MIME type (e.g., image/jpeg)
            };

            const command = new PutObjectCommand(uploadParams);

        } catch (error) {

            console.log(error)

            setErrorTitle("Uh Oh! Something Unexpected Occurred..")
            setErrorDescription("There was an error uploading your image to the cloud.")
            navigate(`/error/${errorTitle}/${"There was an error uploading your image to the cloud."}`)
            return;

        }

        try {

            const response = await s3Client.send(command);

        } catch (error) {

            setErrorTitle("Uh Oh! Something Unexpected Occurred..")
            setErrorDescription("There was an error uploading your image to the cloud.")
            navigate(`/error/${errorTitle}/${"There was an error uploading your image to the cloud."}`)
            return;

        }

        // TODO: set up zoom api thingy i am too lazy

        const payload = {
            first_name: firstnameVal,
            last_name: lastnameVal,
            housing: housingVal,
            phone_number: phoneVal,
            email: emailVal,
            gtid: gtidVal,
            major: majorVal,
            class: yearVal,
            pronouns: pronounsVal,
            image_url: `https://rush-app-pictures.s3.us-east-1.amazonaws.com/${s3Key}`,
            exposure: exposureVal,
            pis_meeting_id: "meeting123",
            pis_timeslot: selectedSlot.time, // ISO 8601 format
            pis_link: "https://example.com/pis_meeting",
        };

        try {
            await axios.post(`${api}/rushee/signup`, payload)
                .then((response) => {

                    if (response.data.status === "error") {
                        navigate(`/error/${errorTitle}/${errorDescription}`)
                    } else if (response.data.status === "success") {

                        setAccessCode(response.data.payload)

                    } else {
                        navigate(`/error/${errorTitle}/${errorDescription}`)
                    }


                })
                .catch((err) => {

                    console.log(error)

                    navigate(`/error/${errorTitle}/${errorDescription}`)
                })
        } catch (err) {

            console.log(err)

            navigate(`/error/${errorTitle}/${errorDescription}`)

        }

        setCurrLoading(false)
        setError(false)

    }

    return (
        <div className="w-screen h-screen bg-slate-800 flex flex-col overflow-y-auto">
            <Navbar stripped={true} />

            {/* Spacing between Navbar and the form */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {page == 0 ? <BasicInfo
                    firstname={firstname}
                    lastname={lastname}
                    email={email}
                    housing={housing}
                    phone={phone}
                    gtid={gtid}
                    major={major}
                    pronouns={pronouns}
                    year={year}
                    exposure={exposure}
                    func={basic_info_submit}
                /> : <div>
                    {page == 1 ? <GetImage
                        webcamRef={webcamRef}
                        image={image}
                        setImage={setImage}
                        func={image_submit}
                    /> : <div>
                        {page == 2 ? <PisSignUp
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                            func={pis_submit}
                        /> : <div>

                            {currLoading ? <Loader /> : <div>

                                <SuccessPage
                                    title={"Congrats! You've successfully registered for AKPsi Spring 2025 Rush."}
                                    description={"If you need to reschedule your PIS, change your information, or update your picture, please use the link below."}
                                    gtid={gtidVal}
                                    link={accessCode}
                                />
                            </div>}

                        </div>}
                    </div>}
                </div>}
            </div>
        </div>
    );
}
