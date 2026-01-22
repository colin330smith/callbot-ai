import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{ memberId: string }>;
}

// PATCH - Update team member role
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { memberId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Verify user owns this team member
    const { data: member } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_owner_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Update role
    const { error } = await supabase
      .from('team_members')
      .update({ role } as never)
      .eq('id', memberId);

    if (error) {
      console.error('Error updating team member:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove team member
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { memberId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this team member
    const { data: member } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_owner_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Delete team member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing team member:', error);
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
