const HUBSPOT_API_URL = 'https://api.hubapi.com';

// Fetch HubSpot contact properties
export async function fetchContactProperties(accessToken) {
  const response = await fetch(
    `${HUBSPOT_API_URL}/crm/v3/properties/contacts`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot API error: ${error}`);
  }

  const data = await response.json();
  
  return data.results.map(prop => ({
    name: prop.name,
    label: prop.label,
    type: prop.type,
  }));
}

// Sync emails to HubSpot (batch upsert, max 100 per request)
export async function syncEmailsToHubSpot(accessToken, emails) {
  const BATCH_SIZE = 100;
  const results = {
    synced: 0,
    skipped: 0,
    errors: []
  };

  // Process in batches
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    const inputs = batch.map(email => ({
      id: email,
      properties: {
        email: email
      }
    }));

    try {
      const response = await fetch(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/batch/upsert`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idProperty: 'email',
            inputs: inputs
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        results.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error}`);
        results.skipped += batch.length;
        continue;
      }

      const data = await response.json();
      results.synced += data.results?.length || 0;
      
      // Count skipped (duplicates, etc.)
      if (data.results) {
        results.skipped += batch.length - data.results.length;
      }
    } catch (error) {
      results.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      results.skipped += batch.length;
    }
  }

  return results;
}
