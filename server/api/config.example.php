<?php

// Nukopijuokite šį failą į config.php (tame pačiame aplanke) ir užpildykite.

return [
    // MySQL prisijungimas (Virtualmin → Edit Databases)
    'db_host' => 'localhost',
    'db_name' => 'edeno_aidai',
    'db_user' => 'edeno_aidai',
    'db_pass' => '',

    // Administratoriaus slaptažodžio maiša (ne pats slaptažodis!).
    // Sugeneruoti: php hash-password.php 'JusuSlaptazodis'
    'admin_password_hash' => '',

    // Failų aplankai – paprastai keisti nereikia
    'files_dir' => dirname(__DIR__) . '/files',
    'storage_dir' => dirname(__DIR__) . '/storage',
];
