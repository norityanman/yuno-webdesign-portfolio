<?php
header('Content-Type: application/json; charset=UTF-8');
mb_language('Japanese');
mb_internal_encoding('UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '許可されていないリクエストです。'], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = trim((string) ($_POST['name'] ?? ''));
$replyTo = trim((string) ($_POST['_replyto'] ?? ''));
$company = trim((string) ($_POST['company'] ?? ''));
$category = trim((string) ($_POST['category'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || !filter_var($replyTo, FILTER_VALIDATE_EMAIL) || $message === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => '入力内容をご確認ください。'], JSON_UNESCAPED_UNICODE);
    exit;
}

$subject = 'yuno-webdesignへのお問い合わせ';
$body = implode("\n", [
    "お名前: {$name}",
    "メールアドレス: {$replyTo}",
    "会社名・事業名: " . ($company !== '' ? $company : '未記入'),
    "お問い合わせ内容: " . ($category !== '' ? $category : '未記入'),
    '',
    'ご相談内容:',
    $message,
]);
$body = mb_convert_encoding($body, 'JIS', 'UTF-8');
$headers = [
    'From: contact@yuno-webdesign.com',
    "Reply-To: {$replyTo}",
    'Content-Type: text/plain; charset=ISO-2022-JP',
    'Content-Transfer-Encoding: 7bit',
];

$sent = mb_send_mail('contact@yuno-webdesign.com', $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    error_log('Contact form mail() failed.');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'メールを送信できませんでした。'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
