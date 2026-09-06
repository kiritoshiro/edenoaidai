<?php

// Naudojimas (per SSH arba Webmin "Command Shell"):
//   php hash-password.php 'JusuSlaptazodis'
// Gautą eilutę įrašykite į config.php -> 'admin_password_hash'

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$password = $argv[1] ?? '';
if ($password === '') {
    fwrite(STDERR, "Naudojimas: php hash-password.php 'JusuSlaptazodis'\n");
    exit(1);
}

echo "Įrašykite į config.php:\n";
echo "'admin_password_hash' => '" . password_hash($password, PASSWORD_DEFAULT) . "',\n";
