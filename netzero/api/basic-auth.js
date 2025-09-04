// netzero/api/basic-auth.js
export default function handler(req, res) {
  const auth = req.headers.authorization;
  
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required');
  }

  const [scheme, credentials] = auth.split(' ');
  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

  if (username === process.env.BASIC_AUTH_USERNAME && 
      password === process.env.BASIC_AUTH_PASSWORD) {
    // authentication successful, continue to the next handler
    return res.status(200).send('OK');
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
  return res.status(401).send('Invalid credentials');
}
