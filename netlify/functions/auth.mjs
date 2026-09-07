/**
 * Decap GitHub OAuth (NetlifyAuthenticator protocol).
 * Popup: /.netlify/functions/auth?provider=github
 * GitHub redirects back to the same URL with ?code=
 */
const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';

function htmlPage(script) {
  return `<!doctype html>
<html>
  <body>
    <p>Complete GitHub login in this window…</p>
    <script>${script}</script>
  </body>
</html>`;
}

function successScript(token) {
  const payload = JSON.stringify({ token, provider: 'github' });
  return `
    (function () {
      function receiveMessage(event) {
        window.opener.postMessage(
          'authorization:github:success:' + ${JSON.stringify(payload)},
          event.origin
        );
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  `;
}

function errorScript(message) {
  const payload = JSON.stringify({ message });
  return `
    (function () {
      function receiveMessage(event) {
        window.opener.postMessage(
          'authorization:github:error:' + ${JSON.stringify(payload)},
          event.origin
        );
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  `;
}

export async function handler(event) {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.PUBLIC_GITHUB_APP_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const redirectUri = `${proto}://${host}/.netlify/functions/auth`;

  const params = event.queryStringParameters || {};

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage(
        errorScript('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET on Netlify'),
      ),
    };
  }

  if (params.code) {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: params.code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenBody = await tokenRes.json();
    if (!tokenBody.access_token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: htmlPage(
          errorScript(tokenBody.error_description || tokenBody.error || 'Token exchange failed'),
        ),
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage(successScript(tokenBody.access_token)),
    };
  }

  const provider = params.provider || 'github';
  if (provider !== 'github') {
    return { statusCode: 400, body: 'Unsupported provider' };
  }

  const scope = params.scope || 'repo';
  const authorize = new URL(AUTHORIZE_URL);
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', scope);

  return {
    statusCode: 302,
    headers: { Location: authorize.toString() },
  };
}
