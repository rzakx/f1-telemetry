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
    const [ filter, setFilter ] = useState({sessionType: -1, car: -1, dateFrom: null, dateTo: null, track: -1});

    const deleteSession = (id) => {
        Axios.post(gb.backendIP+"deleteSession/"+localStorage.getItem("token")+"/"+id).then((res) => {
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
                    const timestampRow = new Date(row.lastUpdate).getTime();
                    if((filter.sessionType != -1) && (filter.sessionType != row.sessionType)) return;
                    if((filter.track != -1) && (filter.track != row.trackId)) return;
                    if((filter.car != -1) && (filter.car != row.carId)) return;
                    console.log(new Date(row.lastUpdate), filter.dateFrom, filter.dateTo);
                    if((filter.dateFrom) && (filter.dateFrom > row.lastUpdate)) return;
                    if(filter.dateTo){
                        let filterDo = new Date(filter.dateTo);
                        filterDo = filterDo.setDate(filterDo.getDate() + 1);
                        if (filterDo < timestampRow) return;
                    }
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
                    <div className="screenHeader">
                        <div className="screenHeaderTitle">
                            <h1 className="title">Sessions</h1>
                            <h3 className="title">Showing your detected sessions data</h3>
                        </div>
                        <div className="sessionsFilters">
                            <div className="row">
                                <div className="sessionsFilter">
                                    <span>Track</span>
                                    <select onChange={(e) => setFilter({...filter, track: e.target.value}) }>
                                        <option value={-1}>Any</option>
                                        { gb.trackIds.map((v, i) => { return <option value={i}>{v}</option> }) }
                                    </select>
                                </div>
                                <div className="sessionsFilter">
                                    <span>Session Type</span>
                                    <select onChange={(e) => setFilter({...filter, sessionType: e.target.value}) }>
                                        <option value={-1}>Any</option>
                                        { gb.sessionType.map((v, i) => { return <option value={i}>{v}</option> }) }
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <div className="sessionsFilter">
                                    <span>Car</span>
                                    <select onChange={(e) => setFilter({...filter, car: e.target.value}) }>
                                        <option value={-1}>Any</option>
                                        { Object.entries(gb.teamIds).map((v, i) => { return <option value={v[0]}>{v[1]}</option> }) }
                                    </select>
                                </div>
                                <div className="sessionsFilter">
                                    <span>Date</span>
                                    <input type="date" onChange={(e) => setFilter({...filter, dateFrom: e.target.value})} />
                                </div>
                                <div className="sessionsFilter" style={{marginLeft: '-30px'}}>
                                    <span>-</span>
                                    <input type="date" onChange={(e) => setFilter({...filter, dateTo: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sessionsTable">
                        <table>
                            <thead><tr><th>Session ID</th><th>Session Type</th><th>Track</th><th>Car</th><th>Date</th><th>Action</th></tr></thead>
                            <tbody>{ sessionsData.checked ? showSessions() : checkSessions() }</tbody>
                        </table>
                    </div>
            </div>

            { showPopup &&
            <Confirmation 
                message={`Wait! Do you really want to delete session ${showPopup}? This action is permanent!`}
                cancelAction={() => setShowPopup(null)}
                confirmAction={() => deleteSession(showPopup)}
            />}
        </>
    );
};