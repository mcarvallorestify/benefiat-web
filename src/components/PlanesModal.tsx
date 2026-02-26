import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useUser } from "@/hooks/useUser";
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    slug: "emprendedor",
    planIds: [10, 11], // IDs de planes que corresponden a este nivel
    planId: 10,
    name: "Emprendedor",
    priceMonthly: "15.990",
    priceYearly: "159.900",
    period: "/mes con iva",
    description: "Ideal para negocios que recién comienzan",
    features: [
      "1.000 DTE's mensuales",
      "1 punto de venta",
      "Boletas y facturas",
      "Notas de crédito y débito",
      "Guías de despacho",
      "Reportes mensuales",
      "Soporte por email o Whatsapp",
      "Gestión de carpetas y documentos",
      "Gestión de usuarios",
      "Gestión de productos e inventario",
      "API de integración",
    ],
    popular: false,
  },
  {
    slug: "profesional",
    planIds: [12, 13],
    planId: 12,
    name: "Profesional",
    priceMonthly: "20.990",
    priceYearly: "209.900",
    period: "/mes con iva",
    description: "Para negocios en crecimiento",
    features: [
      "Todo lo que incluye el plan Emprendedor",
      "3.000 DTE's",
      "3 puntos de venta",
      "Soporte prioritario",
      "API de integración",
    ],
    popular: true,
  },
  {
    slug: "empresarial",
    planIds: [14, 15],
    planId: 14,
    name: "Empresarial",
    priceMonthly: "29.990",
    priceYearly: "299.900",
    period: "/mes con iva",
    description: "Para empresas con alto volumen",
    features: [
      "Todo lo incluido en los demás planes",
      "DTE's ilimitados",
      "API de integración",
      "Multi-sucursal",
      "Soporte 24/7",
    ],
    popular: false,
  },
];

interface PlanesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideTrialMessage?: boolean;
}

