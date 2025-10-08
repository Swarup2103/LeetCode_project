import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { registerUser } from "../authSlice";

// --- Zod Schema for Validation ---
const signUpSchema = z.object({
    firstName: z.string().min(3, "Full name must be at least 3 characters"),
    emailId: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// --- Main SignUp Component ---
function SignUp() {
    // State for toggling password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(signUpSchema)
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = (data) => {
        dispatch(registerUser(data));
    };

    // --- Social Icons ---
    const GoogleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.54,18.33 21.54,12.81C21.54,11.76 21.45,11.44 21.35,11.1Z"></path></svg>
    );
    const GithubIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.83,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"></path></svg>
    );

    return (
        <div data-theme="cupcake" className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md shadow-2xl bg-base-100">
                <div className="card-body p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                        <img 
                            src="https://assets.leetcode.com/static_assets/public/webpack_bundles/images/logo.c36eaf5e6.svg" 
                            alt="Logo of Platform" 
                            className="h-22 w-auto mb-3"
                        />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Full Name Input */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text">Full Name</span>
                            </label>
                            <input 
                                {...register('firstName')} 
                                type="text" 
                                placeholder="Username" 
                                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                            />
                            {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
                        </div>

                        {/* Email Input */}
                        <div className="form-control mt-3">
                            <label className="label py-1">
                                <span className="label-text">Email</span>
                            </label>
                            <input 
                                {...register('emailId')} 
                                type="email" 
                                placeholder="E-mail" 
                                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`} 
                            />
                            {errors.emailId && <span className="text-error text-xs mt-1">{errors.emailId.message}</span>}
                        </div>
                        
                        {/* Password Input */}
                        <div className="form-control mt-3 relative">
                            <label className="label py-1">
                                <span className="label-text">Password</span>
                            </label>
                            <input 
                                {...register('password')} 
                                type={showPassword ? "text" : "password"}
                                placeholder="Password" 
                                className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`} 
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-3 transform translate-y-1 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"} 
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                        <line x1="2" x2="22" y1="2" y2="22"/>
                                    </svg>
                                )}
                            </button>
                            {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
                        </div>
                        
                        {/* Confirm Password Input */}
                        <div className="form-control mt-3 relative">
                            <label className="label py-1">
                                <span className="label-text">Confirm Password</span>
                            </label>
                            <input 
                                {...register('confirmPassword')} 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password" 
                                className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? 'input-error' : ''}`} 
                            />
                             <button
                                type="button"
                                className="absolute top-1/2 right-3 transform translate-y-1 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"} 
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                        <line x1="2" x2="22" y1="2" y2="22"/>
                                    </svg>
                                )}
                            </button>
                            {errors.confirmPassword && <span className="text-error text-xs mt-1">{errors.confirmPassword.message}</span>}
                        </div>

                        {/* Submit Button */}
                        <div className="form-control mt-6">
                             <button 
                                type="submit" 
                                className="btn w-full bg-[#4A626C] hover:bg-[#3E525A] text-white border-none" 
                                disabled={isSubmitting}
                             >
                                {isSubmitting ? <span className="loading loading-spinner"></span> : "Sign Up"}
                            </button>
                        </div>
                    </form>
                    
                    <div className="divider my-4">OR</div>

                    <div className="flex justify-center gap-4">
                        <button className="btn btn-square btn-outline">
                            <GoogleIcon />
                        </button>
                         <button className="btn btn-square btn-outline">
                            <GithubIcon />
                        </button>
                    </div>
                    
                    <div className="text-center mt-4">
                        <p className="text-sm">
                            Already have an account? 
                            {/* FIX: Use Link component for client-side navigation */}
                            <Link to="/login" className="link link-primary ml-1">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;





/*
if error exist:
const errors = {
    firstName :{
        type: 'minLength',
        message: 'Name Should conatin atlest 3 chartacters'
    }
    emailId: {
        type: 'invalid_string',
        message: 'Invalid Email'
    }
        .
        .
        .
}
*/

/**
//1st version
 import { useState } from "react";

function SignUp(){
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [conFirmPass, setConfirmPass] = useState('');

    const handleSubmit = (e)=> {
        e.preventDefault();

        //data validations of fields (in frontend)
        //then why again we are validating data in backend?
        //ans: hacker or user can send data using postman also without using UI.. for that purpose we need to again validate in backend
        
        console.log(name, email, password);

    }

    return (
        <>
        <form onSubmit={handleSubmit}>
            <input type="text" value={name} placeholder="Enter your name" onChange={(e)=> setName(e.target.value)}></input>
            <input type="email" value={email} placeholder="Enter your email" onChange={(e)=> setEmail(e.target.value)}></input>
            <input type="password" value={password} placeholder="Enter password" onChange={(e)=> setPassword(e.target.value)}></input>

            <button type="submit">Submit</button>

        </form>
        
        </>
    )
}

export default SignUp;
 */


/*
//2nd version without css
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

//Schema validation
const signUpSchema = z.object({
    firstName: z.string().min(3, "Name Should conatin atlest 3 chartacters"),
    emailId: z.string().email('Invalid Email'),
    password: z.string().min(8, "Password should contain atleast 8 characters")
    //for using Capital, small, special symbol, number we need to use reg exp pattern
})

function SignUp(){
    const {register, handleSubmit, formState: {errors}} = useForm({resolver:zodResolver(signUpSchema)});
    //register: get data from frontend and saved in key-val pair.. like firstName : Swarup
    //handleSubmit: handleSubmit handle all submit related tasks.. and give data proper object format
    //error: handles errors

    return(
        <>
        <form onSubmit = {handleSubmit((data) => console.log(data))}>

            <input {...register('firstName')} placeholder="Enter name"></input>
            {errors.firstName && (<span>{errors.firstName.message}</span>)}

            <input {...register('emailId')} placeholder="Enater mailId"></input>
            {errors.emailId && (<span>{errors.emailId.message}</span>)} //Comment this: && => is firstCond true then return second statement, if undefined/false then return first statement 

            <input {...register('password')} placeholder="Enter password" type="password"></input>
            {errors.password ? (<span> {errors.password.message} </span>) : null} //Comment this: we can also use ternary operator also

            <button type="submit" className="btn btn-lg">Submit</button>
        </form>
        </>
    )
}

export default SignUp;
 */