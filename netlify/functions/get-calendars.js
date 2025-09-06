// netlify/functions/get-calendars.js - VERSIONE API v2 CORRETTA
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
    // Per API v2 usi Private Integration Token (non più API Key)
    const PRIVATE_INTEGRATION_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;

    console.log('API v2 check:');
    console.log('- PRIVATE_INTEGRATION_TOKEN exists:', !!PRIVATE_INTEGRATION_TOKEN);
    console.log('- Token length:', PRIVATE_INTEGRATION_TOKEN ? PRIVATE_INTEGRATION_TOKEN.length : 0);

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

    // API v2 endpoint corretto
    const apiUrl = `https://services.leadconnectorhq.com/calendars/`;
    
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
          suggestion: response.status === 401 ? 'Controlla il Private Integration Token' : 'Verifica permessi scopes'
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
          version: '2021-07-28'
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
