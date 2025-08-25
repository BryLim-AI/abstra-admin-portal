import jwt from "jsonwebtoken";

const SECRET = process.env.INVITE_SECRET || "default_secret"; // store this in .env

export const generateInviteCode = (unitId: string, propertyName: string) => {
    const payload = { unitId, propertyName };

    // Short-lived invite (1 day)
    return jwt.sign(payload, SECRET, { expiresIn: "1d" });
};

export const verifyInviteCode = (token: string) => {
    try {
        return jwt.verify(token, SECRET) as { unitId: string; propertyName: string };
    } catch (error) {
        return null;
    }
};
