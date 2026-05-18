import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: "TRIAL_EXPIRED" | "LIMIT_REACHED" | "NO_PLAN" };

export async function checkCarouselLimit(userId: string): Promise<LimitResult> {
  await connectDB();
  const user = await User.findById(userId).select(
    "plan planExpiresAt trialEndsAt carouselsThisMonth usageResetAt"
  );
  if (!user) return { allowed: false, reason: "NO_PLAN" };

  const now = new Date();
  const isInTrial = !!(user.trialEndsAt && new Date(user.trialEndsAt) > now);
  const isPro = user.plan === "pro" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);
  const isStudio = user.plan === "studio" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);

  // No valid access
  if (!isInTrial && !isPro && !isStudio) {
    return { allowed: false, reason: "TRIAL_EXPIRED" };
  }

  // Studio and trial: unlimited
  if (isStudio || isInTrial) return { allowed: true };

  // Pro: check monthly limit (100)
  if (isPro) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resetAt = user.usageResetAt ? new Date(user.usageResetAt) : new Date(0);

    // Lazy reset if usageResetAt is in a previous month
    if (resetAt < monthStart) {
      await User.findByIdAndUpdate(userId, {
        carouselsThisMonth: 0,
        usageResetAt: now,
      });
      return { allowed: true };
    }

    if ((user.carouselsThisMonth ?? 0) >= 100) {
      return { allowed: false, reason: "LIMIT_REACHED" };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "NO_PLAN" };
}

export async function incrementCarouselCount(userId: string): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $inc: { carouselsThisMonth: 1 } });
}

export function limitErrorResponse(reason: string): { error: string; reason: string } {
  if (reason === "LIMIT_REACHED") {
    return {
      error: "Limite de 100 carrosséis mensais atingido. Faça upgrade para o plano Studio.",
      reason,
    };
  }
  return {
    error: "Seu período de acesso expirou. Assine um plano para continuar.",
    reason,
  };
}
