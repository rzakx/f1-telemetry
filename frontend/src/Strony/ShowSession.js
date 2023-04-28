import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { NavLink, useParams } from "react-router-dom";
import Axios from "axios";
import { useState } from "react";

export default function ShowSessions(props){
    const {sessionId} = useParams();
    console.log(sessionId);
    if(!sessionId){
        window.location.href = "/sessions";
    }

    return(
        <>
            <Nawigacja />
            <div className="srodekekranu">
                {sessionId}
            </div>
        </>
    )
};