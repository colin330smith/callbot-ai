import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, phone, message, serviceType } = await req.json();

    if (!name || !email || !serviceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate service type
    const validServiceTypes = ['express_review', 'monthly_retainer', 'premium_retainer', 'enterprise'];
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Create service request
    const { error } = await supabase.from('service_requests').insert({
      user_id: user?.id || null,
      email,
      name,
      company: company || null,
      phone: phone || null,
      service_type: serviceType,
      message: message || null,
      status: 'pending',
    } as never);

    if (error) {
      console.error('Error creating service request:', error);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to user

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
