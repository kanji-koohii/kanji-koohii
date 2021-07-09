<?php
/**
 * Helpers to output Bootstrap 3 css/components.
 *
 *
 * COMMON OPTIONS
 *
 *   'class', 'style', etc.        Options array is passed to the Symfony tag helpers to handle
 *                                 any attributes
 *
 *
 * INPUT OPTIONS
 *
 *   'helptext' => 'message'       To add a Bootstrap .help-block element after the input
 *   'label'                       Adds label  NOTE! input name = id
 *   'optional'                    Add an (Optional) text next to the label
 *
 * 
 * COMMON HELPERS
 *
 *  _bs_button()                   MUST add Bootstrap css as option 'class' => 'btn btn-success ...'
 *  _bs_button_with_icon()         DONT add 'btn btn-success' ... MUST add 'icon' => 'fa-icon-id'
 *
 *
 * FORM HELPERS
 *  
 *  _bs_formgroup([array $options], ...)
 *  
 *      OPTIONAL attributes as per Symfony tag helpers, must be an array as first argument.
 *      
 *      Set 'validate' to input name to add "has-error" class to the form-group if matching error in Request.
 *
 *        _bs_formgroup(['validate' => 'username'], ...)
 *
 *  _bs_input_checkbox($name, $options = array())      ALWAYS: value="1" ... OPTIONAL: 'label' => 'Label text'
 *  _bs_input_text    ($name, $options = array())      ...
 *  _bs_input_email   ($name, $options = array())      ...
 *  _bs_input_password($name, $options = array())      ...
 *
 *  _bs_submit_tag    ($label, $options = array())
 *
 * 
 *
 * FORM LAYOUT
 *
 *  Inline: add class "form-control-i" to children of _bs_formgroup()
 *
 *
 * SEE
 * 
 *   https://getbootstrap.com/docs/3.3/css/#forms
 * 
 */

/**
 * Returns html for a Bootstrap button.
 *
 * Uses 'btn btn-default' unless btn-success, btn-warning, etc specified.
 * 
 * Additional options as per Symfony's link_to() helper: 'absolute', 'query_string', 'anchor', etc.
 *
 */
function _bs_button($name, $internal_uri, array $options = [])
{
  // TODO

  return link_to($name, $internal_uri, $options);
}

/**
 * another helper to help refactoring later
 *
 * Options:
 *   icon    fontawesome icon id (eg. fa-file-o)
 * 
 */
function _bs_button_with_icon($name, $internal_uri, array $options = [])
{
  $iconId = _get_option($options, 'icon');
  assert($iconId !== null);

  _bs_class_merge($options, 'btn btn-success');

  $name = "<i class=\"far $iconId\"></i>$name";

  return link_to($name, $internal_uri, $options);
}

// Classnames are appended to $options['class'] if present.
function _bs_class_merge(array & $options, $classnames) {
  if (isset($options['class'])) {
    if (!is_array($options['class'])) {
      $classnames = $classnames.' '.$options['class'];
    }
    else {
      throw new sfException('_bs_class_merge() options["class"] must be a string');
    }
  }

  $options['class'] = $classnames;
}

/**
 * Optional first argument : array $options
 *
 * Example:
 *
 *   _bs_form_group(
 *     array('style' => 'color:red'),
 *     '<span>Hello</span>',
 *     _bs_input_text('Label', 'name_and_id')
 *   )
 */
function _bs_form_group() {
  if (func_num_args() < 1) {
    throw new sfException('_bs_form_group() has no content.');
  }

  $args        = func_get_args();
  $input_name  = false;
  $hasErrorMsg = '';

  // pull the optional first argument : array $options
  $options     = is_array($args[0]) ? array_shift($args) : [];

  $merge_class = 'form-group'; 

  // add Bootstrap 'has-error' class
  if (false !== ($input_name = $options['validate'] ?? false)) {
    unset($options['validate']);
    $request = sfContext::getInstance()->getRequest();
    if ($request->hasError($input_name)) {
      $merge_class .= ' has-error';
      $hasErrorMsg  = '<div class="has-error-msg">^ '.$request->getError($input_name).'</div>';
    }
  }

  _bs_class_merge($options, $merge_class);

  $html = "\n<div "._tag_options($options).'>'
        . implode($args)
        . $hasErrorMsg
        . "\n</div>";

  return $html;
}

