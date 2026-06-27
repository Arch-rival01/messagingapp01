import React from 'react';
import './Login.css';
import { Button } from '@mui/material';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useStateValue } from '../StateProvider';
import { actionTypes } from '../reducer';

const Login = () => {
    const [{}, dispatch] = useStateValue();

    const signIn = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
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
        <div className="login">
            <div className="login__container">
                <img 
                    src="/app_logo.png" 
                    alt="Messaging App Logo" 
                />
                <div className="login__text">
                    <h1>Sign in to Messaging App</h1>
                </div>
                <Button onClick={signIn}>
                    Sign In With Google
                </Button>
            </div>
        </div>
    );
};

export default Login;
