import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { RiCalendarTodoFill, RiDashboardFill, RiEqualizerFill, RiLayoutLeftFill, RiLayoutLeftLine, RiLogoutBoxLine, RiPulseLine, RiUserFill } from "react-icons/ri";
import { useTheme } from "./components/theme-provider";
import { useState } from "react";

const ProtectedRoute = () => {
    const { isAuth, logout } = useAuth();
    const { theme, setTheme } = useTheme();
	const [ smallMenuShow, setSmallMenuShow ] = useState<boolean>(false);

    const StareNav = () => {
        return(
			<>
			<div className="max-[780px]:flex min-[780px]:hidden items-center justify-center bg-card w-14 h-14 p-3 fixed left-0 top-0 z-[11]" onClick={() => setSmallMenuShow(!smallMenuShow)}>{ smallMenuShow ? <RiLayoutLeftLine className="w-14 h-14" /> : <RiLayoutLeftFill className="w-14 h-14" />}</div>
            <header className={`fixed z-10 left-0 top-0 w-14 bottom-0 bg-sidebar
			text-sidebar-foreground hover:w-52 transition-all duration-300 overflow-hidden
			max-[780px]:pt-15
			${!smallMenuShow ? "max-[780px]:-translate-x-full" : ""}`}>
			<nav className="w-52 h-full flex flex-col justify-between">
				<ul>
					<li className="w-full ">
						<NavLink to="/" className={({isActive}) => `${isActive && "bg-primary text-card"} flex items-center w-full font-bold uppercase tracking-wider hover:bg-secondary transition-colors duration-300`}>
							<RiDashboardFill className="w-14 h-14 p-3.5" /> Main Page
						</NavLink>
					</li>
					<li>
						<NavLink to="/telemetry" className={({isActive}) => `${isActive && "bg-primary text-card"} flex items-center w-full font-bold uppercase tracking-wider hover:bg-secondary transition-colors duration-300`}>
							<RiPulseLine className="w-14 h-14 p-3.5" /> Realtime Data
						</NavLink>
					</li>
					<li>
						<NavLink id="sessionsHref" to="/sessions" className={({isActive}) => `${isActive && "bg-primary text-card"} flex items-center w-full font-bold uppercase tracking-wider hover:bg-secondary transition-colors duration-300`}>
							<RiCalendarTodoFill className="w-14 h-14 p-3.5" /> Sessions
						</NavLink>
					</li>
					<li>
						<NavLink id="setupsHref" to="/setups" className={({isActive}) => `${isActive && "bg-primary text-card"} flex items-center w-full font-bold uppercase tracking-wider hover:bg-secondary transition-colors duration-300`}>
							<RiEqualizerFill className="w-14 h-14 p-3.5" /> Car setups
						</NavLink>
					</li>
					<li>
						<NavLink to="/profile" className={({isActive}) => `${isActive && "bg-primary text-card"} flex items-center w-full font-bold uppercase tracking-wider hover:bg-secondary transition-colors duration-300`}>
							<RiUserFill className="w-14 h-14 p-3.5" /> Profile
						</NavLink>
					</li>
				</ul>
				<button onClick={() => logout()} className="flex items-center bg-card w-full font-bold uppercase tracking-wider cursor-pointer hover:bg-secondary transition-colors duration-300">
					<RiLogoutBoxLine className="w-14 h-14 p-3.5" /> Logout
				</button>
			</nav>
		</header>
		</>
        )
    }

    return isAuth ?
    <div className="w-dvw h-dvh bg-background">
        <div className="fixed top-0 right-0" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme}
        </div>
        <StareNav />
        <Outlet />
    </div>
    :
    <Navigate to="/login" replace />;
};

export default ProtectedRoute;