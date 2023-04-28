import { NavLink } from "react-router-dom";
import {
	RiArchiveFill,
	RiLogoutBoxLine,
	RiHome3Fill,
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
							<RiHome3Fill /> Main page
						</NavLink>
					</li>
					<li>
						<NavLink to="/sessions">
							<RiArchiveFill /> Sessions
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