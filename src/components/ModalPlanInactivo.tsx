import React from "react";
import { Button } from "./ui/button";
import { PlanesModal } from "./PlanesModal";

interface ModalPlanInactivoProps {
  open: boolean;
}

const ModalPlanInactivo: React.FC<ModalPlanInactivoProps> = ({
  open,
}) => {
  if (!open) return null;
  const [openPlanesModal, setOpenPlanesModal] = React.useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-destructive">Plan Inactivo</h2>
        <p className="mb-6 text-center text-muted-foreground">
          Tu suscripción está inactiva. No puedes acceder al sistema hasta reactivar tu plan.<br />
          Si tu período ha finalizado, se realizará el cobro correspondiente al reactivar.<br />
          Si tienes dudas, contáctanos a <a href="mailto:contacto@restify.cl" className="underline text-primary">contacto@restify.cl</a>.
        </p>
        <Button className="w-full mb-2" onClick={() => setOpenPlanesModal(true)}>
          Reactivar plan
        </Button>
        <PlanesModal open={openPlanesModal} onOpenChange={setOpenPlanesModal} hideTrialMessage={true} />
      </div>
    </div>
  );
};

export default ModalPlanInactivo;
