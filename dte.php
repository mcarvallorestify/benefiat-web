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
$API_BASE = "https://api.simpleapi.cl/api/v1";
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
 * TOKEN SIMPLEAPI
 * ============================
 */
$TOKEN_FILE = __DIR__ . "/token_simpleapi.txt";
if (!file_exists($TOKEN_FILE)) {
    errorResponse(500, "No existe token_simpleapi.txt");
}
$TOKEN = trim(file_get_contents($TOKEN_FILE));

/**
 * ============================
 * INPUT MULTIPART
 * ============================
 */
if (empty($_POST['json'])) {
    errorResponse(400, "Falta campo json");
}

if (empty($_POST['fechaResolucion']) || empty($_POST['numeroResolucion'])) {
    errorResponse(400, "Falta fechaResolucion o numeroResolucion");
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
    empty($data['Certificado']['Rut']) ||
    empty($data['Certificado']['Password']) ||
    empty($data['Documento']['Encabezado']['Receptor']['Rut'])
) {
    errorResponse(400, "Datos obligatorios incompletos");
}

$rutEmpresa     = $data['Certificado']['Rut'];
$rutReceptor    = $data['Documento']['Encabezado']['Receptor']['Rut'];
$fechaResolucion = $_POST['fechaResolucion'];
$numeroResolucion = (int)$_POST['numeroResolucion'];

/**
 * ============================
 * RUTAS POR EMPRESA
 * ============================
 */
$EMPRESA_DIR = "$BASE_DIR/empresas/$rutEmpresa";
$GEN_DIR     = "$EMPRESA_DIR/generados";
$CERT_DIR    = "$EMPRESA_DIR/certificadosdigitales";
$PUBLIC_BASE = "/empresas/$rutEmpresa/generados";

if (!is_dir($GEN_DIR)) {
    mkdir($GEN_DIR, 0777, true);
}

/**
 * ============================
 * ARCHIVOS BASE
 * ============================
 */
$CERT_PATH = "$CERT_DIR/Certificado.pfx";
$CAF_PATH  = "$CERT_DIR/CAF_boletas.xml";
$CAF_factura_PATH  = "$CERT_DIR/CAF_facturas.xml";

if (!file_exists($CERT_PATH) || !file_exists($CAF_PATH)) {
    errorResponse(500, "Certificado o CAF no encontrados");
}

/**
 * ============================
 * SELECCIONAR CAF SEGÚN TIPO DE DTE
 * ============================
 */
$tipoDTE = $data['Documento']['Encabezado']['IdentificacionDTE']['TipoDTE'];
$CAF_SELECCIONADO = ($tipoDTE == 33) ? $CAF_factura_PATH : $CAF_PATH;

if (!file_exists($CAF_SELECCIONADO)) {
    errorResponse(500, "CAF no encontrado: " . basename($CAF_SELECCIONADO));
}

/**
 * ============================
 * ARCHIVOS ÚNICOS
 * ============================
 */
$timestamp = date("Ymd_Hi");

$DTE_XML_PATH   = "$GEN_DIR/DTE_$timestamp.xml";
$ENVIO_XML_PATH = "$GEN_DIR/ENVIO_$timestamp.xml";
$PDF_FILENAME   = "boleta_$timestamp.pdf";
$PDF_PATH       = "$GEN_DIR/$PDF_FILENAME";

/**
 * ============================
 * CURL MULTIPART
 * ============================
 */
function curlMultipart(string $url, string $inputJson, array $files, string $token)
{
    $postFields = ['input' => $inputJson];

    foreach ($files as $key => $file) {
        if (!file_exists($file)) {
            throw new Exception("Archivo no existe: $file");
        }
        $postFields[$key] = new CURLFile(
            realpath($file),
            mime_content_type($file),
            basename($file)
        );
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer $token"
        ]
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        throw new Exception(curl_error($ch));
    }

    curl_close($ch);
    return $response;
}

