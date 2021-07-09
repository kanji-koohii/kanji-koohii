<?php
  use_helper('Form', 'Validation');
  $sf_request->setParameter('_homeFooter', true);
?>

<h2>Forgot your password?</h2>

<p>Enter your email address below and you will receive new password instructions.</p>

<p class="text-[#822] font-bold">If you do not receive an email please check the SPAM folder!</p>

<div class="padded-box rounded mb-3 max-w-[380px]">
  <?php
    echo form_errors();

    echo form_tag('@forgot_password', ['class' => '']);

    echo _bs_form_group(
      ['validate' => 'email'],
      _bs_input_email('email_address', ['label' => 'Email address', 'placeholder' => 'Email', 'class' => 'JsFocusOnLoadInput'])
    );
    echo _bs_form_group(
      _bs_submit_tag('Send password instructions', ['class' => ''])
    );
  ?>
  </form>
</div>
