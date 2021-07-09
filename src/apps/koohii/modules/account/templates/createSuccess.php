<?php
  use_helper('Form', 'Validation');
  $sf_request->setParameter('_homeFooter', true);
?>

<h2>Register an account</h2>

<p>
  Your email is private and will NOT be shared with any other service.<br/>
  <em>Please use a valid email so you can retrieve your password if you forget it!</em> 
</p>

<?php //DBG::request() ?>

<?php echo form_tag('account/create', ['id' => 'signup-form', 'class' => 'JsFocusOnLoadError', 'autocomplete' => 'false']); ?>

<div class="padded-box rounded mb-3 max-w-[380px]">
<?php
    // we use new 'validate' option to display error message below the input field
    // echo form_errors()

    echo _bs_form_group(
      ['validate' => 'username'],
      _bs_input_text('username', ['label' => 'Username', 'class' => 'JsFocusOnLoadInput'])
    );

    echo _bs_form_group(
      ['validate' => 'email'],
      _bs_input_email('email', ['label' => 'Email', 'autocomplete' => 'email'])
    );

    echo _bs_form_group(
      ['validate' => 'password'],
      _bs_input_password('password', ['label' => 'Password', 'autocomplete' => 'current-password'])
    );

    echo _bs_form_group(
      ['validate' => 'password2'],
      _bs_input_password('password2', ['label' => 'Confirm password', 'autocomplete' => 'new-password'])
    );

    echo _bs_form_group(
      [
        'validate' => 'location',
        'style' => 'margin-bottom:0',
      ],
      _bs_input_text('location', [
        'label' => 'Where do you live?',
        'optional' => true,
        'helptext' => 'Eg. "Tokyo, Japan" or just "Japan"',
        'autocomplete' => 'off',
      ])
    );
?>
</div><!-- /padded-box -->

<div class="padded-box rounded mb-3" style="max-width:380px">
<?php
    echo _bs_form_group(
  [
    'validate' => 'question',
    'class' => 'form-section',
  ],
  _bs_input_text('question', [
    'label' => 'What is the capital of J&nbsp;A&nbsp;P&nbsp;A&nbsp;N ?',
    'helptext' => '(Help us stop spam!)',
    'autocomplete' => 'off',
  ])
);
?>
    <p>If you are stuck you can <?php echo link_to('request an account', '@contact'); ?></p>

</div><!-- /padded-box -->

<div class="padded-box rounded mb-3" style="max-width:380px">
<?php
    echo _bs_form_group(
  _bs_submit_tag('Create Account', ['class' => 'btn-lg'])
);
?>
</div><!-- /padded-box -->

</form>
