"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Check, ChevronDown, CheckCircle, Crown, Settings } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  // Pro plan price: R$ 49/month (hardcoded, update if Stripe plan changes)
  // Studio plan price: R$ 149/month (hardcoded, update if Stripe plan changes)
  monthlyPrice: number;
  description: string;
  features: string[];
  badge?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    description: "Pra testar com calma.",
    features: [
      "5 carrosséis por mês",
      "20 gerações de IA",
      "Modo Notícia",
      "Sem marca d'água",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49,
    description: "Pra quem posta toda semana.",
    features: [
      "Carrosséis ilimitados",
      "300 gerações de IA",
      "Modo Notícia + Contexto",
      "Calendário",
      "Template library",
      "Suporte prioritário",
    ],
    badge: "MAIS POPULAR",
  },
  {
    id: "studio",
    name: "Studio",
    monthlyPrice: 149,
    description: "Equipe e agências.",
    features: [
      "Tudo do Pro",
      "Gerações ilimitadas",
      "5 usuários",
      "API custom",
      "Webhooks",
      "Suporte dedicado",
    ],
  },
];

const FAQ_ITEMS: FAQ[] = [
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim. Acesso continua até o fim do ciclo já pago.",
  },
  {
    question: "Imagens IA não usadas acumulam?",
    answer: "Não. Reset todo mês.",
  },
  {
    question: "Tem reembolso?",
    answer: "7 dias após a primeira cobrança.",
  },
];

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");

  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    const isSuccess = searchParams.get("status") === "success";
    let attempts = 0;
    const maxAttempts = isSuccess ? 10 : 1;
    const delay = 2000;

    async function fetchPlan() {
      try {
        const r = await fetch("/api/user/profile", { cache: "no-store" });
        const d = await r.json();
        const plan = d.plan || "free";
        const expiry = d.planExpiresAt || null;

        // If came from success and plan still free, retry
        if (isSuccess && plan === "free" && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchPlan, delay);
          return;
        }

        setUserPlan(plan);
        setPlanExpiresAt(expiry);
      } catch { /**/ } finally {
        if (!isSuccess || attempts >= maxAttempts) setLoadingPlan(false);
        else setLoadingPlan(false);
      }
    }

    fetchPlan();
  }, [searchParams]);

  async function handleCheckout(planType: "pro" | "studio") {
    setCheckingOut(planType);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao criar checkout."); return; }
      if (!data.checkoutUrl) { alert("Erro ao processar pagamento. Tente novamente."); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingOut(null);
    }
  }

  async function handleManageSubscription() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/checkout/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao abrir portal."); return; }
      window.location.href = data.portalUrl;
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setOpeningPortal(false);
    }
  }

  const getPrice = (monthlyPrice: number) =>
    isYearly ? Math.round((monthlyPrice * 12 * 0.8) / 12) : monthlyPrice;

  const isPaidPlan = userPlan === "pro" || userPlan === "studio";
  const expiryDate = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="bg-bg-base min-h-screen">

      {/* Success Banner */}
      {paymentStatus === "success" && (
        <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-4">
          <div className="max-w-[1040px] mx-auto flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            <div>
              {userPlan !== "free" ? (
                <>
                  <p className="text-body font-semibold text-green-400">
                    Pagamento confirmado! Bem-vindo ao plano {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}.
                  </p>
                  <p className="text-caption text-green-400/70">
                    Sua assinatura já está ativa. Aproveite todos os recursos!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-body font-semibold text-green-400">
                    Pagamento confirmado! Ativando sua assinatura…
                  </p>
                  <p className="text-caption text-green-400/70">
                    Aguarde alguns segundos enquanto processamos seu plano.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {paymentStatus === "cancelled" && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-4">
          <div className="max-w-[1040px] mx-auto">
            <p className="text-body text-yellow-400">
              Pagamento cancelado. Nenhuma cobrança foi realizada.
            </p>
          </div>
        </div>
      )}

      {/* Active Plan Banner */}
      {!loadingPlan && isPaidPlan && (
        <div className="bg-accent/10 border-b border-accent/30 px-4 py-4">
          <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-accent flex-shrink-0" />
              <div>
                <p className="text-body font-semibold text-text-primary">
                  Plano {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} ativo
                </p>
                {expiryDate && (
                  <p className="text-caption text-text-secondary">
                    Renova em {expiryDate}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManageSubscription}
              disabled={openingPortal}
            >
              <Settings size={14} className="mr-2" />
              {openingPortal ? "Abrindo..." : "Gerenciar assinatura"}
            </Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="pt-12 pb-16 px-4">
        <div className="max-w-[1040px] mx-auto text-center">
          <div className="text-micro text-text-secondary uppercase tracking-wider mb-4">
            PLANOS CARROSSEL AI
          </div>
          <h1 className="text-display text-text-primary mb-4">
            Pague pelo que usa. Cresça quando precisar.
          </h1>
          <p className="text-body text-text-secondary mb-8">
            Sem letra miúda. Cancele a qualquer hora.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Chip active={!isYearly} onClick={() => setIsYearly(false)}>Mensal</Chip>
            <Chip active={isYearly} onClick={() => setIsYearly(true)}>
              Anual<span className="ml-1 text-accent font-semibold">-20%</span>
            </Chip>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="px-4 pb-24">
        <div className="max-w-[1040px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const price = getPrice(plan.monthlyPrice);
              const isPro = plan.id === "pro";
              const isCurrent = !loadingPlan && userPlan === plan.id;

              return (
                <div key={plan.id} className={isPro ? "md:scale-105" : ""}>
                  <Card
                    className={`relative p-8 flex flex-col h-full ${
                      isCurrent
                        ? "border-2 border-green-500 bg-bg-surface"
                        : isPro
                        ? "border-2 border-accent bg-bg-surface"
                        : "border border-border-subtle"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-green-500/20 border border-green-500 rounded-full px-3 py-1">
                          <span className="text-caption font-semibold text-green-400">
                            SEU PLANO
                          </span>
                        </div>
                      </div>
                    )}
                    {!isCurrent && plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-accent-muted border border-accent rounded-full px-3 py-1">
                          <span className="text-caption font-semibold text-accent">
                            {plan.badge}
                          </span>
                        </div>
                      </div>
                    )}

                    <h2 className="text-h2 text-text-primary mb-2">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-display text-text-primary">R${price}</span>
                      <span className="text-body text-text-secondary">/mês</span>
                    </div>
                    <p className="text-body text-text-secondary mb-6">{plan.description}</p>
                    <div className="h-px bg-border-subtle mb-6" />
                    <div className="flex-1 flex flex-col gap-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check size={16} className="text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-body text-text-primary">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {isCurrent && isPaidPlan ? (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={handleManageSubscription}
                        disabled={openingPortal}
                      >
                        <Settings size={14} className="mr-2" />
                        {openingPortal ? "Abrindo..." : "Gerenciar"}
                      </Button>
                    ) : (
                      <Button
                        variant={isCurrent ? "secondary" : "primary"}
                        size="lg"
                        className="w-full"
                        disabled={isCurrent || checkingOut !== null}
                        onClick={() => {
                          if (!isCurrent && (plan.id === "pro" || plan.id === "studio")) {
                            handleCheckout(plan.id as "pro" | "studio");
                          }
                        }}
                      >
                        {checkingOut === plan.id
                          ? "Redirecionando..."
                          : isCurrent
                          ? "Plano atual"
                          : `Assinar ${plan.name}`}
                      </Button>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pb-16">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-h2 text-text-primary text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border border-border-subtle rounded-lg overflow-hidden bg-bg-surface">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-surface-2 transition-colors duration-fast text-left"
                >
                  <span className="text-body font-semibold text-text-primary">{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-text-secondary flex-shrink-0 transition-transform duration-fast ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 py-4 bg-bg-surface-2 border-t border-border-subtle">
                    <p className="text-body text-text-secondary">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  );
}
