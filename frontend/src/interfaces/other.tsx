import type { IPacketSessionHistoryData } from "./f1struct"

export interface ISessionOverall {
    user_id?: string,
    session_id: string,
    session_type: number,
    track_id: number,
    car_id: number,
    last_update: string | Date,
    completed: boolean,
    summary?: IPacketSessionHistoryData
}

export interface ICarSetup {
    id: number,
    name: string,
}

export interface IUserInfo {
    username: string,
    joined: Date | number,
    avatar: string,
    banner: string,
    favCar?: number,
    favTrack?: number,
    sessionsCount: number,
    ownSetups?: ICarSetup[],
    lastSessions?: ISessionOverall[]
}