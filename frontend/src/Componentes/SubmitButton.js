import React from "react";

function SubmitButton({text}) {
    return (
        <button type="submit" style={{width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box", backgroundColor: "#4CAF50", color: "white", fontWeight: "bold"}}>
            {text}

        </button> 


    );

    }

export default SubmitButton;


