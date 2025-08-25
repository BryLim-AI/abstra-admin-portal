import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, SECRET_KEY);

            return res.status(200).json({ user: decoded });
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
}
