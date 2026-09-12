import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error(
        "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables"
    );
}

export const hashPassword = async (
    password: string
): Promise<string> => {
    return bcrypt.hash(password, 12);
};

export const comparePassword = async (
    password: string,
    passwordHash: string
): Promise<boolean> => {
    return bcrypt.compare(password, passwordHash);
};

export const generateAccessToken = (
    userId: string,
    role: string
): string => {
    return jwt.sign(
        {
            userId,
            role,
        },
        JWT_ACCESS_SECRET,
        {
            expiresIn: "15m",
        }
    );
};

export const generateRefreshToken = (
    userId: string
): string => {
    return jwt.sign(
        {
            userId,
        },
        JWT_REFRESH_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

export const verifyAccessToken = (
    token: string
) => {
    return jwt.verify(
        token,
        JWT_ACCESS_SECRET
    ) as {
        userId: string;
        role: string;
    };
};

export const verifyRefreshToken = (
    token: string
) => {
    return jwt.verify(
        token,
        JWT_REFRESH_SECRET
    ) as {
        userId: string;
    };
};