import { useState } from "react";
import Axios from "axios";
import gb from "../GlobalVars";
export default function Logowanie(props){
	const [login, setLogin] = useState(null);
	const [haslo, setHaslo] = useState(null);
	const [blad, setBlad] = useState(false);

	document.title = "f1-telemetry | Log In";
	const autoryzacja = async (e) => {
		if(login && haslo){
			if(login.length > 3 && login.length < 60 && haslo.length > 3 && haslo.length < 60){
				await Axios.post(gb.backendIP+"login",
				{
					username: login,
					password: haslo
				}).then((res) => {
					if(!res.data['blad']){
						localStorage.setItem('login', res.data['login']);
						localStorage.setItem('token', res.data['token']);
						window.location.replace("./");
					} else {
						setBlad("Incorrect data!");
					}
				}).catch((er) => {
					setBlad("Error: "+er.message);
				});
			} else {
				setBlad("Invalid length of data!");
			}
		} else {
			setBlad("Empty log in data!");
		}
	};

	return(
		<div className="logowanieBg">
			<div className="logowanie">
				<div className="logowanieLewa">
					<div className="logowanieLogo" />
				</div>
				<div className="logowaniePrawa">
					<h1>Logging In</h1>
					<h3>If you want to access the system you should log on your account!</h3>
					{blad && <h5>{blad}</h5>}
					<input type="text" name="login" onChange={(e) => { setLogin(e.target.value); setBlad(null); } } placeholder="Username"/>
					<input type="password" name="haslo" onChange={(e) => { setHaslo(e.target.value); setBlad(null); } } onKeyDown={(e) => { 
						if(e.key === 'Enter') { e.preventDefault(); autoryzacja(e); }
						}} placeholder="Password"/>
					<input type="submit" value="Log In" onClick={(e) => {
						e.preventDefault();
						autoryzacja(e);
					}} disabled={blad ? true : false}/>
					<div style={{display: 'flex', gap: '20px'}}>
                        <a href="/resetpass">Reset password</a> <a href="/signup">Sign up</a>
                    </div>
				</div>
			</div>
		</div>
	);
}