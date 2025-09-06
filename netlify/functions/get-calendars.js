// netlify/functions/get-calendars.js - VERSIONE API v2 CON LOCATION ID
exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestisci preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Environment variables
    const PRIVATE_INTEGRATION_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;
    const LOCATION_ID = process.env.GHL_LOCATION_ID;

    console.log('API v2 check:');
    console.log('- PRIVATE_INTEGRATION_TOKEN exists:', !!PRIVATE_INTEGRATION_TOKEN);
    console.log('- LOCATION_ID exists:', !!LOCATION_ID);
    console.log('- Token length:', PRIVATE_INTEGRATION_TOKEN ? PRIVATE_INTEGRATION_TOKEN.length : 0);
    console.log('- Location ID:', LOCATION_ID);

    if (!PRIVATE_INTEGRATION_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'PRIVATE_INTEGRATION_TOKEN mancante',
          details: 'Configura PRIVATE_INTEGRATION_TOKEN nelle environment variables',
          instructions: 'In GHL: Settings > Private Integrations > Create Integration > Copy Token'
        })
      };
    }

    if (!LOCATION_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'GHL_LOCATION_ID mancante',
          details: 'Configura GHL_LOCATION_ID nelle environment variables',
          instructions: 'Location ID si trova nell\'URL del tuo dashboard GHL'
        })
      };
    }

    // API v2 endpoint con locationId come query parameter
    const apiUrl = `https://services.leadconnectorhq.com/calendars/?locationId=${LOCATION_ID}`;
    
    console.log('Chiamata API v2 a:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_INTEGRATION_TOKEN}`,
        'Version': '2021-07-28' // Versione API v2
      }
    });

    console.log('Risposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Errore body:', errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `API v2 Error: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: apiUrl,
          suggestion: response.status === 403 ? 'Verifica che il Location ID sia corretto e che il token abbia i permessi calendars.readonly' : 'Controlla il Private Integration Token'
        })
      };
    }

    const data = await response.json();
    console.log('Successo! Calendari trovati:', data.calendars?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        calendars: data.calendars || [],
        _debug: {
          apiType: 'API v2 - Private Integration',
          endpoint: apiUrl,
          calendarCount: data.calendars?.length || 0,
          version: '2021-07-28',
          locationId: LOCATION_ID
        }
      })
    };

  } catch (error) {
    console.error('Errore generale get-calendars:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Errore interno del server',
        details: error.message
      })
    };
  }
};
