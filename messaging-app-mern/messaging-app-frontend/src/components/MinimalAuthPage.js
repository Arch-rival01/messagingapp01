import React from 'react';
import { Button } from './ui/button';

import { ChevronLeft, Grid2x2Plus } from 'lucide-react';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Particles } from './ui/particles';

import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useStateValue } from '../StateProvider';
import { actionTypes } from '../reducer';

export function MinimalAuthPage() {
	// eslint-disable-next-line no-empty-pattern
	const [{}, dispatch] = useStateValue();

	const signInGoogle = () => {
		signInWithPopup(auth, provider)
			.then(async (result) => {
				try {
					const token = await result.user.getIdToken();
					await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users`, {
						method: 'POST',
						headers: { 
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({
							uid: result.user.uid,
							name: result.user.displayName,
							email: result.user.email,
							photoURL: result.user.photoURL,
						})
					});
				} catch (err) {
					console.error("Failed to register user to backend", err);
				}

				dispatch({
					type: actionTypes.SET_USER,
					user: result.user,
				});
			})
			.catch((error) => {
				alert(error.message);
			});
	};

	return (
		<div className="relative md:h-screen md:overflow-hidden w-full flex flex-col">
			<Particles
				color="#666666"
				quantity={120}
				ease={20}
				className="absolute inset-0"
			/>
			<div
				aria-hidden
				className="absolute inset-0 isolate -z-10 contain-strict"
			>
				<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 left-0 h-[320px] w-[140px] -translate-y-[87.5px] -rotate-45 rounded-full" />
				<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-[320px] w-[60px] [translate:5%_-50%] -rotate-45 rounded-full" />
				<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-[320px] w-[60px] -translate-y-[87.5px] -rotate-45 rounded-full" />
			</div>

			<div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 w-full">
				<Button variant="ghost" className="absolute top-4 left-4 z-20" asChild>
					{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
					<a href="#">
						<ChevronLeft className="mr-1 h-4 w-4" />
						Home
					</a>
				</Button>

				{/* Header Section Moved to Top */}
				<div className="flex flex-col items-center gap-4 mb-8 z-10">
					<div className="bg-slate-900 p-4 rounded-[24px] shadow-lg">
						<Grid2x2Plus className="h-16 w-16 text-white stroke-[1.5]" />
					</div>
					<p className="text-4xl font-extrabold tracking-widest text-slate-900 uppercase drop-shadow-sm">
						MESSAGING APP
					</p>
				</div>

				{/* Card Container for the Rest of the Items */}
				<div className="w-full sm:w-[420px] bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/50 z-10 space-y-6">
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
							Sign In or Join Now
						</h1>
						<p className="text-muted-foreground text-sm">
							Login or create your account to start chatting.
						</p>
					</div>

					<div className="space-y-4 pt-2">
						<Button 
							type="button" 
							size="lg" 
							className="w-full border-draw-btn h-12 text-base font-semibold"
							onClick={signInGoogle}
						>
							<GoogleIcon className="mr-3 h-5 w-5" />
							Continue with Google
						</Button>
						<Button 
							type="button" 
							size="lg" 
							className="w-full border-draw-btn h-12 text-base font-semibold"
						>
							<GitHubIcon className="mr-3 h-5 w-5" />
							Continue with GitHub
						</Button>
					</div>

					<p className="text-muted-foreground mt-8 text-xs text-center leading-relaxed">
						By clicking continue, you agree to our{' '}
						{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
						<a href="#" className="hover:text-slate-900 font-medium underline underline-offset-4 transition-colors">
							Terms of Service
						</a>{' '}
						and{' '}
						{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
						<a href="#" className="hover:text-slate-900 font-medium underline underline-offset-4 transition-colors">
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}

const GoogleIcon = (props) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);
