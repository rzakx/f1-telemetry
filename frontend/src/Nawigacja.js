import { NavLink } from "react-router-dom";
import {
	RiCalendarTodoFill,
	RiLogoutBoxLine,
	RiDashboardFill,
	RiEqualizerFill,
	RiPulseLine,
	RiUserFill
} from "react-icons/ri";
import Axios from "axios";
import { useState } from "react";
import gb from "./GlobalVars";

export default function Nawigacja() {
	const [sprawdzona, setSprawdzona] = useState(false);

	const sprawdzSesje = () => {
		console.log("Sprawdzam sesje");
		if(localStorage.getItem("token")){
			Axios.get(
				gb.backendIP+"typkonta/" + localStorage.getItem("token")
			).then((res) => {
				if(!res.data['blad']){
					localStorage.setItem('login', res.data['login']);
					localStorage.setItem('avatar', res.data['avatar']);
					setSprawdzona(true);
				} else {
					localStorage.removeItem("token");
                    localStorage.removeItem("login");
					window.location.replace("/login");
				}
			}).catch(() => {
				localStorage.removeItem("token");
                localStorage.removeItem("login");
				window.location.replace("/login");
			});
		} else {
			window.location.replace("/login");
		}
	};

	const wyloguj = () => {
		localStorage.removeItem("token");
        localStorage.removeItem("login");
		sprawdzSesje();
	};

	return (
		<>
		<div className="logofirmy" style={{backgroundImage: `url('/img/logoglowna.jpg')`}}/>
		<header>
			{!sprawdzona && sprawdzSesje()}
			<nav>
				<ul>
					<li>
						<NavLink to="/">
							<RiDashboardFill /> Main page
						</NavLink>
					</li>
					<li>
						<NavLink to="/realtimehud">
							<RiPulseLine /> Realtime Data
						</NavLink>
					</li>
					<li>
						<NavLink id="sessionsHref" to="/sessions">
							<RiCalendarTodoFill /> Sessions
						</NavLink>
					</li>
					<li>
						<NavLink id="setupsHref" to="/setups">
							<RiEqualizerFill /> Car setups
						</NavLink>
					</li>
					<li>
						<NavLink to="/profile">
							<RiUserFill /> Profile
						</NavLink>
					</li>
				</ul>
				<button onClick={() => wyloguj()}>
					<RiLogoutBoxLine /> Logout
				</button>
			</nav>
		</header>
		</>
	);
}