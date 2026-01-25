import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, MapPin, FileText, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Configuracion() {
  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios han sido guardados correctamente.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="page-header">Configuración</h1>
          <p className="page-subtitle mt-1">Administra la información de tu empresa</p>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="empresa">Datos Empresa</TabsTrigger>
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Información de la Empresa
                </CardTitle>
                <CardDescription>
                  Datos que aparecerán en tus documentos tributarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>RUT Empresa</Label>
                    <Input placeholder="76.XXX.XXX-X" defaultValue="76.123.456-7" />
                  </div>
                  <div className="space-y-2">
                    <Label>Razón Social</Label>
                    <Input placeholder="Nombre legal de la empresa" defaultValue="Mi Empresa SpA" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de Fantasía</Label>
                  <Input placeholder="Nombre comercial" defaultValue="Mi Empresa" />
                </div>
                <div className="space-y-2">
                  <Label>Giro Comercial</Label>
                  <Input
                    placeholder="Actividad económica"
                    defaultValue="Venta de productos y servicios tecnológicos"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Dirección
                </CardTitle>
                <CardDescription>Dirección legal de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Calle y Número</Label>
                    <Input placeholder="Av. Ejemplo 1234" defaultValue="Av. Providencia 1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Oficina/Depto (opcional)</Label>
                    <Input placeholder="Oficina 501" defaultValue="Oficina 501" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Comuna</Label>
                    <Input placeholder="Comuna" defaultValue="Providencia" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input placeholder="Ciudad" defaultValue="Santiago" />
                  </div>
                  <div className="space-y-2">
                    <Label>Región</Label>
                    <Input placeholder="Región" defaultValue="Metropolitana" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contacto
                </CardTitle>
                <CardDescription>Información de contacto de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="contacto@empresa.cl"
                      defaultValue="contacto@miempresa.cl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+56 2 2345 6789" defaultValue="+56 2 2345 6789" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sitio Web (opcional)</Label>
                  <Input placeholder="https://www.empresa.cl" defaultValue="https://www.miempresa.cl" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="facturacion" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Configuración de Facturación
                </CardTitle>
                <CardDescription>
                  Configura los parámetros de tus documentos tributarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Resolución SII</Label>
                    <Input placeholder="Número de resolución" defaultValue="80" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Resolución</Label>
                    <Input type="date" defaultValue="2024-01-15" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Folio Inicial Boletas</Label>
                    <Input type="number" placeholder="1" defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Folio Inicial Facturas</Label>
                    <Input type="number" placeholder="1" defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>IVA (%)</Label>
                    <Input type="number" placeholder="19" defaultValue="19" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje en Documentos (opcional)</Label>
                  <Textarea
                    placeholder="Texto adicional que aparecerá en sus documentos"
                    defaultValue="Gracias por su preferencia. Los productos no tienen cambio ni devolución."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Personalización de Documentos</CardTitle>
                <CardDescription>
                  Personaliza la apariencia de tus boletas y facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Logo de la Empresa</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Arrastra tu logo aquí o haz clic para seleccionar
                      </p>
                      <Button variant="outline" size="sm">
                        Subir Logo
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Color Principal</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary"></div>
                      <Input defaultValue="#00679F" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color Secundario</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary"></div>
                      <Input defaultValue="#6EDCF8" className="flex-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
