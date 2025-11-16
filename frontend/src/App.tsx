import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Mainpage from "./pages/Mainpage";
import Login from "./pages/Login";
import { AuthProvider } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import Realtime from "./pages/Realtime";
import MapGenerator from "./pages/MapGenerator";
import Profile from "./pages/Profile";

const App = () => {
	return (
		<Router>
			<AuthProvider>
				<ThemeProvider defaultTheme="dark" storageKey="themeMode">
					<Routes>
						<Route path='/login' element={ <Login /> } />
						<Route path='/signup' element={<></>} />
						<Route path='/recovery' element={<></>} />
						
						{/* Requires Auth */}
						<Route element={<ProtectedRoute />}>
							<Route path='/' element={<Mainpage />} />
							<Route path='/telemetry' element={<Realtime />} />
							<Route path='/mapa' element={<MapGenerator />} />
							<Route path='/sessions' element={<>User sessions</>} />
							<Route path='/session/:sessionId' element={<>User session</>} />
							<Route path='/setups' element={<>Available setups</>} />
							<Route path='/setup/:setupId' element={<>Exact setup</>} />
							<Route path='/profile' element={<Profile />} />
							<Route path='/profile/:username' element={<Profile />} />
						</Route>
						<Route path="*" element={<>404 not exist</>} />
					</Routes>
				</ThemeProvider>
			</AuthProvider>
		</Router>
	)
}

export default App