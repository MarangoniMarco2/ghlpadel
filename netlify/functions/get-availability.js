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
    // Estrai parametri dalla query string
    const { calendarId, startDate, endDate } = event.queryStringParameters || {};

    if (!calendarId || !startDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Parametri mancanti: calendarId e startDate sono obbligatori' 
        })
      };
    }

    // Configurazione
    const GHL_TOKEN = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6InFNTXk0T0twQTZvUWRreVB4YmhHIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU3MTYxNjcwNTU0LCJzdWIiOiJ2bmduNnI5TEFnZ2pvZW80ZUlyYyJ9.UzucE7hf6B5eJN9PIN9Ud8YY38b4WFe6z9t3swMCpq8;
    const LOCATION_ID = process.env.qMMy4OKpA6oQdkyPxbhG;

    if (!GHL_TOKEN || !LOCATION_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configurazione mancante: GHL_TOKEN o GHL_LOCATION_ID' 
        })
      };
    }

    // Usa endDate se fornito, altrimenti usa startDate
    const finalEndDate = endDate || startDate;

    // Chiamata API a GHL per gli slot liberi
    const response = await fetch(`https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${finalEndDate}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Version': '2021-04-15',
        'Authorization': `Bearer ${GHL_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Errore get-availability:', error);
    
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
