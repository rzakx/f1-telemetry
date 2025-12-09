import { useState, type FC, type PropsWithChildren, type Dispatch, type SetStateAction, useCallback, useEffect, useLayoutEffect, useRef } from "react";
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
    const isAuth = Boolean(accessToken);
    const isRefreshing = useRef(false);

    const failedQueue = useRef<{
        resolve: (token: string | null) => void;
        reject: (error: unknown) => void;
    }[]>([]);

    const processQueue = (error: unknown, token: string | null = null) => {
        failedQueue.current.forEach(promise => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(token);
            }
        });
        failedQueue.current = [];
    };

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
        if(isRefreshing.current){
            return new Promise<string | null>((resolve, reject) => {
                failedQueue.current.push({ resolve, reject });
            })
        }
        isRefreshing.current = true;
        try {
            const { data } = await axios.post<{ access_token: string}>("https://backendformula.zakrzewski.dev/refresh", {}, { withCredentials: true });
            console.log("Refreshed Access Token succesfully.")
            setToken(data.access_token);
            processQueue(null, data.access_token);
            isRefreshing.current = false;
            return data.access_token;
        } catch(er) {
            console.log("Failed to refresh access token.")
            processQueue(er, null);
            setToken(null);
            setUser(null);
            isRefreshing.current = false;
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
            setUser(x => {
                if(x == null) return data;
                if(x?.id !== data.id) return data;
                if(x?.login !== data.login) return data;
                if(x?.avatar !== data.avatar) return data;
                if(x?.banner !== data.banner) return data;
                if(x?.favCar !== data.favCar) return data;
                if(x?.favTrack !== data.favTrack) return data;
                if(x?.registered !== data.registered) return data;
                return x;
            });
        } catch(er) {
            console.log("Failed to fetch /me");
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
        console.log("New path: ", location.pathname);
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