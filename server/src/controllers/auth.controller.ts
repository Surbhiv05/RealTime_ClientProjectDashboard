import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    verifyRefreshToken,
} from "../utils/auth";

const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (
    req: Request,
    res: Response
) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and role are required",
            });
        }

        const existingUser =
            await prisma.user.findUnique({
                where: { email },
            });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "User with this email already exists",
            });
        }

        const passwordHash =
            await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
            },
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        const user =
            await prisma.user.findUnique({
                where: { email },
            });

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const passwordMatch =
            await comparePassword(
                password,
                user.passwordHash
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const accessToken =
            generateAccessToken(
                user.id,
                user.role
            );

        const refreshToken =
            generateRefreshToken(user.id);

        const hashedRefreshToken =
            await hashPassword(refreshToken);

        await prisma.refreshToken.create({
            data: {
                tokenHash:
                    hashedRefreshToken,
                userId: user.id,
                expiresAt: new Date(
                    Date.now() +
                    7 *
                    24 *
                    60 *
                    60 *
                    1000
                ),
            },
        });

        res.cookie(
            "refreshToken",
            refreshToken,
            refreshCookieOptions
        );

        return res.json({
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const refreshAccessToken = async (
    req: Request,
    res: Response
) => {
    try {
        const refreshToken =
            req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message:
                    "Refresh token not found",
            });
        }

        const decoded =
            verifyRefreshToken(refreshToken);

        const user =
            await prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                },
                include: {
                    refreshTokens: {
                        where: {
                            revokedAt: null,
                            expiresAt: {
                                gt: new Date(),
                            },
                        },
                    },
                },
            });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        let matchingToken:
            | {
                id: string;
                tokenHash: string;
            }
            | undefined;

        for (const storedToken of user.refreshTokens) {
            const isMatch =
                await comparePassword(
                    refreshToken,
                    storedToken.tokenHash
                );

            if (isMatch) {
                matchingToken = storedToken;
                break;
            }
        }

        if (!matchingToken) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid or revoked refresh token",
            });
        }

        await prisma.refreshToken.update({
            where: {
                id: matchingToken.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        const newAccessToken =
            generateAccessToken(
                user.id,
                user.role
            );

        const newRefreshToken =
            generateRefreshToken(user.id);

        const newHashedRefreshToken =
            await hashPassword(
                newRefreshToken
            );

        await prisma.refreshToken.create({
            data: {
                tokenHash:
                    newHashedRefreshToken,
                userId: user.id,
                expiresAt: new Date(
                    Date.now() +
                    7 *
                    24 *
                    60 *
                    60 *
                    1000
                ),
            },
        });

        res.cookie(
            "refreshToken",
            newRefreshToken,
            refreshCookieOptions
        );

        return res.json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired refresh token",
        });
    }
};

export const logout = async (
    req: Request,
    res: Response
) => {
    try {
        const refreshToken =
            req.cookies.refreshToken;

        if (refreshToken) {
            try {
                const decoded =
                    verifyRefreshToken(
                        refreshToken
                    );

                const userTokens =
                    await prisma.refreshToken.findMany(
                        {
                            where: {
                                userId:
                                    decoded.userId,
                                revokedAt: null,
                            },
                        }
                    );

                for (const storedToken of userTokens) {
                    const isMatch =
                        await comparePassword(
                            refreshToken,
                            storedToken.tokenHash
                        );

                    if (isMatch) {
                        await prisma.refreshToken.update(
                            {
                                where: {
                                    id: storedToken.id,
                                },
                                data: {
                                    revokedAt:
                                        new Date(),
                                },
                            }
                        );

                        break;
                    }
                }
            } catch {
                // Invalid refresh token is ignored during logout.
            }
        }

        res.clearCookie(
            "refreshToken",
            refreshCookieOptions
        );

        return res.json({
            success: true,
            message:
                "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
        });
    }
};