import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, trailheadId, passphrase, type } = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('Missing Resend API Key')
    }

    let subject = ''
    let htmlContent = ''

    if (type === 'new_account') {
      subject = 'Welcome to Trailhead - Your Account Credentials'
      htmlContent = `
        <h2>Welcome to the Trailhead System</h2>
        <p>Your administrator has created an account for you.</p>
        <p><strong>Trailhead ID:</strong> ${trailheadId}</p>
        <p><strong>Passphrase:</strong> ${passphrase}</p>
        <p>Please log in here: <a href="https://trailhead.stupidroosterstudios.com/login">Trailhead Portal</a></p>
      `
    } else if (type === 'recovery') {
      subject = 'Trailhead - Passphrase Recovery'
      htmlContent = `
        <h2>Passphrase Recovery Request</h2>
        <p>You requested a temporary recovery passphrase.</p>
        <p><strong>Trailhead ID:</strong> ${trailheadId}</p>
        <p><strong>Temporary Passphrase:</strong> ${passphrase}</p>
        <p>Please enter this on the recovery screen to reset your password.</p>
      `
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Trailhead Admin <admin@stupidroosterstudios.com>', // Make sure this matches your verified domain
        to: [email],
        subject: subject,
        html: htmlContent
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email via Resend')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})