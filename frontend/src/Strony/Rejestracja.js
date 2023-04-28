import { useState } from "react";
import Axios from "axios";
import gb from "../GlobalVars";
export default function Rejestracja(){
    document.title = "f1-telemetry | Register account";
    const [login, setLogin] = useState(null);
    const [email, setEmail] = useState(null);
    const [haslo, setHaslo] = useState(null);
    const [haslo2, setHaslo2] = useState(null);
    const [blad, setBlad] = useState(null);
    const [etap, setEtap] = useState(null);

    const zarejestruj = async (e) => {
        if(!login){
            setBlad("Fill up your username!");
            return;
        }
        if(login.length < 3 || login.length > 60) {
            setBlad("Incorrect length of username!");
            return;
        }
        if(!email){
            setBlad("Fill up your e-mail!");
            return;
        }
        if(!haslo || !haslo2){
            setBlad("Fill up your passwords!");
            return;
        }
        if(haslo != haslo2){
            setBlad("Your passwords don't match");
            return;
        }
        if(haslo.length < 3 || haslo.length > 60){
            setBlad("Incorrect length of password!");
            return;
        }
        await Axios.post(gb.backendIP+"register",
				{
					username: login,
					password: haslo,
                    email: email
				}).then((res) => {
					if(!res.data['blad']){
						setEtap(1);
					} else {
						setBlad(res.data['blad'] || "Error! Account wasn't created!");
					}
				}).catch((er) => {
					setBlad("Error: "+er.message);
				});
    };

    const registerForm = () => {
        return(
            <>
            <h3>Fill up your account details to get access to the system!</h3>
			{blad && <h5>{blad}</h5>}
            <div style={{display: 'flex', gap: '10px'}}>
			    <input type="text" name="login" onChange={(e) => { setLogin(e.target.value); setBlad(null); } } placeholder="Username"/>
                <input type="email" name="email" onChange={(e) => { setEmail(e.target.value); setBlad(null); } } placeholder="E-Mail"/>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
    		    <input type="password" name="haslo" onChange={(e) => { setHaslo(e.target.value); setBlad(null); } } placeholder="Password"/>
                <input type="password" name="haslo2" onChange={(e) => { setHaslo2(e.target.value); setBlad(null); } } placeholder="Repeat password"/>
            </div>
			<input type="submit" value="Register" onClick={(e) => {
				e.preventDefault();
				zarejestruj(e);
			}} disabled={blad ? true : false}/>
            <a href="/">Back to login</a>
            </>
        );
    };

    const zakonczono = () => {
        return(
            <>
            <h3>Done! Your account was created and you are able to log in!</h3>
            <input type="submit" value="Done" onClick={(e) => {
                e.preventDefault();
                window.location.replace("/login");
            }} />
            </>
        )
    }

    return(
        <div className="logowanieBg">
			<div className="logowanie">
				<div className="logowanieLewa">
					<div className="logowanieLogo" />
				</div>
				<div className="logowaniePrawa">
					<h1>Registration</h1>
                    { (etap == 1) ? zakonczono() : registerForm() }
				</div>
			</div>
		</div>
    );
};