export const PlanesModal = ({ open, onOpenChange, hideTrialMessage }: PlanesModalProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [diasRestantes, setDiasRestantes] = useState<number>(0);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [planEnConfirmacion, setPlanEnConfirmacion] = useState<typeof plans[0] | null>(null);
  const [montoConfirmacion, setMontoConfirmacion] = useState<number>(0);
  const [valorPlanActual, setValorPlanActual] = useState<number | null>(null);
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);

  // Obtener el plan actual del usuario y días restantes
  useEffect(() => {
    if (!empresa?.id) return;
    
    const fetchCurrentPlan = async () => {
      try {
        const { data: planData, error: planError } = await supabase
          .from("plan_empresa")
          .select("plan_asociado, valor_plan")
          .eq("empresa", empresa.id)
          .maybeSingle();
        
        if (planError) throw planError;
        if (planData) {
          setCurrentPlanId(planData.plan_asociado);
          setValorPlanActual(planData.valor_plan);
        }

        // Obtener días restantes de la tabla empresa
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresa")
          .select("dias_restantes_plan")
          .eq("id", empresa.id)
          .maybeSingle();
        
        if (empresaError) throw empresaError;
        if (empresaData) {
          setDiasRestantes(empresaData.dias_restantes_plan || 0);
        }
      } catch (e) {
        console.warn("No se pudo obtener el plan actual:", e);
      }
    };

    fetchCurrentPlan();
  }, [empresa?.id]);

  const isCurrentPlan = (planIds: number[], isPlanYearly: boolean) => {
    if (currentPlanId === null) return false;
    // Detectar si el plan actual es anual
    const planActual = plans.find(p => p.planIds.includes(currentPlanId));
    if (!planActual) return false;
    const precioActualMensual = parseInt(planActual.priceMonthly.replace(/\./g, ""));
    const precioActualAnual = parseInt(planActual.priceYearly.replace(/\./g, ""));
    const esActualAnual = valorPlanActual === precioActualAnual;
    // Coincide id y periodo
    return planIds.includes(currentPlanId) && ((isPlanYearly && esActualAnual) || (!isPlanYearly && !esActualAnual));
  };

  const calcularMontoProportional = (precioPlan: number): number => {
    if (!valorPlanActual || !planEnConfirmacion) return precioPlan;
    if (diasRestantes <= 0) return precioPlan;

    const planActual = plans.find(p => p.planIds.includes(currentPlanId ?? -1));
    if (!planActual) return precioPlan;

    const precioActualMensual = parseInt(planActual.priceMonthly.replace(/\./g, ""));
    const precioActualAnual = parseInt(planActual.priceYearly.replace(/\./g, ""));
    const esActualAnual = valorPlanActual === precioActualAnual;
    const esActualMensual = valorPlanActual === precioActualMensual;
    const mismoGrupo = planEnConfirmacion && planActual.planIds.includes(planEnConfirmacion.planId);

    // Si el nuevo plan es igual o inferior, no cobrar
    if (precioPlan <= valorPlanActual) return 0;

    // Si ambos son mensuales y el nuevo es más caro, cobrar solo el proporcional por la diferencia
    if (!isYearly && esActualMensual) {
      const diferencia = precioPlan - precioActualMensual;
      const monto = Math.round((diferencia / 30) * diasRestantes);
      return monto > 0 ? monto : 0;
    }

    // Si ambos son anuales y el nuevo es más caro, cobrar el proporcional anual
    if (isYearly && esActualAnual) {
      const diferencia = precioPlan - precioActualAnual;
      const monto = Math.round((diferencia / 365) * diasRestantes);
      return monto > 0 ? monto : 0;
    }

    // Si cambia de mensual a anual dentro del mismo grupo, cobrar el año completo
    if (isYearly && esActualMensual && mismoGrupo) {
      return precioPlan;
    }

    // Si cambia de anual a mensual dentro del mismo grupo, no cobrar
    if (!isYearly && esActualAnual && mismoGrupo) {
      return 0;
    }

    // Por defecto, cobrar el precio completo
    return precioPlan;
  };

  const procesarCambioDePlan = async (plan: typeof plans[0]) => {
    if (!user?.id || !empresa?.id) {
      toast({ title: "Error", description: "No se encontró usuario o empresa" });
      return;
    }

    setProcesando(plan.slug);
    try {
      // Obtener precio del plan según selección mensual/anual
      const precioBase = isYearly
        ? parseInt(plan.priceYearly.replace(/\./g, ""))
        : parseInt(plan.priceMonthly.replace(/\./g, ""));
      const montoAjustado = calcularMontoProportional(precioBase);

      // Obtener el token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("No hay sesión activa");
      }

      // Llamar a la edge function de Supabase
      const response = await fetch(
        "https://btbdasehtcqffyoscgzp.supabase.co/functions/v1/pagos-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            usuario_id: user.id,
            empresa_id: empresa.id,
            monto: montoAjustado,
            plan_id: plan.planId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error procesando el pago");
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar el plan en plan_empresa (sin reiniciar días restantes)
        const { error: updateError } = await supabase
          .from("plan_empresa")
          .update({ plan_asociado: plan.planId })
          .eq("empresa", empresa.id);

        if (updateError) throw updateError;

        setCurrentPlanId(plan.planId);
        toast({
          title: "Plan actualizado",
          description: `Tu plan cambió a ${plan.name}. Monto cobrado: $${montoAjustado.toLocaleString("es-CL")}`,
        });
        setPlanEnConfirmacion(null);
        onOpenChange(false);
      } else {
        throw new Error(result.message || "Error desconocido");
      }
    } catch (error: any) {
      console.error("Error procesando cambio de plan:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el cambio de plan",
      });
    } finally {
      setProcesando(null);
    }
  };

  const abrirConfirmacion = (plan: typeof plans[0]) => {
    const precioBase = isYearly
      ? parseInt(plan.priceYearly.replace(/\./g, ""))
      : parseInt(plan.priceMonthly.replace(/\./g, ""));
    const monto = calcularMontoProportional(precioBase);
    setPlanEnConfirmacion(plan);
    setMontoConfirmacion(monto);
  };

  useEffect(() => {
    if (planEnConfirmacion) {
      const precioBase = isYearly
        ? parseInt(planEnConfirmacion.priceYearly.replace(/\./g, ""))
        : parseInt(planEnConfirmacion.priceMonthly.replace(/\./g, ""));
      setMontoConfirmacion(calcularMontoProportional(precioBase));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYearly, diasRestantes, planEnConfirmacion]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl md:text-3xl font-bold">
              Planes que se adaptan a{" "}
              <span className="text-primary">tu negocio</span>
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Sin contratos de permanencia. Cancela cuando quieras.{" "}
              {!hideTrialMessage && "Todos los planes incluyen 5 días de prueba gratis."}
            </DialogDescription>
          </DialogHeader>

          {/* Toggle Monthly/Yearly */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-background rounded-full transition-transform ${
                  isYearly ? "translate-x-7" : ""
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Anual
              <span className="ml-1 text-xs text-primary font-semibold">(Ahorra 17%)</span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan, index) => {
              const isPlanActual = isCurrentPlan(plan.planIds, isYearly);
              
              return (
                <div
                  key={index}
                  className={`relative rounded-2xl p-6 ${
                    plan.popular
                      ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary scale-105"
                      : "bg-card border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Más Popular
                      </div>
                    </div>
                  )}

                  {isPlanActual && (
                    <div className="absolute -top-3 right-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Plan Actual
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className={`text-lg font-bold mb-2 ${plan.popular ? "" : "text-foreground"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <span className={`text-3xl font-bold ${plan.popular ? "" : "text-foreground"}`}>
                      ${isYearly ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {isYearly ? "/año con iva" : plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                        <span className={`text-sm ${plan.popular ? "" : "text-foreground"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? "secondary" : "default"}
                    className="w-full"
                    disabled={isPlanActual || procesando !== null}
                    onClick={() => abrirConfirmacion(plan)}
                  >
                    {isPlanActual ? "Plan Actual" : "Cambiar Plan"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Todos los precios están en CLP e incluyen IVA.
            ¿Necesitas un plan personalizado? <span className="text-primary font-medium cursor-pointer hover:underline">Contáctanos</span>
          </p>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={planEnConfirmacion !== null} onOpenChange={(open) => {
        if (!open) setPlanEnConfirmacion(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Confirmar cambio de plan</DialogTitle>
            <DialogDescription className="text-center">
              Revisa los detalles antes de proceder
            </DialogDescription>
          </DialogHeader>

          {planEnConfirmacion && (
            <div className="space-y-6 py-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevo plan</p>
                  <h3 className="text-xl font-bold">{planEnConfirmacion.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {planEnConfirmacion.description}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Beneficios principales:</p>
                  <ul className="space-y-2">
                    {planEnConfirmacion.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Monto a cobrar</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-primary">
                    ${montoConfirmacion.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {/* Mensaje dinámico según el tipo de cambio */}
                    {(() => {
                      if (!valorPlanActual || !planEnConfirmacion) return "";
                      if (diasRestantes <= 0) {
                        return isYearly ? "(anual, precio completo)" : "(mensual, precio completo)";
                      }
                      // Usar el precio base calculado para la comparación
                      const precioBase = isYearly
                        ? parseInt(planEnConfirmacion.priceYearly.replace(/\./g, ""))
                        : parseInt(planEnConfirmacion.priceMonthly.replace(/\./g, ""));
                      if (montoConfirmacion < precioBase) {
                        return isYearly
                          ? "(proporcional anual por diferencia de precio)"
                          : "(proporcional mensual por diferencia de precio)";
                      }
                      if (montoConfirmacion === precioBase) {
                        return isYearly ? "(anual, precio completo)" : "(mensual, precio completo)";
                      }
                      return "";
                    })()}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Tu período de facturación se reinicia</p>
                <p>✓ El cambio es efectivo de inmediato</p>
                <p>✓ Puedes cambiar de plan nuevamente en cualquier momento</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setPlanEnConfirmacion(null)}
              disabled={procesando !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (planEnConfirmacion) {
                  procesarCambioDePlan(planEnConfirmacion);
                }
              }}
              disabled={procesando !== null}
            >
              {procesando ? "Procesando..." : "Confirmar cambio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
