import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables on server");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
const superAdminEmail = (
    process.env.XGOO_SUPER_ADMIN_EMAIL || "xgoo.express@gmail.com"
).toLowerCase();

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "A valid Bearer authorization header is required" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
        return res.status(401).json({ message: "Authorization token is missing" });
    }
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const member = await storage.getOfficeMemberByUserId(user.id);
        if (member?.status === "active") {
            (req as any).staffMember = member;
            (req as any).staffRole = member.role;
        } else {
            const email = user.email?.trim().toLowerCase();
            const ownerOffice =
                email === superAdminEmail
                    ? await storage.getOfficeByUserId(user.id)
                    : undefined;
            if (!ownerOffice || ownerOffice.userId !== user.id) {
                return res.status(403).json({
                    message: "This account is not an active XGoo staff member. Ask the Super Admin for access.",
                });
            }
            // Legacy bootstrap path: email locates the expected account, while
            // the immutable Supabase UUID must also own the canonical office.
            (req as any).staffRole = "super_admin";
        }

        // Attach user to request
        (req as any).user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Authentication failed" });
    }
}
