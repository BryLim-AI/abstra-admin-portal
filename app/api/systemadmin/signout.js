
export default function adminSignout(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    try {
        res.setHeader(
            "Set-Cookie",
            "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
        );
        res.status(200).json({ message: "Successfully signed out." });
    } catch (error) {
        console.error("Error during signout:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}
