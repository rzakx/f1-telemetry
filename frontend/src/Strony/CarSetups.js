import Nawigacja from "../Nawigacja";
import Axios from "axios";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {BsFillExclamationSquareFill, BsFillStopwatchFill, BsFillXSquareFill} from "react-icons/bs";
import { WiDaySunny, WiRain, WiStars} from "react-icons/wi";
import { FaFlagCheckered } from "react-icons/fa6";
import Confirmation from "../Components/Confirmation.js";

import gb from "../GlobalVars";

export default function CarSetups(props) {
	document.title = "TrackVision - Setups";
	const [showPopup, setShowPopup] = useState(null);
	const [setupsData, setSetupsData] = useState({checked: false, data: null, error: null});
	const [error, setError] = useState(null);
	const [ filter, setFilter ] = useState({sessionType: 0, car: -1, dateFrom: null, dateTo: null, track: -1, weather: 0});
	const sessionTypes = ['Any session', <>Race <FaFlagCheckered /></>, <>Hotlap <BsFillStopwatchFill /></>];
	const weatherTypes = [<>Any <WiStars /></>, <>Dry <WiDaySunny /></>, <>Wet <WiRain /></>];


	const checkSetups = () => {
        Axios.post(gb.backendIP+"setups/"+localStorage.getItem("token")).then((r) => {
            if(r.data['data']){
                setSetupsData({checked: true, data: r.data['data'], error: null});
            } else {
                setSetupsData({checked: true, data: null, error: <i>No setups found! Maybe it's time to create a new one<br />or just wait until other users share their ideas...</i>});
            }
        }).catch((err) => {
            setSetupsData({...setupsData, error: err.message, checked: true});
        })
    };

	const deleteSetup = (id) => {
		Axios.post(gb.backendIP+"deleteSetup/"+localStorage.getItem("token")+"/"+id).then((r) => {
			if(!r.data['odp']){
				setError(r.data['error']);
				setShowPopup(null);
			} else {
				setSetupsData({checked: false, data: null, error: null});
				setShowPopup(null);
			}
		}).catch((er) => {
			setError("Error! "+er.message);
			setShowPopup(null);
		});
	}

    const showSetups = () => {
        if(!setupsData.data){
            return(
                <>
                    <tr>
                        <td colSpan={7} rowSpan={6}>{setupsData.error}</td>
                    </tr>
                </>
            );
        } else {
            return(
                setupsData.data.map((row) => {
                    const timestampRow = new Date(row.created).getTime();
                    if(filter.sessionType != 0){
						if(row.type != 0) {
							if(filter.sessionType != row.type) return;
						}
					}
                    if((filter.track != -1) && (filter.track != row.track)) return;
                    if(filter.car != -1){
						if(row.car != -1){
							if(filter.car != row.car) return;
						}
					}
					if(filter.weather != 0){
						if(row.weather != 0){
							if(filter.weather != row.weather) return;
						}
					}
                    if((filter.dateFrom) && (filter.dateFrom > row.created)) return;
                    if(filter.dateTo){
                        let filterDo = new Date(filter.dateTo);
                        filterDo = filterDo.setDate(filterDo.getDate() + 1);
                        if (filterDo < timestampRow) return;
                    }
                    return(
                        <tr key={row.id}>
                            <td>{row.id}</td>
                            <td className="setupsSCol">{sessionTypes[row.type] || "Any session"}</td>
                            <td>{gb.trackIds[row.track] || "Unknown"}</td>
                            <td>{gb.teamIds[row.car] || "All cars"}</td>
							<td className="setupsWCol">{weatherTypes[row.weather] || "Any weather"}</td>
							<td>{row.login ?
							<><NavLink className='setupProfile' to={`/profile/${row.login}`}><div className="miniAvatar" style={{backgroundImage: `url(${row.avatar})`}}/> {row.login}</NavLink></>
							: "User deleted"}</td>
                            <td>{new Date(row.created).toLocaleString('pl-PL', {day: '2-digit', month: 'long'})} {new Date(row.created).toLocaleString('pl-PL', {hour: '2-digit', minute: '2-digit'})}</td>
                            <td>
                                <NavLink className="tabelaOdnosnik" to={"/setup/"+row.id}><BsFillExclamationSquareFill />Show</NavLink>
                                {row.login && (row.login == localStorage.getItem('login')) ? <button className="tabelaOdnosnik danger" onClick={() => setShowPopup(row.id)}><BsFillXSquareFill />Delete</button> : "" }
                            </td>
                        </tr>
                    );
                })
            );
        }
    };

	return (
		<>
			<Nawigacja />
			<div className="screen">
				<div className="screenHeader smoothIn">
					<div className="screenHeaderTitle">
						<h1 className="title">Setups</h1>
						<h3 className="title">Save and share your car setups</h3>
					</div>
					<div className="sessionsFilters smoothIn">
						<div className="row">
							<div className="sessionsFilter">
								<span>Track</span>
								<select onChange={(e) => setFilter({...filter, track: e.target.value})}>
									<option value={-1}>Any</option>
									{gb.trackIds.map((v, i) => {
										return <option value={i}>{v}</option>;
									})}
								</select>
							</div>
							<div className="sessionsFilter">
								<span>Session Type</span>
								<select onChange={(e) => setFilter({...filter, sessionType: e.target.value})}>
									<option value={0}>Any</option>
									<option value={1}>Race</option>
									<option value={2}>Hotlap</option>
								</select>
							</div>
							<div className="sessionsFilter">
								<span>Weather</span>
								<select onChange={(e) => setFilter({...filter, weather: e.target.value})}>
									<option value={0}>Any</option>
									<option value={1}>Dry</option>
									<option value={2}>Wet</option>
								</select>
							</div>
						</div>
						<div className="row">
							<div className="sessionsFilter">
								<span>Car</span>
								<select onChange={(e) => setFilter({...filter, car: e.target.value})}>
									<option value={-1}>Any</option>
									{Object.entries(gb.teamIds).map((v, i) => {
										if(Number(v[0]) > 10) return;
										return (<option value={v[0]}>{v[1]}</option>);
									})}
								</select>
							</div>
							<div className="sessionsFilter">
								<span>Date</span>
								<input type="date" onChange={(e) => setFilter({...filter, dateFrom: e.target.value})}/>
							</div>
							<div className="sessionsFilter" style={{ marginLeft: "-30px" }}>
								<span>-</span>
								<input type="date" onChange={(e) => setFilter({...filter, dateTo: e.target.value})}/>
							</div>
							<NavLink to="/createSetup" className="newSetupBtn">New setup</NavLink>
						</div>
					</div>
				</div>
				<div className="sessionsTable smoothIn" style={{position: 'relative'}}>
					{error ? <div className="setupPopup"><span>{error}</span> <button onClick={() => setError(null)}>Understood</button></div> : "" }
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Type</th>
								<th>Track</th>
								<th>Car</th>
								<th>Weather</th>
								<th>Author</th>
								<th>Date</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>{setupsData.checked ? showSetups() : checkSetups()}</tbody>
					</table>
				</div>
			</div>
			{ showPopup &&
            <Confirmation 
                message={`Wait! Do you really want to delete setup ${showPopup}? This action is permanent!`}
                cancelAction={() => setShowPopup(null)}
                confirmAction={() => deleteSetup(showPopup)}
            />}
		</>
	);
}
