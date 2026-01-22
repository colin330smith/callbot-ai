import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { TIER_LIMITS, type SubscriptionTier, type Database } from '@/lib/database.types';

type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];

// GET - List team members
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const sub = subscription as { tier: SubscriptionTier } | null;
    if (!sub || !['team', 'business'].includes(sub.tier)) {
      return NextResponse.json({
        error: 'Team features require Team or Business subscription',
        requiresUpgrade: true,
      }, { status: 403 });
    }

    // Get team members where user is owner
    const { data: ownedTeam, error: ownedError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) {
      console.error('Error fetching team:', ownedError);
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }

    // Check if user is a member of another team
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_owner_id')
      .eq('member_user_id', user.id)
      .single();

    const tierLimits = TIER_LIMITS[sub.tier];

    return NextResponse.json({
      members: ownedTeam || [],
      memberLimit: tierLimits.teamMembers,
      isTeamOwner: (ownedTeam?.length || 0) > 0 || !membership,
      teamOwnerId: (membership as { team_owner_id: string } | null)?.team_owner_id || user.id,
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Invite team member
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role = 'member' } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const sub2 = subscription as { tier: SubscriptionTier } | null;
    if (!sub2 || !['team', 'business'].includes(sub2.tier)) {
      return NextResponse.json({
        error: 'Team features require Team or Business subscription',
        requiresUpgrade: true,
      }, { status: 403 });
    }

    const tierLimits = TIER_LIMITS[sub2.tier];

    // Check current team size
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_owner_id', user.id);

    if ((count || 0) >= tierLimits.teamMembers) {
      return NextResponse.json({
        error: `Team member limit reached (${tierLimits.teamMembers} members). Upgrade to add more.`,
        limitReached: true,
      }, { status: 403 });
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_owner_id', user.id)
      .eq('member_email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This email has already been invited' }, { status: 400 });
    }

    // Check if the email belongs to an existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    // Create team member invitation
    const memberData: TeamMemberInsert = {
      team_owner_id: user.id,
      member_email: email.toLowerCase(),
      member_user_id: (existingUser as { id: string } | null)?.id || null,
      role,
      invited_at: new Date().toISOString(),
      accepted_at: existingUser ? new Date().toISOString() : null, // Auto-accept if existing user
    };
    const { data: member, error } = await supabase
      .from('team_members')
      .insert(memberData as never)
      .select()
      .single();

    if (error) {
      console.error('Error inviting team member:', error);
      return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 });
    }

    // TODO: Send invitation email

    return NextResponse.json({
      success: true,
      member,
      message: existingUser
        ? 'Team member added successfully'
        : 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
