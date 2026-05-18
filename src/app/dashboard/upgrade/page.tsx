"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Check, ChevronDown } from "lucide-react";

/* Plan Interface */
interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  current: boolean;
  badge?: string;
}

/* FAQ Interface */
interface FAQ {
  question: string;
  answer: string;
}

/* Plans Data */
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
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    // Pro plan price: R$ 49/month (hardcoded, update if Stripe plan changes)
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
    current: false,
    badge: "MAIS POPULAR",
  },
  {
    id: "studio",
    name: "Studio",
    // Studio plan price: R$ 149/month (hardcoded, update if Stripe plan changes)
    monthlyPrice: 149,
    description: "Equipe e agências.",
    features: [
      "Tudo do Pro",
      "Gerações ilimitadas",
      "5 usuários",
      "API custom",
      "Webhooks",
      "Suporte dedicated",
    ],
    current: false,
  },
];

/* FAQ Data */
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

/* Main Component */
export default function UpgradePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function handleCheckout(planType: "pro" | "studio") {
    setCheckingOut(planType);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar checkout.");
        return;
      }
      if (!data.checkoutUrl) {
        alert("Erro ao processar pagamento. Tente novamente.");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingOut(null);
    }
  }

  const getPrice = (monthlyPrice: number) => {
    if (isYearly) {
      // Annual price with 20% discount
      return Math.round((monthlyPrice * 12 * 0.8) / 12);
    }
    return monthlyPrice;
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="bg-bg-base min-h-screen">
      {/* Hero Section */}
      <div className="pt-12 pb-16 px-4">
        <div className="max-w-[1040px] mx-auto text-center">
          {/* Eyebrow */}
          <div className="text-micro text-text-secondary uppercase tracking-wider mb-4">
            PLANOS NOVACRAFT
          </div>

          {/* Title */}
          <h1 className="text-display text-text-primary mb-4">
            Pague pelo que usa. Cresça quando precisar.
          </h1>

          {/* Subtitle */}
          <p className="text-body text-text-secondary mb-8">
            Sem letra miúda. Cancele a qualquer hora.
          </p>

          {/* Toggle Section */}
          <div className="flex items-center justify-center gap-4">
            <Chip active={!isYearly} onClick={() => setIsYearly(false)}>
              Mensal
            </Chip>
            <Chip active={isYearly} onClick={() => setIsYearly(true)}>
              Anual
              <span className="ml-1 text-accent font-semibold">-20%</span>
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

              return (
                <div
                  key={plan.id}
                  className={isPro ? "md:scale-105" : ""}
                >
                  <Card
                    className={`relative p-8 flex flex-col h-full ${
                      isPro
                        ? "border-2 border-accent bg-bg-surface"
                        : "border border-border-subtle"
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-accent-muted border border-accent rounded-full px-3 py-1">
                          <span className="text-caption font-semibold text-accent">
                            {plan.badge}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Plan Name */}
                    <h2 className="text-h2 text-text-primary mb-2">
                      {plan.name}
                    </h2>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-display text-text-primary">
                        R${price}
                      </span>
                      <span className="text-body text-text-secondary">
                        /mês
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-body text-text-secondary mb-6">
                      {plan.description}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-border-subtle mb-6" />

                    {/* Features */}
                    <div className="flex-1 flex flex-col gap-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check
                            size={16}
                            className="text-accent flex-shrink-0 mt-0.5"
                          />
                          <span className="text-body text-text-primary">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <Button
                      variant={plan.current ? "secondary" : "primary"}
                      size="lg"
                      className="w-full"
                      disabled={plan.current || checkingOut !== null}
                      onClick={() => {
                        if (!plan.current && (plan.id === "pro" || plan.id === "studio")) {
                          handleCheckout(plan.id as "pro" | "studio");
                        }
                      }}
                    >
                      {checkingOut === plan.id
                        ? "Redirecionando..."
                        : plan.current
                        ? "Plano atual"
                        : `Assinar ${plan.name}`}
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 pb-16">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-h2 text-text-primary text-center mb-8">
            Perguntas frequentes
          </h2>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="border border-border-subtle rounded-lg overflow-hidden bg-bg-surface"
              >
                {/* Question */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-surface-2 transition-colors duration-fast text-left"
                >
                  <span className="text-body font-semibold text-text-primary">
                    {item.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-text-secondary flex-shrink-0 transition-transform duration-fast ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Answer */}
                {openFaqIndex === index && (
                  <div className="px-6 py-4 bg-bg-surface-2 border-t border-border-subtle">
                    <p className="text-body text-text-secondary">
                      {item.answer}
                    </p>
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
