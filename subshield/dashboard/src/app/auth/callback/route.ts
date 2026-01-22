import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error from Supabase (e.g., expired link, invalid token)
  if (error) {
    const errorMessage = encodeURIComponent(errorDescription || 'Authentication failed. Please try again.');
    return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, requestUrl.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      // Handle specific error cases
      const errorMessage = encodeURIComponent(
        exchangeError.message.includes('expired')
          ? 'Your verification link has expired. Please request a new one.'
          : exchangeError.message.includes('invalid')
          ? 'Invalid verification link. Please request a new one.'
          : 'Authentication failed. Please try again.'
      );
      return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, requestUrl.origin));
    }

    if (data.user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // If no profile exists (new OAuth user), create one
      if (!existingProfile) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
        } as never);

        // Create free subscription for new user
        await supabase.from('subscriptions').insert({
          user_id: data.user.id,
          tier: 'free',
          status: 'active',
          contracts_limit: 1,
          contracts_used_this_month: 0,
        } as never);
      }
    }
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
