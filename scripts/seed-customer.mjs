const SUPABASE_URL = 'https://rawrlzajbcnwitlzzbxu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd3JsemFqYmNud2l0bHp6Ynh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDY5MzksImV4cCI6MjEwMTQ4MjkzOX0.3Csvv88TTYM1uRyYz3pj76ojxmp39_Fc1mztPm3ucHE'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=representation',
}

async function seedCustomer() {
  console.log('Seeding Gujarati customer (Jignesh Shah) with 3 Ahmedabad addresses...')

  const customerId = 'c0a80101-0000-4000-8000-000000000001'

  // 1. Profile Payload
  const profilePayload = [
    {
      id: customerId,
      full_name: 'Jignesh Shah',
      email: 'jignesh.shah@example.com',
      phone: '+91 98250 12345',
      role: 'customer',
      is_active: true,
      is_subscription_eligible: true,
      total_orders: 12,
      total_spent: 2850,
      marketing_opt_in: true,
    },
  ]

  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(profilePayload),
  })

  if (!profRes.ok) {
    console.error('Failed to create profile:', await profRes.text())
    return
  }
  const profData = await profRes.json()
  console.log('✅ Created Customer Profile:', profData[0]?.full_name, `(${profData[0]?.id})`)

  // 2. Addresses Payload (Ahmedabad)
  const addressesPayload = [
    {
      id: 'a0a80101-0000-4000-8000-000000000001',
      user_id: customerId,
      label: 'home',
      contact_name: 'Jignesh Shah',
      contact_phone: '+91 98250 12345',
      address_line1: 'A-302, Shivalik Residency, Opp. H.L. Commerce College',
      address_line2: 'Navrangpura',
      landmark: 'Near Commerce Six Roads',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      is_default: true,
    },
    {
      id: 'a0a80101-0000-4000-8000-000000000002',
      user_id: customerId,
      label: 'work',
      contact_name: 'Jignesh Shah',
      contact_phone: '+91 98250 12345',
      address_line1: '704, Mondeal Heights, Next to Novotel Hotel',
      address_line2: 'S.G. Highway, Prahlad Nagar',
      landmark: 'Near Iscon Cross Roads',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      is_default: false,
    },
    {
      id: 'a0a80101-0000-4000-8000-000000000003',
      user_id: customerId,
      label: 'other',
      contact_name: 'Jignesh Shah (Family)',
      contact_phone: '+91 98250 67890',
      address_line1: '12, Devansh Bungalows, Behind Vastrapur Lake',
      address_line2: 'Vastrapur',
      landmark: 'Opposite IIM Ahmedabad New Campus',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380054',
      is_default: false,
    },
  ]

  const addrRes = await fetch(`${SUPABASE_URL}/rest/v1/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(addressesPayload),
  })

  if (!addrRes.ok) {
    console.error('Failed to create addresses:', await addrRes.text())
    return
  }

  const addrData = await addrRes.json()
  console.log(`✅ Successfully inserted ${addrData.length} Ahmedabad addresses for Jignesh Shah!`)
  addrData.forEach((a) => {
    console.log(`   - [${a.label.toUpperCase()}] ${a.address_line1}, ${a.address_line2}, ${a.city} - ${a.pincode}`)
  })
}

seedCustomer()
