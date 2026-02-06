<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

/**
 * ============================
 * CONFIGURACIÓN GENERAL
 * ============================
 */
$BASE_DIR = __DIR__;

/**
 * ============================
 * FUNCIÓN ERROR JSON
 * ============================
 */
function errorResponse(int $code, string $mensaje)
{
    http_response_code($code);
    header("Content-Type: application/json");
    echo json_encode([
        "ok" => false,
        "error" => $mensaje
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * ============================
 * INPUT MULTIPART
 * ============================
 */
if (empty($_POST['json'])) {
    errorResponse(400, "Falta campo json");
}

$data = json_decode($_POST['json'], true);
if (json_last_error() !== JSON_ERROR_NONE) {
    errorResponse(400, "JSON inválido");
}

/**
 * ============================
 * VALIDACIONES
 * ============================
 */
if (
    empty($data['Documento']['Encabezado']['Emisor']['Rut']) ||
    empty($data['Documento']['Detalles'])
) {
    errorResponse(400, "Datos obligatorios incompletos (Emisor RUT y Detalles requeridos)");
}

$rutEmpresa = $data['Documento']['Encabezado']['Emisor']['Rut'];

/**
 * ============================
 * RUTAS POR EMPRESA
 * ============================
 */
$EMPRESA_DIR = "$BASE_DIR/empresas/$rutEmpresa";
$GEN_DIR     = "$EMPRESA_DIR/generados";
$PUBLIC_BASE = "/empresas/$rutEmpresa/generados";

if (!is_dir($GEN_DIR)) {
    mkdir($GEN_DIR, 0777, true);
}

/**
 * ============================
 * ARCHIVOS ÚNICOS
 * ============================
 */
$timestamp = date("Ymd_His");
$PDF_FILENAME   = "vale_$timestamp.pdf";
$PDF_PATH       = "$GEN_DIR/$PDF_FILENAME";

require_once __DIR__ . "/libs/fpdf.php";

/**
 * ============================
 * OBTENER DATOS DEL JSON
 * ============================
 */
$emisor = $data['Documento']['Encabezado']['Emisor'];
$receptor = $data['Documento']['Encabezado']['Receptor'] ?? [];
$identificacion = $data['Documento']['Encabezado']['IdentificacionDTE'] ?? [];
$totales = $data['Documento']['Encabezado']['Totales'] ?? [];
$detalles = $data['Documento']['Detalles'];

/**
 * ============================
 * GENERAR PDF VALE DE VENTA
 * ============================
 */
$pdf = new FPDF('P', 'mm', [80, 297]);
$pdf->AddPage();
$pdf->SetMargins(0, 0, 0);
$pdf->SetAutoPageBreak(true, 0);
$pdf->SetY(0);

/**
 * ============================
 * ENCABEZADO CON LOGO Y TÍTULO
 * ============================
 */
$startY = $pdf->GetY();

// Logo si existe
$LOGO_PATH = "$EMPRESA_DIR/logo.png";
if (file_exists($LOGO_PATH)) {
    $pdf->Image($LOGO_PATH, 4, $startY, 20);
}

// Recuadro con título de VALE DE VENTA
$rectX = 26;
$rectY = $startY;
$rectW = 50;
$rectH = 20;

// Dibujar recuadro
$pdf->SetLineWidth(0.5);
$pdf->Rect($rectX, $rectY, $rectW, $rectH);

// Contenido del recuadro (centrado)
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetXY($rectX, $rectY + 3);
$pdf->Cell($rectW, 6, utf8_decode("VALE DE VENTA"), 0, 1, 'C');

$pdf->SetFont('Arial', '', 7);
$pdf->SetXY($rectX, $rectY + 10);
$pdf->Cell($rectW, 5, utf8_decode("RUT: " . ($emisor['Rut'] ?? $rutEmpresa)), 0, 1, 'C');

// Mover cursor debajo del logo y recuadro
$pdf->SetY($startY + 24);
$pdf->Ln(1);

/**
 * ============================
 * DATOS DE LA EMPRESA
 * ============================
 */
$pdf->SetFont('Arial', 'B', 9);
$pdf->MultiCell(0, 4, utf8_decode($emisor['RazonSocialBoleta'] ?? $emisor['RznSoc'] ?? 'EMPRESA'), 0, 'C');

$pdf->SetFont('Arial', '', 7);
$pdf->MultiCell(0, 3, utf8_decode($emisor['GiroBoleta'] ?? $emisor['GiroEmis'] ?? ''), 0, 'C');
$pdf->MultiCell(0, 3, utf8_decode(($emisor['DireccionOrigen'] ?? $emisor['DirOrigen'] ?? '') . ', ' . ($emisor['ComunaOrigen'] ?? $emisor['CmnaOrigen'] ?? '')), 0, 'C');
$pdf->Ln(2);

$pdf->Line(4, $pdf->GetY(), 76, $pdf->GetY());
$pdf->Ln(3);

/**
 * ============================
 * FECHA DEL DOCUMENTO
 * ============================
 */
$pdf->SetFont('Arial', '', 8);
$fechaEmision = $identificacion['FechaEmision'] ?? date('Y-m-d');
$pdf->Cell(0, 4, "Fecha: " . date("d-m-Y", strtotime($fechaEmision)) . " " . date("H:i"), 0, 1, 'C');
$pdf->Ln(3);

/**
 * ============================
 * DATOS CLIENTE (Si existe)
 * ============================
 */
if (!empty($receptor['RazonSocial'])) {
    $pdf->SetFont('Arial', '', 7);
    $pdf->Cell(0, 3, utf8_decode("Cliente: " . ($receptor['RazonSocial'] ?? '')), 0, 1);
    if (!empty($receptor['Rut'])) {
        $pdf->Cell(0, 3, utf8_decode("RUT: " . $receptor['Rut']), 0, 1);
    }
    if (!empty($receptor['Direccion'])) {
        $pdf->Cell(0, 3, utf8_decode("Dir: " . $receptor['Direccion']), 0, 1);
    }
    $pdf->Ln(2);

    $pdf->Line(4, $pdf->GetY(), 76, $pdf->GetY());
    $pdf->Ln(3);
}

/**
 * ============================
 * DETALLE - PRODUCTOS
 * ============================
 */
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(40, 4, "Descripcion", 0, 0);
$pdf->Cell(10, 4, "Cant", 0, 0, 'R');
$pdf->Cell(20, 4, "Total", 0, 1, 'R');

$pdf->SetFont('Arial', '', 7);

foreach ($detalles as $item) {
    $nombre = $item['Nombre'] ?? '';
    $cantidad = $item['Cantidad'] ?? 1;
    $montoItem = $item['MontoItem'] ?? 0;
    
    $pdf->Cell(40, 4, utf8_decode(substr($nombre, 0, 25)), 0, 0);
    $pdf->Cell(10, 4, number_format($cantidad, 0, ',', '.'), 0, 0, 'R');
    $pdf->Cell(20, 4, "$" . number_format($montoItem, 0, ',', '.'), 0, 1, 'R');
}

$pdf->Ln(2);
$pdf->Line(4, $pdf->GetY(), 76, $pdf->GetY());
$pdf->Ln(3);

/**
 * ============================
 * TOTALES
 * ============================
 */
$pdf->SetFont('Arial', '', 8);

if (!empty($totales['MontoNeto'])) {
    $pdf->Cell(40, 4, "Neto:", 0, 0);
    $pdf->Cell(30, 4, "$" . number_format($totales['MontoNeto'] ?? 0, 0, ',', '.'), 0, 1, 'R');
}

if (!empty($totales['IVA'])) {
    $pdf->Cell(40, 4, "IVA (19%):", 0, 0);
    $pdf->Cell(30, 4, "$" . number_format($totales['IVA'] ?? 0, 0, ',', '.'), 0, 1, 'R');
}

$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(40, 5, "TOTAL:", 0, 0);
$pdf->Cell(30, 5, "$" . number_format($totales['MontoTotal'] ?? 0, 0, ',', '.'), 0, 1, 'R');

$pdf->Ln(4);

/**
 * ============================
 * TEXTO FINAL
 * ============================
 */
$pdf->SetFont('Arial', '', 7);
$pdf->MultiCell(
    0,
    4,
    utf8_decode("Este es un Vale de Venta\nemitido por Benefiat de Restify SpA.\nwww.benefiat.cl"),
    0,
    'C'
);

/**
 * ============================
 * GUARDAR PDF
 * ============================
 */
$pdf->Output('F', $PDF_PATH);

/**
 * ============================
 * RESPONSE FINAL
 * ============================
 */
http_response_code(200);
header("Content-Type: application/json");

echo json_encode([
    "ok"       => true,
    "mensaje"  => "Vale de venta generado correctamente",
    "empresa"  => $rutEmpresa,
    "archivos" => [
        "pdf"    => "$PUBLIC_BASE/$PDF_FILENAME"
    ]
], JSON_UNESCAPED_UNICODE);
