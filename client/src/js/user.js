import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function login(credentials) {

    let x = false;

    const api = import.meta.env.VITE_LOGIN_API_PREFIX;

    await axios.get(`${api}/users/login?&email=${credentials.email}&password=${credentials.pwd}`)
        .then((response) => {

            if (response.data === "wrongpassword") {
                toast.error('Wrong Password!', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            } else if (response.data === "notfound") {
                toast.error('A user with these credentials was not found', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            } else if (response.data === "error") {
                toast.error('Some error occured. Try again later', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            } else {

                localStorage.setItem('user', JSON.stringify(response.data.user))
                localStorage.setItem('token', JSON.stringify(response.data.token))

                console.log("hey")
                x = true

            }

        })
        .catch((error) => {
            console.log(error)
            toast.error('Some network error occurred. Please try again later', {
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

    return x

}

export async function logout() {

    localStorage.removeItem('token')
    localStorage.removeItem('user')

}