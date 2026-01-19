<?php
// ==================================================================
// CONFIGURATION
// ==================================================================

define('GOOGLE_CHAT_WEBHOOK_URL', 'https://chat.googleapis.com/v1/spaces/AAQA2upkBJg/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=LMLuTXZu70nh6o9xInPVl2iz_zm6CjhIL1oNG4ItPd8');
define('GITHUB_SECRET', '');

// ==================================================================
// LOGIQUE DU SCRIPT
// ==================================================================

// Récupérer le contenu brut envoyé par GitHub (JSON)
$payload = file_get_contents('php://input');
$headers = getallheaders();

// 1. VÉRIFICATION DE SÉCURITÉ (Signature)
// On s'assure que la requête vient bien de GitHub et pas d'un hacker
if (defined('GITHUB_SECRET') && !empty(GITHUB_SECRET)) {
    // GitHub envoie la signature dans le header 'X-Hub-Signature-256'
    $hubSignature = isset($headers['X-Hub-Signature-256']) ? $headers['X-Hub-Signature-256'] : '';
    
    // On recalcule la signature nous-mêmes
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, GITHUB_SECRET);

    // Si ça ne matche pas, on arrête tout
    if (!hash_equals($expectedSignature, $hubSignature)) {
        http_response_code(403);
        die("Erreur : Signature invalide. Accès refusé.");
    }
}

// 2. PARSING DES DONNÉES
$data = json_decode($payload, true);
$eventType = isset($_SERVER['HTTP_X_GITHUB_EVENT']) ? $_SERVER['HTTP_X_GITHUB_EVENT'] : 'unknown';

// Si c'est juste un "ping" de GitHub pour tester
if ($eventType === 'ping') {
    sendToGoogleChat("👋 Configuration Webhook réussie pour le dépôt : " . $data['repository']['full_name']);
    die();
}

// 3. TRAITEMENT DE L'ÉVÉNEMENT "PUSH"
if ($eventType === 'push') {
    // Récupération des infos intéressantes
    $repoName = $data['repository']['full_name'];
    $pusher = $data['pusher']['name'];
    $branch = str_replace('refs/heads/', '', $data['ref']); // On nettoie le nom de la branche
    $commits = $data['commits'];
    $compareUrl = $data['compare'];

    // Construction du message pour Google Chat
    // On utilise le format "Card" pour faire joli
    $messageText = "<b>🔨 Nouveau Push sur $repoName</b>\n";
    $messageText .= "👤 <b>Par :</b> $pusher\n";
    $messageText .= "🌿 <b>Branche :</b> $branch\n\n";
    
    $messageText .= "<b>Derniers commits :</b>\n";
    foreach ($commits as $commit) {
        $msg = $commit['message'];
        // On tronque le message s'il est trop long
        if (strlen($msg) > 50) $msg = substr($msg, 0, 50) . '...';
        $messageText .= "• $msg\n";
    }

    $messageText .= "\n<a href=\"$compareUrl\">Voir les modifications sur GitHub</a>";

    // Envoi
    sendToGoogleChat($messageText);
}

// Répondre à GitHub que tout s'est bien passé
http_response_code(200);
echo "Webhook reçu et traité.";


// ==================================================================
// FONCTION D'ENVOI
// ==================================================================

function sendToGoogleChat($text) {
    // Google Chat attend un JSON avec une clé "text"
    $postData = json_encode(['text' => $text]);

    $ch = curl_init(GOOGLE_CHAT_WEBHOOK_URL);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ]);

    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}
?>