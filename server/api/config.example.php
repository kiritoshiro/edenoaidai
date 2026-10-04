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

    // GitHub updater. A token is optional for public repositories, but helps
    // with private repositories and GitHub API rate limits.
    'github_owner' => 'kiritoshiro',
    'github_repo' => 'edenoaidai',
    'github_branch' => 'v2',
    'github_token' => '',
    // Only install versions on github_branch whose GitHub security gate
    // ("All security checks passed") succeeded. Set to false only for an
    // emergency rollback to a commit from before that gate existed.
    'github_require_security_checks' => true,
    // Other origins allowed to send POST/PUT/DELETE requests to the API, e.g.
    // ['https://admin.example.lt']. The site's own origin is always allowed.
    'allowed_origins' => [],

    // File directories; these normally do not need to be changed.
    'files_dir' => dirname(__DIR__) . '/files',
    'storage_dir' => dirname(__DIR__) . '/storage',
];
