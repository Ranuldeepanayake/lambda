import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || "my-lambda-auth";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "my-api";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

// Two hardcoded credential sets from Lambda environment variables
const USERS = [
    {
        username: process.env.USER1_USERNAME,
        password: process.env.USER1_PASSWORD,
        userId: process.env.USER1_ID,
        role: process.env.USER1_ROLE
    },
    {
        username: process.env.USER2_USERNAME,
        password: process.env.USER2_PASSWORD,
        userId: process.env.USER2_ID,
        role: process.env.USER2_ROLE
    }
];

export const handler = async (event) => {
    try {
        // Only allow POST
        if (event.requestContext?.http?.method !== "POST" &&
            event.httpMethod !== "POST") {
            return response(405, {
                error: "Method Not Allowed"
            });
        }

        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return response(500, {
                error: "Internal server error"
            });
        }

        // API Gateway may provide the body as a string
        let body;

        try {
            body = typeof event.body === "string"
                ? JSON.parse(event.body)
                : event.body;
        } catch {
            return response(400, {
                error: "Invalid JSON"
            });
        }

        const { username, password } = body ?? {};

        if (!username || !password) {
            return response(400, {
                error: "Username and password are required"
            });
        }

        // Find matching credentials
        const user = USERS.find(
            (candidate) =>
                candidate.username === username &&
                candidate.password === password
        );

        if (!user) {
            return response(401, {
                error: "Invalid credentials"
            });
        }

        /*
         * JWT payload
         *
         * Registered JWT claims:
         *   iss - issuer
         *   sub - subject
         *   aud - audience
         *   iat - issued-at (added automatically by jsonwebtoken)
         *   exp - expiration (added automatically by jsonwebtoken)
         *   jti - unique token ID
         *
         * Custom claims:
         *   userId
         *   role
         *   username
         */
        const payload = {
            sub: user.userId,
            jti: crypto.randomUUID(),

            // Custom claims
            userId: user.userId,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: JWT_EXPIRATION
        });

        return response(200, {
            token,
            tokenType: "Bearer",
            expiresIn: JWT_EXPIRATION
        });

    } catch (error) {
        console.error("Authentication error:", error);

        return response(500, {
            error: "Internal server error"
        });
    }
};


function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    };
}