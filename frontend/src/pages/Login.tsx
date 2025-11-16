import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { backendURL } from "@/GlobalVars";

const Login = () => {
    const formRef = useRef<HTMLFormElement>(null);
    const loginRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [ isProcessing, startProcessing ] = useTransition();
    const [ response, setResponse ] = useState<string | null>(null);
    const { setAccessToken, isAuth, navigate } = useAuth();

    const handleRequest = async (e: FormEvent) => {
        e.preventDefault();
        if(!!response) return;
        startProcessing(async () => {
            if(!loginRef.current) return;
            if(!passwordRef.current) return;
            if(!loginRef.current.value){
                setResponse("Username not provided.");
                loginRef.current.focus();
                return;
            }
            if(!passwordRef.current.value) {
                setResponse("Password not provided.");
                passwordRef.current.focus();
                return;
            }
            await axios.post(backendURL+"/login", { login: loginRef.current.value, password: passwordRef.current.value}, { withCredentials: true })
            .then((r) => {
                if(r.data.access_token) setAccessToken(r.data.access_token);
                // else setCredentials(x => ({...x, processing: false}));
            }).catch((er) => {
                setResponse(er.response?.data?.message || er.message);
            });
        })
    }

    useEffect(() => {
        if(isAuth) {
            navigate("/");
            return;
        }
    }, [isAuth]);

    return(
        <div className="w-dvw h-dvh flex justify-center items-center">
            <Card>
                <CardHeader>
                    <CardTitle>Logging In</CardTitle>
                    <CardDescription>If you would like to access the app you should authenticate yourself.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={formRef} className="space-y-2" onSubmit={(e) => handleRequest(e)}>
                        <Label htmlFor="usernameBox">Login</Label>
                        <Input
                            id="usernameBox"
                            ref={loginRef}
                            autoComplete="username"
                            type="text"
                            placeholder="Your username"
                            onChange={() => setResponse(null) }
                        />
                        <Label htmlFor="passBox">Password</Label>
                        <Input
                            id="passBox"
                            ref={passwordRef}
                            type="password"
                            autoComplete="current-password"
                            placeholder="Your password"
                            onChange={() => setResponse(null) }
                        />
                        { response && <p className="text-red-400 text-center text-sm mb-4">{response}</p> }
                        <Button
                            disabled={isProcessing || !!response }
                            className="w-full"
                            type="submit"
                            >Log In</Button>
                        <div className="text-center space-x-2">
                            <Link to="/signup" viewTransition><Button variant="link" size="sm" className="text-xs">New account</Button></Link>
                            <Link to="/recovery" viewTransition><Button variant="link" size="sm" className="text-xs">Reset password</Button></Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
};

export default Login;