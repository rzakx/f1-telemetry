import type { AxiosInstance } from "axios";
import { createContext, type Dispatch, type SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";

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