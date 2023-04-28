import { useState } from "react";
import Axios from "axios";
import gb from "../GlobalVars";
export default function ResetHasla(props){
    const [etap, setEtap] = useState(0);
	const [login, setLogin] = useState(null);
    const [kodzwrotny, setKodzwrotny] = useState(null);
	const [haslo, setHaslo] = useState(null);
    const [haslo2, setHaslo2] = useState(null);
	const [blad, setBlad] = useState(false);
	document.title = "f1-telemetry | Reset password";

    const etap0 = () => {
        return(
            <>
            <h1>Reset password</h1>
					<h3>Fill up your username to start resetting your password!</h3>
					{blad && <h5>{blad}</h5>}
					<input type="text" name="login" onChange={(e) => { setLogin(e.target.value); setBlad(null); } } onKeyDown={(e) => { 
						if(e.key === 'Enter') { e.preventDefault(); etap0Btn(e); }
						}} placeholder="Username"/>
					<input type="submit" value="Next step" onClick={(e) => {
						e.preventDefault();
						etap0Btn(e);
					}} disabled={blad ? true : false}/>
            </>
        )
    };

    const etap1 = () => {
        return(
            <>
            <h1>Reset password</h1>
					<h3>You should receive special code on your e-mail!</h3>
					{blad && <h5>{blad}</h5>}
					<input type="text" name="kodzwrotny" onChange={(e) => { setKodzwrotny(e.target.value); setBlad(null); } } onKeyDown={(e) => { 
						if(e.key === 'Enter') { e.preventDefault(); etap1Btn(e); }
						}} placeholder="Reset Code"/>
					<input type="submit" value="Next step" onClick={(e) => {
						e.preventDefault();
						etap1Btn(e);
					}} disabled={blad ? true : false}/>
            </>
        );
    };

    const etap2 = () => {
        return(
            <>
            <h1>Reset password</h1>
					<h3>Almost done! It's time to set up your new password!</h3>
					{blad && <h5>{blad}</h5>}
					<input type="password" name="haslo" onChange={(e) => { setHaslo(e.target.value); setBlad(null); } } placeholder="Password"/>
                    <input type="password" name="haslo2" onChange={(e) => { setHaslo2(e.target.value); setBlad(null); } } onKeyDown={(e) => { 
						if(e.key === 'Enter') { e.preventDefault(); etap2Btn(e); }
						}} placeholder="Repeat Password"/>
					<input type="submit" value="Reset" onClick={(e) => {
						e.preventDefault();
						etap2Btn(e);
					}} disabled={blad ? true : false}/>
            </>
        );
    };

    const etap3 = () => {
        return(
            <>
            <h1>Reset password</h1>
            <h3>Done! You're able to log in with your new password!</h3>
            <input type="submit" value="Done" onClick={(e) => {
                e.preventDefault();
                window.location.replace("/login");
            }} />
            </>
        );
    };

    const etap0Btn = (e) => {
		if(login){
			if(login.length > 3 && login.length < 60){
				Axios.post(gb.backendIP+"reset",
				{
					username: login
				}).then((res) => {
					if(!res.data['blad']){
						setEtap(1);
                        setBlad(null);
					} else {
						setBlad("There isn't any account with such username!");
					}
				}).catch((er) => {
					setBlad("Error: "+er.message);
				});
			} else {
				setBlad("Incorrect length of data!");
			}
		} else {
			setBlad("Fill up your username!");
		}
	};

    const etap1Btn = () => {
        if(kodzwrotny){
            if(kodzwrotny.length > 30 && kodzwrotny.length < 45){
                Axios.post(gb.backendIP+"resetcheck",
                {
                    kodzik: kodzwrotny
                }).then((res) => {
                    if(!res.data['blad']){
                        setEtap(2);
                        setBlad(null);
                    } else {
                        setBlad("Invalid code!");
                    }
                }).catch((err) => {
                    setBlad("Error: "+err.message);
                });
            } else {
                setBlad("Invalid length of code!");
            }
        } else {
            setBlad("Fill up your reset code!");
        }
    };

    const etap2Btn = (e) => {
		if(haslo && haslo2 && (haslo === haslo2)){
			if(haslo.length > 3 && login.length < 60){
				Axios.post(gb.backendIP+"resetfinal",
				{
					kodzwrotny: kodzwrotny,
                    haslo: haslo
				}).then((res) => {
					if(!res.data['blad']){
						setEtap(3);
                        setBlad(null);
					} else {
						setBlad("Your password hasn't changed! Did you provide correct reset code?");
					}
				}).catch((er) => {
					setBlad("Error: "+er.message);
				});
			} else {
				setBlad("Invalid length of data!");
			}
		} else {
			setBlad("Your passwords doesn't match!");
		}
	};

	return(
		<div className="logowanieBg">
			<div className="logowanie">
				<div className="logowanieLewa">
					<div className="logowanieLogo" />
				</div>
				<div className="logowaniePrawa">
                    { (etap === 0) && etap0() }
                    { (etap === 1) && etap1() }
                    { (etap === 2) && etap2() }
                    { (etap === 3) && etap3() }
                    <a href="/login">Nevermind, go back!</a>
				</div>
			</div>
		</div>
	);
}