try {

    /**
     * 1️⃣ GENERAR DTE
     */
    $dteXml = curlMultipart(
        "$API_BASE/dte/generar",
        json_encode($data, JSON_UNESCAPED_UNICODE),
        [
            "fileCertificado" => $CERT_PATH,
            "fileCAF"         => $CAF_SELECCIONADO
        ],
        $TOKEN
    );

    file_put_contents($DTE_XML_PATH, $dteXml);

    /**
     * 2️⃣ GENERAR SOBRE (CORREGIDO)
     */
    $inputEnvio = json_encode([
        "Certificado" => $data['Certificado'],
        "Caratula" => [
            "RutEmisor"         => $rutEmpresa,
            "RutReceptor"      => $rutReceptor,
            "FechaResolucion"  => $fechaResolucion,
            "NumeroResolucion" => $numeroResolucion
        ]
    ], JSON_UNESCAPED_UNICODE);

    $sobreXml = curlMultipart(
        "$API_BASE/envio/generar",
        $inputEnvio,
        [
            "fileCertificado" => $CERT_PATH,
            "fileDte"         => $DTE_XML_PATH
        ],
        $TOKEN
    );

    file_put_contents($ENVIO_XML_PATH, $sobreXml);

    /**
     * 3️⃣ ENVIAR AL SII
     */
    $respuestaSiiRaw = curlMultipart(
        "$API_BASE/envio/enviar",
        json_encode([
            "Certificado" => $data['Certificado'],
            "Ambiente" => 1,
            "Tipo" => 2
        ], JSON_UNESCAPED_UNICODE),
        [
            "fileCertificado" => $CERT_PATH,
            "fileEnvio"       => $ENVIO_XML_PATH
        ],
        $TOKEN
    );

    $respuestaSii = json_decode($respuestaSiiRaw, true);
    $trackId = $respuestaSii['trackId'] ?? null;

/**
 * 4️⃣ OBTENER TIMBRE (PNG BASE64)
 */
$timbreBase64 = curlMultipart(
    "$API_BASE/impresion/timbre",
    '',
    [
        // OJO: el nombre es fileEnvio (tal como en la doc)
        "fileEnvio" => $DTE_XML_PATH
        // si usas DTE directo, usa:
        // "fileDte" => $DTE_XML_PATH
    ],
    $TOKEN
);

// LIMPIAR (por si vienen saltos de línea)
$timbreBase64 = trim($timbreBase64);

// DECODIFICAR BASE64 → BINARIO
$timbreBinario = base64_decode($timbreBase64, true);

if ($timbreBinario === false) {
    throw new Exception("El timbre no es base64 válido");
}

// VALIDAR FIRMA PNG (opcional pero recomendado)
if (substr($timbreBinario, 0, 8) !== "\x89PNG\x0D\x0A\x1A\x0A") {
    throw new Exception("El timbre decodificado no es un PNG válido");
}

// GUARDAR IMAGEN REAL
$TIMBRE_PATH = "$GEN_DIR/timbre_$timestamp.png";
file_put_contents($TIMBRE_PATH, $timbreBinario);

require_once __DIR__ . "/libs/fpdf.php";

/**
 * ============================
 * OBTENER DATOS DEL JSON
 * ============================
 */
$emisor = $data['Documento']['Encabezado']['Emisor'];
$receptor = $data['Documento']['Encabezado']['Receptor'];
$identificacion = $data['Documento']['Encabezado']['IdentificacionDTE'];
$totales = $data['Documento']['Encabezado']['Totales'];
$detalles = $data['Documento']['Detalles'];

// Determinar tipo de documento
$tipoDocumento = $identificacion['TipoDTE'] == 39 ? 'BOLETA ELECTRONICA' : 'FACTURA ELECTRONICA';

/**
 * ============================
 * GENERAR PDF BOLETA
 * ============================
 */
$pdf = new FPDF('P', 'mm', [72.1, 297]);
$pdf->AddPage();
$pdf->SetMargins(0, 0, 0);
$pdf->SetAutoPageBreak(true, 0);
$pdf->SetY(0);

/**
 * ============================
 * ENCABEZADO CON LOGO Y RECUADRO
 * ============================
 */
$startY = $pdf->GetY();

// Logo si existe
$LOGO_PATH = "$EMPRESA_DIR/logo.png";
if (file_exists($LOGO_PATH)) {
    $pdf->Image($LOGO_PATH, 4, $startY, 20);
}

// Recuadro con datos principales (lado derecho del logo)
$rectX = 26;
$rectY = $startY;
$rectW = 50;
$rectH = 24;

// Dibujar recuadro
$pdf->SetLineWidth(0.5);
$pdf->Rect($rectX, $rectY, $rectW, $rectH);

// Contenido del recuadro (centrado)
$pdf->SetFont('Arial', 'B', 9);
$pdf->SetXY($rectX, $rectY + 2);
$pdf->Cell($rectW, 5, utf8_decode("RUT: " . ($emisor['Rut'] ?? $rutEmpresa)), 0, 1, 'C');

$pdf->SetFont('Arial', 'B', 8);
$pdf->SetXY($rectX, $rectY + 8);
$pdf->Cell($rectW, 5, utf8_decode($tipoDocumento), 0, 1, 'C');

$pdf->SetFont('Arial', '', 7);
$pdf->SetXY($rectX, $rectY + 14);
$pdf->Cell($rectW, 5, utf8_decode("N\xc2\xb0 FOLIO: " . ($identificacion['Folio'] ?? '')), 0, 1, 'C');

// Mover cursor debajo del logo y recuadro
$pdf->SetY($startY + 26);
$pdf->Ln(1);

/**
 * ============================
 * DATOS DE LA EMPRESA (debajo del recuadro)
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
$pdf->Cell(0, 4, "Fecha: " . date("d-m-Y", strtotime($identificacion['FechaEmision'] ?? 'now')) . " " . date("H:i"), 0, 1, 'C');
$pdf->Ln(3);

/**
 * ============================
 * DATOS CLIENTE (Solo si es Factura)
 * ============================"
 */
if ($identificacion['TipoDTE'] != 39) {
    $pdf->SetFont('Arial', '', 7);
    $pdf->Cell(0, 3, utf8_decode("Cliente: " . ($receptor['RazonSocial'] ?? '')), 0, 1);
    $pdf->Cell(0, 3, utf8_decode("RUT: " . ($receptor['Rut'] ?? '')), 0, 1);
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
$pdf->Cell(40, 4, "Neto:", 0, 0);
$pdf->Cell(30, 4, "$" . number_format($totales['MontoNeto'] ?? 0, 0, ',', '.'), 0, 1, 'R');

$pdf->Cell(40, 4, "IVA (19%):", 0, 0);
$pdf->Cell(30, 4, "$" . number_format($totales['IVA'] ?? 0, 0, ',', '.'), 0, 1, 'R');

$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(40, 5, "TOTAL:", 0, 0);
$pdf->Cell(30, 5, "$" . number_format($totales['MontoTotal'] ?? 0, 0, ',', '.'), 0, 1, 'R');

$pdf->Ln(4);

/**
 * ============================
 * TIMBRE (ABAJO)
 * ============================
 */
$timbreWidth = 60;
$x = (80 - $timbreWidth) / 2;

$pdf->Image($TIMBRE_PATH, $x, $pdf->GetY(), $timbreWidth);
$pdf->Ln(45);

/**
 * ============================
 * TEXTO FINAL PERSONALIZADO
 * ============================
 */
$pdf->SetFont('Arial', '', 7);
$pdf->MultiCell(
    0,
    4,
    utf8_decode("DTE emitido por Benefiat de Restify SpA.\nwww.benefiat.cl"),
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
    "mensaje"  => "Boleta emitida correctamente",
    "empresa"  => $rutEmpresa,
    "trackId"  => $trackId,
    "archivos" => [
    "dte"    => "$PUBLIC_BASE/DTE_$timestamp.xml",
    "envio"  => "$PUBLIC_BASE/ENVIO_$timestamp.xml",
    "timbre" => "$PUBLIC_BASE/timbre_$timestamp.png",
    "pdf"    => "$PUBLIC_BASE/$PDF_FILENAME"
]


], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    errorResponse(500, $e->getMessage());
}