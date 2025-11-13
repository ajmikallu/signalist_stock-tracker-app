'use client'
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/Constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";

const Signup = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues:{

        fullName:'',
        email: '',
        password: '',
        country: 'US',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    })
    const onSubmit = async(data:SignUpFormData) => {

        try{
            console.log(data)
        } catch(error){
            console.error(error)
        }
    }
    return (
        <>
            <h1 className='form-title'>Sign Up & Personalize</h1>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
                <InputField
                    name="fullName"
                    label='Full Name'
                    placeholder='Enter your full name'
                    register={register}
                    error={errors.fullName}
                    validation={{required:'Full name is required', minLength:2}}
                />
                <InputField
                    name="email"
                    label='Email'
                    placeholder='Enter your email'
                    register={register}
                    error={errors.email}
                    validation={{required:'email is required', pattern:/^\w+@\W+\.\W+$/, message: 'Email address is required'}}
                />
                <InputField
                    name="password"
                    label='Password'
                    type='password'
                    placeholder='Enter a strong password'
                    register={register}
                    error={errors.password}
                    validation={{required:'password is required', minLength:8}}
                />
                <CountrySelectField
                    name='country'
                    label='Country'
                    control={control}
                    error={errors.country}
                    required
                />
                <SelectField
                    name="investmentGoals"
                    label='Investment Goals'
                    placeholder='select Investment Goals'
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />
                <SelectField
                    name="riskTolerance"
                    label='Risk Tolerance'
                    placeholder='select Risk Tolerance'
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />
                <SelectField
                    name="preferredIndustry"
                    label='Preferred Industry'
                    placeholder='select Preferred Industry'
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type='submit' disabled={isSubmitting} className='yellow-btn w-full mt-5'>
                    {isSubmitting? 'Creating account' : 'Start your investing journey'}
                </Button>
                <FooterLink text='Already have an account?' linkText='Sign in' href='/sign-in' />
            </form>
        </>
    )
}
export default Signup
