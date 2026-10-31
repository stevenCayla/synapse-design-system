<?php

declare(strict_types=1);

// Reads {"components": [dir...], "fixtures": {name: source}} on stdin, prints {name: html} on stdout.

require __DIR__.'/vendor/autoload.php';

use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;

$input = json_decode((string) file_get_contents('php://stdin'), true, flags: JSON_THROW_ON_ERROR);

$files = new FilesystemLoader();
foreach ($input['components'] as $directory) {
    $files->addPath($directory, 'si');
}

$twig = new Environment(
    new ChainLoader([new ArrayLoader($input['fixtures']), $files]),
    ['autoescape' => 'html', 'strict_variables' => true],
);

$output = [];
foreach (array_keys($input['fixtures']) as $name) {
    $output[$name] = $twig->render($name);
}

echo json_encode($output, JSON_THROW_ON_ERROR);
