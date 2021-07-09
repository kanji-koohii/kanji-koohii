<?php 
  use_helper('Form', 'Validation');
  $sf_request->setParameter('_homeFooter', true);
?>

    <h2>Contact</h2>
    
    <p>Hi, I'm Fabrice!</p>

    <p>Note: you can post <strong>bugs and suggestions</strong> to our <a href="https://github.com/fabd/kanji-koohii/issues">Github issues tracker</a>.</p>

<?php if ($sf_user->isAuthenticated()): ?>

    <p style="color:#484"><em><span class="required-legend">*</span> Please provide a valid email address, it will only be used to reply to your message.</em></p>

    <div class="padded-box rounded mb-3 max-w-[600px]">

      <?php echo form_errors() ?>
      <?php echo form_tag('home/contact', ['class'=>'block']) ?>

      <div class="form-group">
        <label for="name">Name</label>
        <?php echo input_tag('name', '', ['class' => 'form-control JsFocusOnLoadInput', 'id' => 'name', 'style' => 'max-width:300px']) ?>
      </div>

      <div class="form-group">
        <label for="email_address">Email *</label>
        <input type="text" name="email" class="form-control" id="email_address" placeholder="Email" style="max-width:300px" />
      </div>

      <div class="form-group">
        <label for="message">Message</label>
        <?php echo textarea_tag('message', '', ['rows' => 8, 'class' => 'form-control']) ?>
      </div>

      <div class="form-group">
        <?php echo submit_tag('Send', ['class' => 'btn btn-lg btn-success']) ?>
      </div>

    </form>
  </div>

<?php else: ?>

    <p style="color:#844">
      The <strong>contact form</strong> is available to members only (please <?= link_to('sign in', '@login') ?>).
    </p>

    <div class="padded-box rounded mb-3 max-w-[600px]">

        <p class="mb-2">
          <strong>If you are unable to sign in</strong>, contact:<br>
          <br>
          kanji &bull; koohii &#65312; gmail &bull; com
        </p>
    </div>

<?php endif ?>

