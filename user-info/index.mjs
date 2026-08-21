import jwt from "jsonwebtoken";
import {
    SecretsManagerClient,
    GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";

// Read environment variables.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || "my-issuer";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "my-api";
const SECRET_ID = process.env.SECRET_ID;

const secretsManager = new SecretsManagerClient({});

export const handler = async (event) => {
    try {
        // Get Authorization header
        const authHeader =
            event.headers?.authorization ||
            event.headers?.Authorization;

        if (!authHeader) {
            return response(401, {
                error: "Authorization header is missing"
            });
        }

        // Expected format:
        // Bearer eyJhbGciOiJIUzI1NiIs...
        if (!authHeader.startsWith("Bearer ")) {
            return response(401, {
                error: "Invalid Authorization header"
            });
        }

        const token = authHeader.substring("Bearer ".length);

        // Verify signature + expiration + issuer + audience
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });

        console.log("Authenticated user:", decoded);

        // Determine request path
        const path = event.rawPath || event.path || "/";

        // Protected secret route
        if (path === "/database") {
            const secretResponse = await secretsManager.send(
                new GetSecretValueCommand({
                    SecretId: SECRET_ID
                })
            );

            const secretValue = JSON.parse(secretResponse.SecretString);

            return response(200, {
                db_username: secretValue.db_username,
                db_password: secretValue.db_password
            });
        }

        // Existing protected route
        return response(200, {
            message: "Authentication successful",
            user: {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            }
        });

    } catch (error) {
        console.error("Request failed:", error);

        return response(401, {
            error: "Invalid or expired token"
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