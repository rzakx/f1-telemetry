import { getTeamById, trackNameById } from "@/GlobalVars";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";
import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ProfileEditor = ({ isOpen, changeOpen, refreshContent }: { isOpen: boolean, changeOpen: (v: boolean) => void, refreshContent: () => void }) => {
	const [avatar, setAvatar] = useState<{blob?: string, name?: string, file?: File}>({
		blob: undefined, file: undefined, name: undefined,
	});
	const [banner, setBanner] = useState<{blob?: string, name?: string, file?: File}>({
		blob: undefined, file: undefined, name: undefined,
	});
	const [ passwd, setPasswd ] = useState<{current?: string, new?: string, new2?: string}>({current: undefined, new: undefined, new2: undefined});
	const [ processing, setProcessing ] = useState<boolean>(false);
	const { user, api, refreshProfile } = useAuth();

	const revertBanner = () => {
		if (banner.blob) URL.revokeObjectURL(banner.blob);
		setBanner(p => ({ ...p, name: undefined, blob: undefined, file: undefined }))
	};

	const revertAvatar = () => {
		if (avatar.blob) URL.revokeObjectURL(avatar.blob);
		setAvatar(p => ({ ...p, name: undefined, blob: undefined, file: undefined }))
	};

	const submitBanner = async () => {
		setProcessing(true);
		await api.post("/changeBanner", {
			bannerImg: banner.file
		},{ headers: { 'Content-Type': 'multipart/form-data'}})
		.then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Profile updated", {
					description: "Your banner has been changed.",
					dismissible: true,
					duration: 5_000
				});
				revertBanner();
				refreshProfileData();
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => {
			setProcessing(false);
		});
	};

	const refreshProfileData = useCallback(() => {
		refreshProfile();
		refreshContent();
	}, [refreshContent, refreshProfile]);

	const submitAvatar = async () => {
		setProcessing(true);
		await api.post("/changeAvatar", {
			avatarImg: avatar.file
		},{ headers: { 'Content-Type': 'multipart/form-data'}})
		.then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Profile updated", {
					description: "Your avatar has been changed.",
					dismissible: true,
					duration: 5_000
				});
				revertAvatar();
				refreshProfileData();
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => setProcessing(false));
	};

	const removeAvatar = useCallback(async () => {
		setProcessing(true);
		await api.post("/removeAvatar")
		.then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Profile updated", {
					description: "Your avatar has been changed.",
					dismissible: true,
					duration: 5_000
				});
				refreshProfileData();
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => setProcessing(false));
	}, [api, refreshProfileData]);

	const changeCar = useCallback(async (e: string) => {
		setProcessing(true);
		await api.post("/changeCar", { car: e })
		.then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Profile updated", {
					description: "Favourite car changed.",
					dismissible: true,
					duration: 5_000
				});
				refreshProfileData();
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => setProcessing(false));
	}, [api, refreshProfileData]);

	const changeTrack = useCallback(async (e: string) => {
		setProcessing(true);
		await api.post("/changeTrack", { track: e })
		.then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Profile updated", {
					description: "Favourite track changed.",
					dismissible: true,
					duration: 5_000
				});
				refreshProfileData();
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => setProcessing(false));
	}, [api, refreshProfileData]);

	const changePassword = async () => {
		setProcessing(true);
		await api.post("/changePassword", {
			currentPassword: passwd.current,
			newPassword: passwd.new,
			newPassword2: passwd.new2
		}).then((r) => {
			if(r.data['error']){
				toast.error("Error updating profile", {
					description: r.data['error'],
					dismissible: true,
					duration: 10_000
				});
			} else {
				toast.success("Password changed", {
					description: "Your password has been changed. You've been logged out from other devices.",
					dismissible: true,
					duration: 5_000
				});
				setPasswd({current: undefined, new: undefined, new2: undefined});
			}
		}).catch((er) => {
			toast.error("Error updating profile", {
                description: er.response?.data?.error || er.message,
                dismissible: true,
                duration: 10_000
            });
		}).finally(() => setProcessing(false))
	};

	if(!user){
		throw new Error("Cannot access ProfileEditor without valid current user object.");
	}
	return (
		<Sheet open={isOpen} onOpenChange={(open) => changeOpen(open)}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Profile settings</SheetTitle>
					<SheetDescription>If you feel like improving your profile visually, or changing your credentials. You can do it here.</SheetDescription>
				</SheetHeader>
				<div className="grid flex-1 auto-rows-min gap-6 px-4">
					<div className="grid gap-3">
						<Label htmlFor="edit-favcar">Favourite Car</Label>
						<Select value={user.favCar?.toString() ?? "-1"} onValueChange={(e) => changeCar(e)} disabled={processing}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose value" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={"-1"}>None</SelectItem>
								{Object.entries(getTeamById).map((x) => <SelectItem key={"car"+x[0].toString()} value={x[0].toString()}>{x[1].name}</SelectItem>)}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-3">
						<Label htmlFor="edit-favtrack">Favourite Track</Label>
						<Select value={user?.favTrack?.toString() ?? "-1"} onValueChange={(e) => changeTrack(e)} disabled={processing}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose value" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={"-1"}>None</SelectItem>
								{Object.entries(trackNameById).map((x) => <SelectItem key={"track"+x[0].toString()} value={x[0].toString()}>{x[1]}</SelectItem>)}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-3">
						<Label htmlFor="edit-banner">Banner photo</Label>
						<label htmlFor="edit-banner" className="cursor-pointer hover:opacity-80 aspect-[4/1] border-1 bg-sidebar shadow-[0_0_4px_0] bg-no-repeat shadow-sidebar bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${banner.file ? banner.blob : user?.banner})` }} />
						<input id="edit-banner" className="hidden" type="file" accept="image/png, image/jpeg" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const selected = e.target.files;
							if (!selected || selected.length === 0) {
								setBanner({ name: undefined, blob: undefined, file: undefined });
								return;
							}
							const fileObj = selected[0];
							const fileBlob = URL.createObjectURL(fileObj);
							setBanner({ name: e.target.value, blob: fileBlob, file: fileObj });
						}} />
						{banner.file && <div className="grid grid-cols-2 gap-3">
							<Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => revertBanner()} disabled={processing}>Revert</Button>
							<Button size="sm" className="cursor-pointer" onClick={() => submitBanner()} disabled={processing}>Save banner</Button>
						</div>}
					</div>
					<div className="grid gap-3">
						<Label htmlFor="edit-avatar">Avatar photo</Label>
						<input id="edit-avatar" disabled={processing} className="hidden" type="file" accept="image/png, image/jpeg" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const selected = e.target.files;
							if (!selected || selected.length === 0) {
								setAvatar({ name: undefined, blob: undefined, file: undefined });
								return;
							}
							const fileObj = selected[0];
							const fileBlob = URL.createObjectURL(fileObj);
							setAvatar({ name: e.target.value, blob: fileBlob, file: fileObj });
						}} />
						<div className="flex gap-3">
							<label htmlFor="edit-avatar" className="cursor-pointer hover:opacity-80 h-full min-h-12 max-h-36 aspect-square bg-card border-2 border-foreground shadow-[0_0_4px_0] shadow-accent rounded-lg bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url(${avatar.file ? avatar.blob : user?.avatar})` }} />
							<div className="flex gap-3 grow flex-col">
								<Button disabled={processing} variant="secondary" size="sm" className="cursor-pointer px-0"><label htmlFor="edit-avatar" className="cursor-pointer w-full px-3">Choose {avatar.file ? "other" : "new"} file</label></Button>
								{avatar.file ? <Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => revertAvatar()} disabled={processing}>Cancel avatar change</Button> : <Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => removeAvatar()}>Remove current avatar</Button>}
								{avatar.file && <Button size="sm" className="cursor-pointer" onClick={() => submitAvatar()} disabled={processing}>Save avatar</Button>}
							</div>
						</div>
					</div>
					<div className="grid gap-3">
						<h3 className="text-center">Change password</h3>
						<Label htmlFor="edit-currentPwd">Current password</Label>
						<Input disabled={processing} className="-mt-1" id="edit-currentPwd" name="password" type="password" onChange={(e) => setPasswd(p => ({ ...p, current: e.target.value }))} value={passwd.current ?? ""} />
						<Label htmlFor="edit-newPwd">New password</Label>
						<Input disabled={processing} className="-mt-1" id="edit-newPwd" type="password" onChange={(e) => setPasswd(p => ({ ...p, new: e.target.value }))} value={passwd.new ?? ""} />
						<Label htmlFor="edit-newPwd2">Repeat new password</Label>
						<Input disabled={processing} className="-mt-1" id="edit-newPwd2" type="password" onChange={(e) => setPasswd(p => ({ ...p, new2: e.target.value }))} value={passwd.new2 ?? ""} />
						{ passwd.current && passwd.new && passwd.new2 && <Button variant="secondary" disabled={processing} className="cursor-pointer disabled:cursor-progress aria-disabled:cursor-progress" onClick={() => changePassword()} size="sm">Confirm</Button> }
					</div>
				</div>
				<SheetFooter>
					<Button onClick={() => refreshProfileData()}>Refresh data</Button>
					<SheetClose asChild>
						<Button variant="secondary" className="cursor-pointer">Close</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
};
export default ProfileEditor;