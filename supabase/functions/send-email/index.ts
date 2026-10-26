const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is missing');
      return new Response(JSON.stringify({ error: 'Email service is not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const body = await req.json().catch(() => null);
    if (
      !body ||
      typeof body.to !== 'string' ||
      typeof body.subject !== 'string' ||
      typeof body.html !== 'string' ||
      !body.to.trim() ||
      !body.subject.trim() ||
      !body.html.trim()
    ) {
      return new Response(JSON.stringify({ error: 'Request must include to, subject, and html' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { to, subject, html } = body;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Trailhead Admin <onboarding@resend.dev>', // Change this once you verify your custom domain
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('Resend API rejected email request:', res.status, data);
      return new Response(JSON.stringify({ error: data?.message || 'Failed to send email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected email service error';
    console.error('Email function failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 502,
    });
  }
});