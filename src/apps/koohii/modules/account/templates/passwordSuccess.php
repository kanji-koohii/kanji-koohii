<?php use_helper('Form', 'Validation', 'Decorator'); ?>

<?php decorate_start('SideTabs', ['active' => 'changepassword']); ?>

  <h2>Change Password</h2>

<?php
    // echo form_errors();

    echo form_tag('account/password', ['class' => 'block']);

    echo _bs_form_group(
      ['validate' => 'oldpassword'],
      _bs_input_password('oldpassword', ['label' => 'Old Password', 'class' => 'JsFocusOnLoadInput'])
    );

    echo _bs_form_group(
      ['validate' => 'newpassword'],
      _bs_input_password('newpassword', ['label' => 'New Password'])
    );

    echo _bs_form_group(
      ['validate' => 'newpassword2'],
      _bs_input_password('newpassword2', ['label' => 'Confirm New Password'])
    );

    echo _bs_form_group(
      _bs_submit_tag('Update Password')
    );
?>
    </form>

<?php decorate_end(); ?>
