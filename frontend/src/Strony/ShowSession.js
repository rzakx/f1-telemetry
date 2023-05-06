import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { NavLink, useParams } from "react-router-dom";
import Axios from "axios";
const pako = require("pako");
import { useState } from "react";

export default function ShowSessions(props){
    const {sessionId} = useParams();
    const [session, setSession] = useState({data: null, checkOwn: false, isChecking: false, compressed: true});

    console.log(sessionId);
    if(!sessionId){
        window.location.href = "/sessions";
    }

    const initCheck = () => {
        isThatUserSession();
        setSession({...session, isChecking: true, compressed: true});
    };

    const isThatUserSession = async () => {
        await Axios.post(gb.backendIP+"sessionDetails", {
            requestUserId: localStorage.getItem("token"),
            sessionId: sessionId
        }).then((res) => {
            if(!res.data['blad']) {
                setSession({...res.data, checkOwn: true, isChecking: true, compressed: true});
            } else {
                console.log("Session details: Unauthorized access to session ", sessionId);
                window.location.href = "/sessions";
            }
        }).catch((err) => {
            console.log("Session details: ERROR | ", err.message);
            window.location.href = "/sessions";
        })
    };

    const odszyfruj = () => {
        let tmp = JSON.parse(pako.inflateRaw(JSON.parse("["+session.data+"]"), {to: "string"}));
        setSession({...session, data: tmp, compressed: false});
    };

    return(
        <>
            <Nawigacja />
            { !session.isChecking && initCheck() }
            { session.compressed && session.checkOwn && session.data && odszyfruj() }
            <div className="screen"><div className="middle">
                {sessionId}
                <br />
                {JSON.stringify(session.data)}
            </div></div>
        </>
    )
};