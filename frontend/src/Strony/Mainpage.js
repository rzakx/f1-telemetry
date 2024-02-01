import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import Axios from "axios";
import { useState } from "react";

export default function Mainpage(props){
    document.title = "TrackVision - Mainpage"
    const [stats, setStats] = useState({checked: false, sessionsO: 0, sessionsA: 0, setupsO: 0, setupsA: 0, queue: 0, lastsession: null, favCar: undefined, favTrack: undefined});
    const [frames, setFrames] = useState({checked: false, own: 0, all: 0});

    const checkStats = () => {
        Axios.post(gb.backendIP+"mainStats/"+localStorage.getItem('token')).then((r) => {
            setStats({...stats, ...r.data, checked: true});
        }).catch((er) => {
            console.log("Error while getting main page statistics");
            console.log(er);
            setStats({...stats, checked: true});
        });
    };

    const checkFrames = () => {
        Axios.post(gb.backendIP+"mainStatsFrames/"+localStorage.getItem('token'), {haveSessions: stats.sessionsO ? true : false}).then((r) => {
            setFrames({...r.data, checked: true});
        }).catch((er) => {
            console.log("Error while getting main page FRAME statistics");
            console.log(er);
            setFrames({...frames, checked: true});
        });
    };

    return(
        <>
            <Nawigacja />
            <div className="screen">
                <div className="middle" style={{margin: 'auto', height: 'initial', paddingBottom: '100px'}}>
                    <div className="mainPageTop">
                        <div className="mainPageProfile">
                            <div className="mainPageAvatar" style={{backgroundImage: `url('${localStorage.getItem('avatar')}')`}}/>
                            <div className="mainPageProfileData">
                                <div><span>Greetings,<br/><b>{localStorage.getItem("login")}</b></span></div>
                                <div><span>Favourite car:<br/>{stats.favCar ? gb.teamIds[stats.favCar] : stats.checked ? "Unknown" : "???"}</span></div>
                                <div><span>Favourite track:<br/>{stats.favTrack ? gb.trackIds[stats.favTrack] : stats.checked ? "Unknown" : "???"}</span></div>
                            </div>
                        </div>
                        <div className="mainPageSession">
                            {
                                (stats.lastsession != null) ?
                                <>
                                    <span>Your last session {new Date(stats.lastsession.lastUpdate).toLocaleDateString('pl-PL', {day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"})}</span>
                                    <span style={{color: "crimson", cursor: 'pointer'}} onClick={() => window.location.href = "/session/"+stats.lastsession.session_id}>ID {stats.lastsession.session_id}</span>
                                    <span>{gb.sessionType[stats.lastsession.sessionType]} on {gb.trackIds[stats.lastsession.trackId]}</span>
                                    <span>with {gb.teamIds[stats.lastsession.carId]}</span>
                                    <img style={{width: 260, height: 'fit-content', transform: 'scaleX(-1)'}} src={"/images/"+gb.carImages[stats.lastsession.carId]} />
                                </>
                                : <span>No sessions detected.<br/>Set up your telemetry settings and start driving!</span>
                            }
                        </div>
                        {(stats.lastsession != null) ? <img style={{height: '80%', maxWidth: '200px', marginLeft: '20px'}} src={"/images/"+gb.trackMaps[stats.lastsession.trackId]} /> : ""}
                    </div>
                    <div className="mainPageBottom">
                        <div className="mainBottomColumn">
                            <div><span>Your saved sessions</span><span>{stats.sessionsO ? stats.sessionsO : "None"}</span></div>
                            <div><span>Your session frames count</span><span>{frames.own ? frames.own.toLocaleString() : frames.checked ? "None" : "?"}</span></div>
                            <div><span>Your saved setups</span><span>{stats.setupsO ? stats.setupsO : "None"}</span></div>
                        </div>
                        <div className="mainBottomColumn">
                            <div><span>Total saved sessions</span><span>{stats.sessionsA ? stats.sessionsA : "None"}</span></div>
                            <div><span>Total sessions frames count</span><span>{frames.all ? frames.all.toLocaleString() : frames.checked ? "None" : "?"}</span></div>
                            <div><span>Total saved setups</span><span>{stats.setupsA ? stats.setupsA : "None"}</span></div>
                            <div><span>Data packets queue</span><span>{stats.queue ? stats.queue : "Empty"}</span></div>
                        </div>
                    </div>
                </div>
                {!stats.checked && checkStats() }
                {(!frames.checked && stats.checked) && checkFrames()}
            </div>
        </>
    );
};