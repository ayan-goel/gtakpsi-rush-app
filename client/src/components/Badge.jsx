import React, { useState } from "react";

export default function Badges(props) {

    let css = "bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap"
    const [text, setText] = useState((props.text ? props.text : "Default"))

    if (props.text === "Night 1") css = "bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 text-black text-sm font-medium me-2 px-2.5 py-0.5 rounded whitespace-nowrap"
    if (props.text === "Night 2") css = "bg-gradient-to-r from-indigo-300 to-purple-400 text-black text-sm font-medium me-2 px-2.5 py-0.5 rounded whitespace-nowrap"
    if (props.text === 'Closed') css = "bg-gradient-to-r from-green-400 to-blue-500 text-black text-sm font-medium me-2 px-2.5 py-0.5 rounded whitespace-nowrap"
    if (props.text === 'Night 4') css = "bg-gradient-to-r from-pink-400 to-pink-600 text-white text-sm font-medium me-2 px-2.5 py-0.5 rounded whitespace-nowrap"
   

    return (
        <span className={"h-6 " + css}>{props.text}</span>
    )

}