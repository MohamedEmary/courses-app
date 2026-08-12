import { UserRole } from "@/utils/constants.ts";

declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedQuery?: any;
      validatedParams?: any;
      userRole?: UserRole;
      userId?: string;
    }
  }
}
