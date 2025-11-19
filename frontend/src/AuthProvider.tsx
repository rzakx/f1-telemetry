import { useState, type FC, type PropsWithChildren, type Dispatch, type SetStateAction, useCallback, useEffect, useLayoutEffect } from "react";
import { AxiosError, type AxiosInstance, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export type AuthContextData = {
    user: AccountInfo | null,
    api: AxiosInstance,
    navigate: NavigateFunction,
    accessToken: string | null,
    isAuth: boolean,
    // checking: boolean,
    // login: (login: string, password: string) => Promise<string | null>,
    logout: () => Promise<void>,
    setAccessToken: Dispatch<SetStateAction<string | null>>,
    refreshAccessToken: () => Promise<string | null>
};

export type AccountInfo = {
    id: number;
    login: string,
    avatar: string,
    registered: Date,
    description?: string,
    favCar?: number,
    favTrack?: number,
};

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
        
    const logout = useCallback(async () => {
        await api.post("/logout");
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        if(!isAuth) return;
        const fetchMe = async () => {
            try {
                const { data } = await api.get<AccountInfo>("/me");
                setUser(data);
            } catch {
                setUser(null);
            }
        };
        fetchMe();
    }, [isAuth, location.pathname]);

    return <AuthContext.Provider value={{
        user,
        api,
        navigate,
        accessToken,
        isAuth,
        logout,
        setAccessToken: setToken,
        refreshAccessToken
    }}>
        {children}
    </AuthContext.Provider>;
};