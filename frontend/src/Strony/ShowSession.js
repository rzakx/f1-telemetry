import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { NavLink, useParams } from "react-router-dom";
import Axios from "axios";
const pako = require("pako");
import { useState } from "react";
import LoadingIndicator from "../Components/LoadingIndicator.js";

export default function ShowSessions(props){
    const {sessionId} = useParams();
    const [session, setSession] = useState({data: null, checkOwn: false, isChecking: false});
    if(!sessionId){
        window.location.href = "/sessions";
    }

    const initCheck = () => {
        isThatUserSession();
        setSession({...session, isChecking: true});
    };

    const isThatUserSession = async () => {
        await Axios.post(gb.backendIP+"sessionDetails", {
            requestUserId: localStorage.getItem("token"),
            sessionId: sessionId
        }).then((res) => {
            if(!res.data['blad']) {
                setSession({...res.data, checkOwn: true, isChecking: true});
            } else {
                console.log("Session details: Unauthorized access to session ", sessionId);
                window.location.href = "/sessions";
            }
        }).catch((err) => {
            console.log("Session details: ERROR | ", err.message);
            window.location.href = "/sessions";
        })
    };

    const overallReady = () => {
        let laps = {};
        let lapTimes = [];
        let lapS1 = [];
        let lapS2 = [];
        for(const frame in session.data){
            for(const typeOfData in session.data[frame]){
                if(typeOfData == "daneOkrazenia"){
                    let lapNumber = session.data[frame][typeOfData]['numerOkrazenia'];
                    if(!laps[lapNumber]){
                        laps[lapNumber] = {};
                        laps[lapNumber]['minF'] = parseInt(frame);
                        laps[lapNumber]['maxF'] = parseInt(frame);
                        laps[lapNumber]['f'] = [parseInt(frame)];
                    } else {
                        laps[lapNumber]['f'].push(parseInt(frame));
                    }
                }
            }
        }
        for(const lap in laps){
            const maxFrame = Math.max(...laps[lap]['f']);
            const minFrame = Math.min(...laps[lap]['f']);
            laps[lap]['maxF'] = maxFrame;
            laps[lap]['minF'] = minFrame;
            lapTimes[lap] = session.data[maxFrame]["daneOkrazenia"]["aktualneOkr"];
            lapS1[lap] = session.data[maxFrame]["daneOkrazenia"]["sektor1"];
            lapS2[lap] = session.data[maxFrame]["daneOkrazenia"]["sektor2"];
        }
        return(
            <div className="showSessionOverall">
                <div className="showSessionOverallInfo">
                    <span>Session {sessionId}</span>
                    <span>{new Date(session.lastUpdate).toLocaleString('pl-PL', {day: '2-digit', month: 'long'})} {new Date(session.lastUpdate).toLocaleString('pl-PL', {hour: '2-digit', minute: '2-digit'})}</span>
                    <span>Track: {gb.trackIds[session.track]}</span>
                    <span>Vehicle: {gb.teamIds[session.car]}</span>
                </div>
                <div className="showSessionOveralLaps">
                    <h3>Lap times in session</h3>
                    <table>
                        <thead><tr><th>Lap</th><th>Tire type</th><th>Lap Time</th><th>Sector 1</th><th>Sector 2</th><th>Sector 3</th></tr></thead>
                        <tbody>
                    { lapTimes.length && lapTimes.map((time, okr) => {
                        return <tr key={"okr"+okr}>
                                <td>{okr}</td>
                                <td>g</td>
                                <td>{gb.lapTimeFormat(time, true)}</td>
                                <td>{gb.lapTimeFormat(lapS1[okr] || time , false)}</td>
                                <td>{lapS1[okr] ? gb.lapTimeFormat(lapS2[okr], false) : "-"}</td>
                                <td>{(lapS1[okr] && lapS2[okr]) ? gb.lapTimeFormat(time - lapS1[okr] - lapS2[okr], false) : "-"}</td>
                            </tr>
                    })}
                    </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return(
        <>
            <Nawigacja />
            { !session.isChecking && initCheck() }
            <div className="screen"><div className="middle">
                { session.checkOwn ? overallReady() : <LoadingIndicator text="Waiting for data" /> }
            </div></div>
        </>
    )
};