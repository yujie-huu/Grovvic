export default function handler(req, res) {
  // chack if there is an authentication header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // authentication header, return 401 and require authentication
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // parse Basic Auth
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [username, password] = auth.split(':');

  // check if the username and password are correct
  const correctUsername = process.env.BASIC_AUTH_USERNAME;
  const correctPassword = process.env.BASIC_AUTH_PASSWORD;

  if (username === correctUsername && password === correctPassword) {
    // authentication successful, redirect to the actual page
    res.redirect(302, req.url);
  } else {
    // authentication failedentication failed
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
