'use client'
import {useForm} from "react-hook-form";
import InputField from "@/components/forms/InputField";
import {Button} from "@/components/ui/button";
import FooterLink from "@/components/forms/FooterLink";

const SignIn = () => {
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

        try{
            console.log(data)
        } catch(error){
            console.error(error)
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
                    register={register}
                    placeholder='Enter your email'
                    error={errors.email}
                    validation={{required:'email is required', pattern:/^\w+@\W+\.\W+$/, message: 'Email address is required'}}
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
