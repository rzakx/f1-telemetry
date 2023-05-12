import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import Confirmation from "../Components/Confirmation.js";
import { NavLink } from "react-router-dom";
import Axios from "axios";
import { useState } from "react";
import { BsFillExclamationSquareFill, BsFillXSquareFill } from "react-icons/bs";

export default function Sessions(props){
    const [ showPopup, setShowPopup ] = useState(null);
    const [ sessionsData, setSessionsData ] = useState({data: null, checked: false, error: null});

    const deleteSession = (id) => {
        Axios.post(gb.backendIP+"deleteSession/"+localStorage.getItem("token")).then((res) => {
            if(!res['blad']){
                console.log("Usunieto");
            } else {
                console.log("Nieusunieto");
            }
        }).catch((er) => console.log(er, "nieusunieto sesji"));
        setShowPopup(null);
        setSessionsData({...sessionsData, data: sessionsData.data.filter((row) => row.session_id != id)});
    }

    const checkSessions = () => {
        Axios.post(gb.backendIP+"sessions/"+localStorage.getItem("token")).then((r) => {
            if(r.data['data']){
                setSessionsData({checked: true, data: r.data['data'], error: null});
            } else {
                setSessionsData({checked: true, data: null, error: <i>No sessions found! Make sure you set up in-game telemetry<br />settings properly or just wait a few seconds for a database update...</i>});
            }
        }).catch((err) => {
            setSessionsData({...sessionsData, error: err.message, checked: true});
        })
    };
    const showSessions = () => {
        if(!sessionsData.data){
            return(
                <>
                    <tr>
                        <td colspan={6} rowSpan={6}>{sessionsData.error}</td>
                    </tr>
                </>
            );
        } else {
            return(
                sessionsData.data.map((row) => {
                    return(
                        <tr key={row.session_id}>
                            <td>{row.session_id}</td>
                            <td>{gb.sessionType[row.sessionType] || "Unknown"}</td>
                            <td>{gb.trackIds[row.trackId] || "Unknown"}</td>
                            <td>{gb.teamIds[row.carId] || "Unknown"}</td>
                            <td>{new Date(row.lastUpdate).toLocaleString('pl-PL', {day: '2-digit', month: 'long'})} {new Date(row.lastUpdate).toLocaleString('pl-PL', {hour: '2-digit', minute: '2-digit'})}</td>
                            <td>
                                <NavLink className="tabelaOdnosnik" to={"/session/"+row.session_id}><BsFillExclamationSquareFill />Inspect</NavLink>
                                <button className="tabelaOdnosnik danger" onClick={() => setShowPopup(row.session_id)}><BsFillXSquareFill />Delete</button>
                            </td>
                        </tr>
                    );
                })
            );
        }
    };

    return(
        <>
            <Nawigacja />
            <div className="screen">
                <div className="middle">
                    <h1 className="title">Sessions</h1>
                    <h3 className="title">Showing your detected sessions data</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Session ID</th><th>Session Type</th><th>Track</th><th>Car</th><th>Date</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            { sessionsData.checked ? showSessions() : checkSessions() }
                        </tbody>
                    </table>
                </div>
            </div>

            { showPopup &&
            <Confirmation 
                message={`Wait! Do you really want to delete session with ID: ${showPopup}? This action is permanent!`}
                cancelAction={() => setShowPopup(null)}
                confirmAction={() => deleteSession(showPopup)}
            />}
        </>
    );
};