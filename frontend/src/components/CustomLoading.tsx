import type { ReactNode } from "react"

const CustomLoading = ({children}: {children?: ReactNode}) => {
    return(
        <div className="mx-auto p-2 px-4 tracking-widest font-semibold">
            <div className="flex gap-2 h-12 justify-center mb-2">
                <div className="w-6 h-full bg-card-foreground animate-[loadingCustom1_1.2s_infinite]" />
                <div className="w-6 h-full bg-card-foreground animate-[loadingCustom2_1.2s_infinite]" />
                <div className="w-6 h-full bg-card-foreground animate-[loadingCustom3_1.2s_infinite]" />
            </div>
            { children }
        </div>
    )
};

export default CustomLoading;