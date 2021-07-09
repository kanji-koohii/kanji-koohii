<?php

return PhpCsFixer\Config::create()
    ->setRules(array(
        '@PSR1' => true,
        '@PSR2' => true,
        '@PhpCsFixer' => true,
        
        // -----------------------------------------------------
        // differences below
        // -----------------------------------------------------
        
        // oldschool Symfony style, verbose but more readable
        'braces' => array(
            'position_after_anonymous_constructs' => 'next',
            'position_after_control_structures' => 'next',
        ),

        // *don't* prematurely remove else's when I'm just testing something
        'no_useless_else' => null,

        // *don't* reorder public/private/etc: causes too much diffs, doesn't help much
        'ordered_class_elements' => null,

        // *don't* prematurely rewrite my return statements
        'return_assignment' => null,
        
        // for ($i = 0;; ++$i)  ==>  for ($i = 0; ; ++$i) 
        'space_after_semicolon' => ['remove_in_empty_for_expressions' => false],
        
        // *ignore* yoda style (occasional use)
        'yoda_style' => null,
    ))

    // use oldschool Symfony 2-spaces-per-tabs
    ->setIndent("  ")

    // linux line endings
    ->setLineEnding("\n");