function _bs_input($type, $name, $options = []) {
  $html = [];

  if (null !== ($label = _get_option($options, 'label'))) {
    $html[] = "\n  ".label_for($name /* id */, $label, ['class' => 'control-label']);
  }

  if (null !== ($optional = _get_option($options, 'optional'))) {
    $html[] = '<span class="form-optional">(optional)</span>';
  }

  // input  
  _bs_class_merge($options, 'form-control');

  // FIXME  obsolete FormHelper (not the Symfony one) did not include 'id'
  $options['id'] = get_id_from_name($name);

  if ($type === 'text' ||
      $type === 'email' /* skip the annoying browser-based email checking */ ) {
    $html[] = "\n  ".input_tag($name, '', $options);
  }
  elseif ($type === 'password') {
    $html[] = "\n  ".input_password_tag($name, null, $options);
  }
  else {
    throw new sfException('Unsupported input type in _bs_input()');
  }

  // help text
  if (null !== ($helptext = _get_option($options, 'helptext'))) {
    $html[] = "\n  ".'<span class="help-block">'.$helptext.'</span>';
  }

  return implode($html);
}

/**
 * Note: we diverge from Bootstrap here and output a .form-group for consistency with
 * the form row helper, as well as use a span, so we can use display:table to fix the
 * freakin checkbox/label alignment.
 *
 *  <div class="form-group">
 *    <label><input ...><span>Label text</span>
 *  </div>
 */
function _bs_input_checkbox($name, $options = []) {
  // we want a wrapping label here
  if (null !== ($label = _get_option($options, 'label'))) {
    $html[] = "\n  <label>";
  }

  $html[] = checkbox_tag($name, '1', false, $options)."<span>$label</span>";

  if (null !== $label) {
    $html[] = "</label>\n";
  }

  return implode($html);
}

function _bs_input_email($name, $options = []) {
  return _bs_input('text', $name, $options);
}

function _bs_input_password($name, $options = []) {
  return _bs_input('password', $name, $options);
}

function _bs_input_text($name, $options = []) {
  return _bs_input('text', $name, $options);
}

function _bs_submit_tag($label, $options = []) {
  _bs_class_merge($options, 'btn btn-success');
  return submit_tag($label, $options);
}


function koohii_onload_slot()
{
  $name = 'koohii_onload_js';
  $prevContent = get_slot($name);
  slot($name);
  echo $prevContent;
  echo "console.log('koohii_onload_slot()')\n";
}

function koohii_onload_slots_out()
{
  if ($s = get_slot('koohii_onload_js'))
  {
    echo "<script>\n",
    '/* Koohii onload slot */ ',
    "window.addEventListener('DOMContentLoaded',function(){\n", $s, "});</script>\n";
  }
}

define('KK_GLOBALS', 'kk.globals');

/**
 * Helper to "hydrate" template with data for the frontend.
 *
 * Use `kk_globals_get()` in Javascript (cf. globals.d.ts)
 *
 * Conveniently, this hydration happens BEFORE defered modules
 * from Vite build are run, since defered modules happen after
 * the document is parsed, and <script>'s are part of the document.
 *
 * @param string $name  the key name (convention ALL_UPPERCASE)
 * @param mixed  $value any valid value that parses to JSON (string, boolean, null, etc)
 */
function kk_globals_put(string $name, $value)
{
  $kk_globals = sfConfig::get(KK_GLOBALS);
  if (null === $kk_globals)
  {
    $kk_globals = new sfParameterHolder();
    sfConfig::set(KK_GLOBALS, $kk_globals);
  }
  $kk_globals->set($name, $value);
}

/**
 * Call once in the main layout template to output all KK.* globals.
 */

function kk_globals_out()
{
  kk_globals_put('BASE_URL', url_for('@homepage', true));

  if (null !== ($kk_globals = sfConfig::get(KK_GLOBALS)))
  {
    $values = json_encode($kk_globals->getAll());

    $lines = [];
    foreach ($kk_globals->getAll() as $name => $value)
    {
      $lines[] = "KK.{$name} = ".json_encode($value);
    }

    echo "\n<script>\nwindow.KK || (KK = {});\n".implode("\n", $lines)."\n</script>\n";
  }
}
