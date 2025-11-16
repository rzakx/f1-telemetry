import { useState, useMemo, createContext, type FC, type PropsWithChildren, type Dispatch, type SetStateAction, useCallback, useEffect } from "react";
import { AxiosError, type AxiosInstance, type AxiosRequestHeaders } from "axios";
import axios from "axios";
import { useNavigate, type NavigateFunction } from "react-router-dom";

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
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);
export const AuthProvider: FC<PropsWithChildren> = ({children}) => {
    let navigate = useNavigate();
    const [ user, setUser ] = useState<AccountInfo | null>(null);
    const [ accessToken, setAccessToken ] = useState<string | null>(localStorage.getItem("accessToken") || null);
    // const [ checking, setChecking ] = useState<boolean>(true);

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

    const refreshAccessToken = async () => {
        try {
            const { data } = await axios.post<{ access_token: string}>("https://backendformula.zakrzewski.dev/refresh", {}, { withCredentials: true });
            console.log("Refreshed Access Token succesfully.")
            setToken(data.access_token);
            return data.access_token;
        } catch(er) {
            console.log("Error while trying to refresh Access Token.", er);
            setToken(null);
            return null;
        }
    };

    const logout = useCallback(async () => {
        try {
            await api.post("/logout");
        } catch {}
        setToken(null);
    }, []);

    
    const api: AxiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: "https://backendformula.zakrzewski.dev",
            withCredentials: true
        });
        instance.interceptors.request.use((config) => {
            if(accessToken){
                config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` } as AxiosRequestHeaders;
            }
            return config;
        })
        
        instance.interceptors.response.use((res) => res, async (err: AxiosError) => {
            const original = err.config as any;
            if(err.response?.status === 401 && !original._retry){
                const newToken = await refreshAccessToken();
                if(newToken){
                    original._retry = true;
                    original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
                    return instance(original);
                }
            }
            return Promise.reject(err);
        })
        
        return instance;
    }, [ accessToken ]);

    useEffect(() => {
        console.log("AT:", accessToken);
        if(!accessToken) return;
        const fetchMe = async () => {
            try {
                const { data } = await api.get<AccountInfo>("/me");
                setUser(data);
            } catch {
                setUser(null);
            }
        };
        fetchMe();
    }, [accessToken]);

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