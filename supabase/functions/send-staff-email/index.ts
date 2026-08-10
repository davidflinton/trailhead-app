import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      console.error("Failed to parse request body as JSON")
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { email, trailheadId, passphrase, type } = body
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is missing!")
      return new Response(JSON.stringify({ error: 'Missing Resend API Key in Supabase secrets' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let subject = ''
    let htmlContent = ''

    if (type === 'new_account') {
      subject = 'Welcome to CampNexus - Your Account Credentials'
      htmlContent = `
        <h2>Welcome to the CampNexus System</h2>
        <p>Your administrator has created an account for you.</p>
        <p><strong>CampNexus ID:</strong> ${trailheadId}</p>
        <p><strong>Passphrase:</strong> ${passphrase}</p>
        <p>Please log in here: <a href="https://campnexus.stupidroosterstudios.com/login">CampNexus Portal</a></p>
      `
    } else if (type === 'recovery') {
      subject = 'CampNexus - Passphrase Recovery'
      htmlContent = `
        <h2>Passphrase Recovery Request</h2>
        <p>You requested a temporary recovery passphrase.</p>
        <p><strong>CampNexus ID:</strong> ${trailheadId}</p>
        <p><strong>Temporary Passphrase:</strong> ${passphrase}</p>
        <p>Please enter this on the recovery screen to reset your password.</p>
      `
    } else {
      subject = 'CampNexus Notification'
      htmlContent = `<p>System notification for ID: ${trailheadId}</p>`
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'CampNexus Admin <admin@stupidroosterstudios.com>',
        to: [email],
        subject: subject,
        html: htmlContent
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API rejection:", JSON.stringify(data))
      return new Response(JSON.stringify({ error: data.message || 'Failed to send email via Resend' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Unhandled Edge Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})