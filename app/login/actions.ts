'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { Provider } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not sign up user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function oAuthLogin(provider: Provider) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    // We need to redirect to a callback route to exchange code for session
    // For now, Supabase handles the callback URL setting in dashboard
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: provider === 'google' ? { prompt: 'select_account' } : {},
        },
    })

    if (data.url) {
        redirect(data.url) // Redirects to Provider's login page
    }
}
