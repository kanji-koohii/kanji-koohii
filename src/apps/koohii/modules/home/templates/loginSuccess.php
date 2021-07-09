<?php
  use_helper('Bootstrap', 'Form', 'Validation');
  $sf_request->setParameter('_homeFooter', true);
?>

    <h2>Sign in</h2>

  <div class="px-4 py-4 rounded bg-shaded mb-8 max-w-[380px]">

<?php
    echo form_errors();

    echo form_tag('home/login', ['class' => 'JsFocusOnLoadError']);

    echo input_hidden_tag('referer', $sf_request->getParameter('referer'));

    echo _bs_form_group(
      _bs_input_text('username', ['label' => 'Username', 'class' => 'JsFocusOnLoadInput', 'style' => 'max-width:300px'])
    );

    echo _bs_form_group(
      _bs_input_password('password', ['label' => 'Password', 'style' => 'max-width:300px'])
    );

    echo _bs_form_group(
      _bs_input_checkbox('rememberme', ['label' => 'Remember me'])
    );

    /*
    <label>
      <?php echo checkbox_tag('rememberme', '1', false, array('id' => 'rememberme', 'class' => '')) ?> Remember me
    </label>
    */

    echo _bs_form_group(
      _bs_submit_tag('Sign In', ['class' => 'btn-lg'])
    );
?>
   
    </form>

</div>

    <p><?php echo link_to('Forgot your password ?', '@forgot_password'); ?></p>