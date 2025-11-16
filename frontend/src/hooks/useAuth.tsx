import { AuthContext } from "@/AuthProvider";
import { useContext } from "react";

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth must be used inside <AuthProvider> component.");
    return ctx;
}