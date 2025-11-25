import { useState, type FC, type PropsWithChildren, type Dispatch, type SetStateAction, useCallback, useEffect, useLayoutEffect } from "react";
import { AxiosError, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext, type AccountInfo } from "./AuthContext";

const api = axios.create({
    baseURL: "https://backendformula.zakrzewski.dev",
    withCredentials: true
});

export const AuthProvider: FC<PropsWithChildren> = ({children}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [ user, setUser ] = useState<AccountInfo | null>(null);
    const [ accessToken, setAccessToken ] = useState<string | null>(localStorage.getItem("accessToken") || null);
    // const [ _checking, setChecking ] = useState<boolean>(true);

    const isAuth = Boolean(accessToken);

    const setToken: Dispatch<SetStateAction<string | null>> = (token) => {
        if(typeof token === "function"){
            setAccessToken((prev) => {
                const value = token(prev);
                if(value) localStorage.setItem("accessToken", value);
                else localStorage.removeItem("accessToken");
                return value;
            })
        } else {
            if(token) localStorage.setItem("accessToken", token)
            else localStorage.removeItem("accessToken");
            setAccessToken(token);
        }
    };

    const refreshAccessToken = useCallback(async () => {
        try {
            const { data } = await axios.post<{ access_token: string}>("https://backendformula.zakrzewski.dev/refresh", {}, { withCredentials: true });
            console.log("Refreshed Access Token succesfully.")
            setToken(data.access_token);
            return data.access_token;
        } catch(_er) {
            setToken(null);
            setUser(null);
            return null;
        }
    }, []);

    useLayoutEffect(() => {
        const apiReq = api.interceptors.request.use((config: InternalAxiosRequestConfig & { _retry?: boolean } ) => {
            if(accessToken && !config._retry){
                config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` } as AxiosRequestHeaders;
            }
            return config;
        });
        return () => api.interceptors.request.eject(apiReq);
    }, [accessToken]);
    
    useLayoutEffect(() => {
        const apiRes = api.interceptors.response.use((res) => res, async (err: AxiosError) => {
            const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
            if(err.response?.status === 401 && !original?._retry){
                const newToken = await refreshAccessToken();
                if(newToken){
                    original._retry = true;
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return api(original);
                }
            }
            return Promise.reject(err);
        });
        return () => api.interceptors.response.eject(apiRes);
    }, [refreshAccessToken]);

    const refreshProfile = useCallback(async () => {
        try {
            const { data } = await api.get<AccountInfo>("/me");
            setUser(data);
        } catch(er) {
            setUser(null);
            if(axios.isAxiosError(er)){
                if(er.status === 403){
                    setToken(null);
                }
            }
        }
    }, []);
        
    const logout = useCallback(async () => {
        await api.post("/logout");
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        if(!isAuth) return;
        refreshProfile();
    }, [isAuth, location.pathname, refreshProfile]);

    return <AuthContext.Provider value={{
        user,
        api,
        navigate,
        accessToken,
        isAuth,
        logout,
        setAccessToken: setToken,
        refreshAccessToken,
        refreshProfile
    }}>
        {children}
    </AuthContext.Provider>;
};