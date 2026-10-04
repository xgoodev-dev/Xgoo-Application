import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET || "xgoo-session-secret-key-32chars-minimum-fallback";
export const superAdminEmail = (
  process.env.XGOO_SUPER_ADMIN_EMAIL || "xgoo.express@gmail.com"
).toLowerCase();

export interface StaffTokenPayload {
  id: string;
  email: string;
  name?: string;
}

export function generateStaffToken(payload: StaffTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyStaffToken(token: string): StaffTokenPayload {
  return jwt.verify(token, JWT_SECRET) as StaffTokenPayload;
}

// Backward-compatibility shim for any legacy references to supabaseAdmin
export const supabaseAdmin = {
  auth: {
    getUser: async (token: string) => {
      try {
        const payload = verifyStaffToken(token);
        return { data: { user: { id: payload.id, email: payload.email, user_metadata: { full_name: payload.name } } }, error: null };
      } catch (e: any) {
        return { data: { user: null }, error: e };
      }
    },
    admin: {
      listUsers: async () => ({ data: { users: [] }, error: null }),
      inviteUserByEmail: async (email: string, options?: any) => {
        const normalized = email.trim().toLowerCase();
        let user = await storage.getUserByEmail(normalized);
        if (!user) {
          user = await storage.createUser({
            email: normalized,
            firstName: options?.data?.displayName || normalized.split("@")[0],
          });
        }
        return { data: { user }, error: null };
      },
    },
  },
};

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
    let payload: StaffTokenPayload;
    try {
      payload = verifyStaffToken(token);
    } catch {
      return res.status(401).json({ message: "Invalid or expired session token" });
    }

    const email = (payload.email || "").trim().toLowerCase();
    const userId = payload.id;

    const member = await storage.getOfficeMemberByUserId(userId);
    if (member?.status === "active") {
      (req as any).staffMember = member;
      (req as any).staffRole = member.role;
    } else {
      const isSuperAdmin = email === superAdminEmail;
      let ownerOffice = await storage.getOfficeByUserId(userId);
      
      // If super admin logs in for the first time, check if ownerOffice exists or link it
      if (isSuperAdmin && !ownerOffice) {
        // Check if there is an office created for this email or default office
        const memberByEmail = await storage.getUserByEmail(email);
        if (memberByEmail) {
          ownerOffice = await storage.getOfficeByUserId(memberByEmail.id);
        }
      }

      if (!ownerOffice && !isSuperAdmin) {
        return res.status(403).json({
          message: "This account is not an active XGoo staff member. Ask the Super Admin for access.",
        });
      }
      (req as any).staffRole = "super_admin";
    }

    (req as any).user = {
      id: userId,
      email: email,
      user_metadata: {
        full_name: payload.name || email.split("@")[0],
      },
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Authentication failed" });
  }
}
