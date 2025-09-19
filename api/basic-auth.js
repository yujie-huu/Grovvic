// /api/basic-auth.js
export default function handler(req, res) {
    const { path = "" } = req.query;
    const auth = req.headers.authorization;

    const challenge = () => {
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        return res.status(401).send('Authentication required');
    };

    if (!auth) return challenge();

    const [scheme, credentials] = auth.split(' ');
    if (scheme !== 'Basic' || !credentials) return challenge();

    const [username, password] = Buffer.from(credentials, 'base64')
        .toString()
        .split(':');

    if (
        username === process.env.BASIC_AUTH_USERNAME &&
        password === process.env.BASIC_AUTH_PASSWORD
    ) {
        // success: set a short-lived cookie and redirect to the original path
        res.setHeader('Set-Cookie', [
        // HttpOnly+Secure so JS can’t read it; Lax is fine for same-site nav
        'auth=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600'
        ]);
        const target = `/${String(path).replace(/^\/+/, '')}`;
        return res.redirect(302, target || '/');
    }

    return challenge();
}
  