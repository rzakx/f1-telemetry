export interface ISessionOverall {
    id: number,
    session_id: bigint | string,
    sessionType: number,
    trackId: number,
    carId: number,
    lastUpdate: string | Date
}

export interface ICarSetup {
    id: number,
    name: string,
}

export interface IUserInfo {
    username: string,
    joined: Date | number,
    avatar?: string,
    banner?: string,
    favCar?: number,
    favTrack?: number,
    sessionsCount: number,
    ownSetups?: ICarSetup[],
    lastSessions?: ISessionOverall[]
}