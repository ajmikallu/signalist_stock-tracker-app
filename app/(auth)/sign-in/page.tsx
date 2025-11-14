'use client'
import {useForm} from "react-hook-form";
import InputField from "@/components/forms/InputField";
import {Button} from "@/components/ui/button";
import FooterLink from "@/components/forms/FooterLink";
import {signInWithEmail} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";


const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>
    ({
            defaultValues: {
                email: '',
                password: '',
             },
        mode: 'onBlur'
    })
    const onSubmit = async(data:SignInFormData) => {

            console.log(data);
        try{
            const result = await signInWithEmail(data)
            if(result.success) router.push('/')

        } catch(error){
            console.error(error)
            toast.error('Sign in failed', {
                description: error instanceof Error ? error.message : 'Failed to sign in.'
            })
        }
    }

    return (
        <>
            <h1 className='form-title'>
                Sign In
            </h1>
            <form onSubmit={(handleSubmit(onSubmit))} className='space-y-5'>
                <InputField
                    name="email"
                    label='Email'
                    type='email'
                    register={register}
                    placeholder='Enter your email'
                    error={errors.email}
                    validation={{required:'email is required', pattern:/^\w+@\w+\.\w+$/, message: 'Email address is required'}}
                    // validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />
                <InputField
                    name="password"
                    label='Password'
                    register={register}
                    placeholder='Enter your password'
                    type='password'
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />
                <Button type='submit' disabled={isSubmitting} className='yellow-btn w-full mt-5'>
                    {isSubmitting ? 'Signing In' : 'Sign In'}
                </Button>
                <FooterLink text='Dont have an account' linkText='Create an account' href='/sign-up' />
            </form>
        </>
    )
}
export default SignIn
