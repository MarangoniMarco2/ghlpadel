// netlify/functions/get-calendars.js - VERSIONE LOCATION API
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
    // Per Location API usi solo il LOCATION API KEY
    const LOCATION_API_KEY = process.env.LOCATION_API_KEY;
    const LOCATION_ID = process.env.GHL_LOCATION_ID;

    console.log('Location API check:');
    console.log('- LOCATION_API_KEY exists:', !!LOCATION_API_KEY);
    console.log('- LOCATION_API_KEY length:', LOCATION_API_KEY ? LOCATION_API_KEY.length : 0);
    console.log('- LOCATION_ID:', LOCATION_ID);

    if (!LOCATION_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'LOCATION_API_KEY mancante',
          details: 'Configura LOCATION_API_KEY nelle environment variables'
        })
      };
    }

    // Endpoint per Location API (diverso!)
    const apiUrl = `https://rest.gohighlevel.com/v1/calendars/`;
    
    console.log('Chiamata a:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCATION_API_KEY}`
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
          error: `Location API Error: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: apiUrl
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
          apiType: 'Location API',
          endpoint: apiUrl,
          calendarCount: data.calendars?.length || 0
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
