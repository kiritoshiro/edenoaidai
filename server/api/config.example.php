<?php

// Copy this file to config.php in the same directory and fill in the values.

return [
    // MySQL connection (Virtualmin -> Edit Databases)
    'db_host' => 'localhost',
    'db_name' => 'edeno_aidai',
    'db_user' => 'edeno_aidai',
    'db_pass' => '',

    // Administrator password hash; never store the plain password here.
    // Generate it with: php hash-password.php 'YourPassword'
    'admin_password_hash' => '',

    // File directories; these normally do not need to be changed.
    'files_dir' => dirname(__DIR__) . '/files',
    'storage_dir' => dirname(__DIR__) . '/storage',
];
